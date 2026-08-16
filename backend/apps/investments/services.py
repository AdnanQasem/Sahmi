import json
from datetime import datetime, time
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.db.models import Max, Min, Sum
from django.utils import timezone

from apps.projects.models import Project

from .models import Investment, Milestone, ProjectFundingAccount, Repayment


FUNDED_INVESTMENT_STATUSES = (
    Investment.Status.CONFIRMED,
    Investment.Status.COMPLETED,
)
QUALITY_HOLD_DURATION = timezone.timedelta(days=3)


def repayment_status_for_date(scheduled_date, today=None):
    """Return the server-controlled open status for an installment date."""
    today = today or timezone.localdate()
    if scheduled_date < today:
        return Repayment.Status.OVERDUE
    if scheduled_date == today:
        return Repayment.Status.DUE
    return Repayment.Status.PENDING


@transaction.atomic
def sync_repayment_totals(project_id):
    """Rebuild cached repayment totals from the immutable repayment ledger."""
    project = Project.objects.select_for_update().get(pk=project_id)
    investments = list(
        Investment.objects.select_for_update().filter(project_id=project_id)
    )
    investment_ids = [investment.id for investment in investments]
    repayments = Repayment.objects.filter(investment_id__in=investment_ids)

    paid_by_investment = {
        row["investment_id"]: row
        for row in repayments.filter(status=Repayment.Status.PAID)
        .values("investment_id")
        .annotate(total=Sum("amount"), last_paid=Max("actual_payment_date"))
    }
    for investment in investments:
        paid = paid_by_investment.get(investment.id, {})
        last_paid = paid.get("last_paid")
        received_at = (
            timezone.make_aware(datetime.combine(last_paid, time.min))
            if last_paid else None
        )
        Investment.objects.filter(pk=investment.id).update(
            actual_return=paid.get("total") or Decimal("0.00"),
            return_received_at=received_at,
        )

    active = repayments.exclude(status=Repayment.Status.CANCELLED)
    obligation_total = sum(
        (
            investment.amount + investment.expected_return
            for investment in investments
            if investment.status == Investment.Status.COMPLETED
        ),
        Decimal("0.00"),
    )
    paid_total = active.filter(status=Repayment.Status.PAID).aggregate(
        total=Sum("amount")
    )["total"] or Decimal("0.00")
    scheduled_total = active.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
    next_date = active.exclude(status=Repayment.Status.PAID).aggregate(
        value=Min("scheduled_date")
    )["value"]
    has_unpaid = active.exclude(status=Repayment.Status.PAID).exists()
    has_overdue = active.filter(status=Repayment.Status.OVERDUE).exists()
    obligation_fully_scheduled = obligation_total > 0 and scheduled_total >= obligation_total
    obligation_fully_paid = obligation_total > 0 and paid_total >= obligation_total
    plan_status = (
        Project.RepaymentStatus.COMPLETED
        if obligation_fully_scheduled and obligation_fully_paid and not has_unpaid
        else Project.RepaymentStatus.DELAYED
        if has_overdue
        else Project.RepaymentStatus.ON_TRACK
    )
    Project.objects.filter(pk=project_id).update(
        total_repaid=paid_total,
        next_repayment_date=next_date,
        repayment_status=plan_status,
    )
    return {
        "obligation_total": obligation_total,
        "scheduled_total": scheduled_total,
        "paid_total": paid_total,
        "remaining_total": max(obligation_total - paid_total, Decimal("0.00")),
        "unscheduled_total": max(obligation_total - scheduled_total, Decimal("0.00")),
        "next_repayment_date": next_date,
        "status": plan_status,
    }


@transaction.atomic
def refresh_open_repayment_statuses():
    """Advance open installments to Pending, Due, or Overdue by local date."""
    today = timezone.localdate()
    changed_projects = set()
    for repayment in Repayment.objects.select_for_update().exclude(
        status__in=[Repayment.Status.PAID, Repayment.Status.CANCELLED]
    ).select_related("investment"):
        next_status = repayment_status_for_date(repayment.scheduled_date, today)
        if repayment.status != next_status:
            Repayment.objects.filter(pk=repayment.pk).update(
                status=next_status,
                updated_at=timezone.now(),
            )
            changed_projects.add(repayment.investment.project_id)
    for project_id in changed_projects:
        sync_repayment_totals(project_id)
    return len(changed_projects)


def _scheduled_transition_recipients(project):
    recipients = {project.entrepreneur_id: project.entrepreneur}
    for investment in project.investments.filter(
        status__in=FUNDED_INVESTMENT_STATUSES,
    ).select_related("investor"):
        recipients[investment.investor_id] = investment.investor
    return recipients.values()


def _notify_scheduled_project_start(project):
    from apps.notifications.models import Notification
    from apps.notifications.services import notify_on_commit

    for recipient in _scheduled_transition_recipients(project):
        notify_on_commit(
            recipient=recipient,
            notification_type=Notification.NotificationType.MILESTONE_UPDATED,
            title="Project implementation started",
            body=(
                f"Project “{project.title}” entered implementation because its "
                "first milestone date was reached."
            ),
            target_type="project",
            target_id=str(project.id),
        )


def _notify_scheduled_milestone_start(milestone):
    from apps.notifications.models import Notification
    from apps.notifications.services import notify_on_commit

    notify_on_commit(
        recipient=milestone.project.entrepreneur,
        notification_type=Notification.NotificationType.MILESTONE_UPDATED,
        title="Scheduled milestone started",
        body=(
            f"Milestone “{milestone.title}” for “{milestone.project.title}” "
            "is now in progress because its scheduled date was reached."
        ),
        target_type="milestone",
        target_id=str(milestone.id),
    )


def sync_scheduled_implementation(today=None):
    """Apply date-driven project and milestone transitions exactly once.

    A fully funded project enters implementation when the first milestone's
    target date is reached. During implementation, the latest milestone whose
    target date has arrived becomes current, while unfinished earlier active
    milestones become delayed. Completed milestones are never changed.
    """
    from apps.audit.services import log as audit_log

    today = today or timezone.localdate()
    project_ids = list(
        Project.objects.filter(
            status__in=[Project.Status.SUCCESSFUL, Project.Status.IMPLEMENTATION],
            milestones__target_date__lte=today,
        ).values_list("id", flat=True).distinct()
    )
    projects_started = 0
    milestones_started = 0
    milestones_delayed = 0

    for project_id in project_ids:
        with transaction.atomic():
            project = (
                Project.objects.select_for_update()
                .select_related("entrepreneur")
                .get(pk=project_id)
            )
            milestones = list(
                project.milestones.select_for_update().order_by(
                    "target_date", "order", "created_at"
                )
            )
            if not milestones or milestones[0].target_date > today:
                continue

            if project.status == Project.Status.SUCCESSFUL:
                try:
                    project = finalize_project_funding(project.pk, admin=None)
                except ValueError:
                    # Funding reconciliation can temporarily block the start,
                    # for example while a pending payment is still valid. The
                    # next scheduled run safely retries it.
                    continue
                project = Project.objects.select_related("entrepreneur").get(pk=project.pk)
                projects_started += 1
                _notify_scheduled_project_start(project)
                audit_log(
                    action="project.implementation_started",
                    target_type="project",
                    target_id=str(project.id),
                    metadata={
                        "reason": "first_milestone_date_reached",
                        "scheduled_date": milestones[0].target_date.isoformat(),
                    },
                )
                milestones = list(
                    project.milestones.select_for_update().order_by(
                        "target_date", "order", "created_at"
                    )
                )

            if project.status != Project.Status.IMPLEMENTATION:
                continue

            due = [milestone for milestone in milestones if milestone.target_date <= today]
            if not due:
                continue
            scheduled = due[-1]

            for milestone in due[:-1]:
                if milestone.status in {
                    Milestone.Status.PENDING,
                    Milestone.Status.IN_PROGRESS,
                }:
                    before = milestone.status
                    milestone.status = Milestone.Status.DELAYED
                    milestone.save(update_fields=["status", "updated_at"])
                    milestones_delayed += 1
                    audit_log(
                        action="milestone.status_changed",
                        target_type="milestone",
                        target_id=str(milestone.id),
                        metadata={
                            "before": before,
                            "after": Milestone.Status.DELAYED,
                            "reason": "next_milestone_date_reached",
                        },
                    )

            if scheduled.status in {Milestone.Status.PENDING, Milestone.Status.DELAYED}:
                before = scheduled.status
                scheduled.status = Milestone.Status.IN_PROGRESS
                scheduled.save(update_fields=["status", "updated_at"])
                milestones_started += 1
                audit_log(
                    action="milestone.status_changed",
                    target_type="milestone",
                    target_id=str(scheduled.id),
                    metadata={
                        "before": before,
                        "after": Milestone.Status.IN_PROGRESS,
                        "reason": "scheduled_date_reached",
                        "scheduled_date": scheduled.target_date.isoformat(),
                    },
                )
                _notify_scheduled_milestone_start(scheduled)

    return {
        "projects_started": projects_started,
        "milestones_started": milestones_started,
        "milestones_delayed": milestones_delayed,
    }


def _completion_readiness(project):
    """Return whether accepted deliverables, funding, and disbursement are complete."""
    milestones = project.milestones.all()
    all_deliverables_accepted = milestones.exists() and not milestones.exclude(
        status=Milestone.Status.COMPLETED,
        completion_status=Milestone.CompletionStatus.APPROVED,
        actual_completion_date__isnull=False,
    ).exists()
    account = ProjectFundingAccount.objects.filter(project=project).first()
    fully_funded = project.funded_amount >= project.goal_amount
    funds_disbursed = bool(account) and account.available == 0
    return all_deliverables_accepted and fully_funded and funds_disbursed


def _completion_timing(project, actual_date):
    scheduled_date = project.milestones.aggregate(date=Max("target_date"))["date"]
    if not scheduled_date:
        scheduled_date = project.end_date.date() if project.end_date else actual_date
    if actual_date < scheduled_date:
        return "early_fully_funded", scheduled_date
    if actual_date > scheduled_date:
        return "late", scheduled_date
    return "on_schedule", scheduled_date


def start_project_quality_hold(project, actor, request=None):
    """Start the mandatory 72-hour quality/handover hold after final acceptance."""
    if not _completion_readiness(project):
        return False
    if project.quality_hold_started_at:
        return False

    from apps.audit.services import log as audit_log
    from apps.notifications.models import Notification
    from apps.notifications.services import notify_on_commit

    now = timezone.now()
    timing, scheduled_date = _completion_timing(project, timezone.localdate(now))
    project.quality_hold_started_at = now
    project.quality_hold_until = now + QUALITY_HOLD_DURATION
    project.save(update_fields=["quality_hold_started_at", "quality_hold_until", "updated_at"])
    audit_log(
        action="project.quality_hold_started",
        actor=actor,
        target_type="project",
        target_id=str(project.id),
        metadata={
            "timing": timing,
            "scheduled_completion_date": scheduled_date.isoformat(),
            "hold_started_at": project.quality_hold_started_at.isoformat(),
            "hold_until": project.quality_hold_until.isoformat(),
            "budget_changed": False,
        },
        request=request,
    )
    recipients = {project.entrepreneur_id: project.entrepreneur}
    for investment in project.investments.filter(
        status__in=FUNDED_INVESTMENT_STATUSES,
    ).select_related("investor"):
        recipients[investment.investor_id] = investment.investor
    for admin in type(actor).objects.filter(is_staff=True, is_active=True):
        recipients[admin.id] = admin
    for recipient in recipients.values():
        notify_on_commit(
            recipient=recipient,
            notification_type=Notification.NotificationType.PROJECT_COMPLETION_HOLD,
            title="Project quality hold started",
            body=(
                f"The required 3-day quality and handover hold for “{project.title}” "
                f"ends at {project.quality_hold_until.isoformat()}."
            ),
            actor=actor,
            target_type="project",
            target_id=str(project.id),
        )
    return True


@transaction.atomic
def finalize_project_completion(project_id, admin, handover_notes, request=None):
    """Close a project only after its mandatory hold and explicit handover approval."""
    from apps.audit.services import log as audit_log
    from apps.audit.models import AuditLog
    from apps.notifications.models import Notification
    from apps.notifications.services import notify_on_commit

    project = Project.objects.select_for_update().select_related("entrepreneur").get(pk=project_id)
    notes = str(handover_notes or "").strip()
    if len(notes) < 10:
        raise ValueError("Handover approval notes must contain at least 10 characters.")
    if project.status != Project.Status.IMPLEMENTATION:
        raise ValueError("Only a project in implementation can be completed.")
    if not _completion_readiness(project):
        raise ValueError("All milestone deliverables must be accepted and all secured funds released first.")
    if not project.quality_hold_until:
        raise ValueError("The required 3-day quality and handover hold has not started.")
    now = timezone.now()
    if now < project.quality_hold_until:
        raise ValueError(
            f"The required 3-day quality and handover hold ends at {project.quality_hold_until.isoformat()}."
        )

    project.status = Project.Status.CLOSED
    project.completion_handover_approved_at = now
    project.completion_handover_approved_by = admin
    project.completion_handover_notes = notes
    project.save(update_fields=[
        "status", "completion_handover_approved_at", "completion_handover_approved_by",
        "completion_handover_notes", "updated_at",
    ])
    completed_ids = list(Investment.objects.filter(
        project=project, status=Investment.Status.CONFIRMED,
    ).values_list("id", flat=True))
    Investment.objects.filter(id__in=completed_ids).update(
        status=Investment.Status.COMPLETED, updated_at=now,
    )
    AuditLog.objects.bulk_create([
        AuditLog(
            actor=admin,
            action="investment.status_changed",
            target_type="investment",
            target_id=str(investment_id),
            metadata={
                "before": Investment.Status.CONFIRMED,
                "after": Investment.Status.COMPLETED,
                "reason": "quality_hold_and_handover_completed",
            },
        )
        for investment_id in completed_ids
    ])
    audit_log(
        action="project.handover_approved",
        actor=admin,
        target_type="project",
        target_id=str(project.id),
        metadata={
            "quality_hold_started_at": project.quality_hold_started_at.isoformat(),
            "quality_hold_until": project.quality_hold_until.isoformat(),
            "handover_notes": notes,
            "budget_changed": False,
        },
        request=request,
    )
    recipients = {project.entrepreneur_id: project.entrepreneur}
    for investment in project.investments.filter(
        status__in=FUNDED_INVESTMENT_STATUSES,
    ).select_related("investor"):
        recipients[investment.investor_id] = investment.investor
    for recipient in recipients.values():
        notify_on_commit(
            recipient=recipient,
            notification_type=Notification.NotificationType.PROJECT_COMPLETION_HOLD,
            title="Project handover approved",
            body=f"Project “{project.title}” completed after the required 3-day quality and handover hold.",
            actor=admin,
            target_type="project",
            target_id=str(project.id),
        )
    return project


def get_project_funding_snapshot(project):
    confirmed = Investment.objects.filter(project=project, status__in=FUNDED_INVESTMENT_STATUSES)
    funded_amount = confirmed.aggregate(total=Sum("amount"))["total"] or Decimal("0")
    investor_count = confirmed.values("investor_id").distinct().count()
    funding_percent = round((funded_amount / project.goal_amount) * Decimal("100"), 2) if project.goal_amount else Decimal("0")

    return {
        "funded_amount": funded_amount,
        "investor_count": investor_count,
        "funding_percent": float(funding_percent),
    }


def sync_project_totals(project_or_id):
    project_id = getattr(project_or_id, "pk", project_or_id)
    project = Project.objects.filter(pk=project_id).only(
        "id", "goal_amount", "status", "is_verified"
    ).first()
    if not project:
        return None

    snapshot = get_project_funding_snapshot(project)
    next_status = project.status
    update_values = {}
    just_reached_goal = False
    if snapshot["funded_amount"] >= project.goal_amount and project.status == Project.Status.ACTIVE:
        next_status = Project.Status.SUCCESSFUL
        just_reached_goal = True
        reached_at = timezone.now()
        update_values.update(
            funding_reached_at=reached_at,
            pending_payment_deadline=reached_at + timezone.timedelta(hours=24),
        )
    elif project.status == Project.Status.SUCCESSFUL and project.is_verified and not project.funding_finalized_at and snapshot["funded_amount"] < project.goal_amount:
        next_status = Project.Status.ACTIVE
        update_values.update(funding_reached_at=None, pending_payment_deadline=None)
    Project.objects.filter(pk=project.pk).update(
        funded_amount=snapshot["funded_amount"],
        investor_count=snapshot["investor_count"],
        status=next_status,
        **update_values,
    )
    if snapshot["funded_amount"] < project.goal_amount:
        invalid_milestones = list(Milestone.objects.filter(
            project_id=project.pk,
            status=Milestone.Status.IN_PROGRESS,
        ).values_list("id", flat=True))
        Milestone.objects.filter(id__in=invalid_milestones).update(
            status=Milestone.Status.PENDING,
            updated_at=timezone.now(),
        )
        if invalid_milestones:
            from apps.audit.models import AuditLog
            AuditLog.objects.bulk_create([
                AuditLog(
                    action="milestone.status_changed",
                    target_type="milestone",
                    target_id=str(milestone_id),
                    metadata={
                        "before": Milestone.Status.IN_PROGRESS,
                        "after": Milestone.Status.PENDING,
                        "reason": "project_no_longer_fully_funded",
                    },
                )
                for milestone_id in invalid_milestones
            ])
    if next_status != project.status:
        from apps.audit.models import AuditLog
        AuditLog.objects.create(
            action="project.status_changed",
            target_type="project",
            target_id=str(project.pk),
            metadata={
                "before": project.status,
                "after": next_status,
                "reason": "funding_goal_reached" if just_reached_goal else "funding_reconciled",
            },
        )
    if just_reached_goal:
        _notify_goal_reached(project.pk)
    return snapshot


def _notify_goal_reached(project_id):
    from apps.notifications.models import Notification
    from apps.notifications.services import create_notification

    project = Project.objects.select_related("entrepreneur").get(pk=project_id)
    recipients = {project.entrepreneur_id: project.entrepreneur}
    for investor in project.investments.filter(status__in=FUNDED_INVESTMENT_STATUSES).select_related("investor"):
        recipients[investor.investor_id] = investor.investor
    for recipient in recipients.values():
        create_notification(
            recipient=recipient,
            notification_type=Notification.NotificationType.FUNDING_GOAL_REACHED,
            title="Project fully funded",
            body=f"“{project.title}” reached its funding goal and is awaiting final funding review.",
            target_type="project",
            target_id=str(project.id),
        )


def expire_pending_investments(project=None):
    from apps.audit.models import AuditLog

    queryset = Investment.objects.filter(status=Investment.Status.PENDING, pending_expires_at__lte=timezone.now())
    if project is not None:
        queryset = queryset.filter(project=project)
    expired = list(queryset.values("id", "project_id"))
    project_ids = list({item["project_id"] for item in expired})
    count = queryset.update(status=Investment.Status.FAILED, updated_at=timezone.now())
    AuditLog.objects.bulk_create([
        AuditLog(
            action="investment.status_changed", target_type="investment", target_id=str(item["id"]),
            metadata={"before": Investment.Status.PENDING, "after": Investment.Status.FAILED, "reason": "pending_expired"},
        )
        for item in expired
    ])
    for project_id in project_ids:
        sync_project_totals(project_id)
    return count


@transaction.atomic
def finalize_project_funding(project_id, admin, request=None):
    from apps.audit.services import log as audit_log

    project = Project.objects.select_for_update().get(pk=project_id)
    expire_pending_investments(project)
    now = timezone.now()
    pending = Investment.objects.select_for_update().filter(
        project=project,
        status=Investment.Status.PENDING,
    )
    if pending.exists():
        if project.pending_payment_deadline and project.pending_payment_deadline > now:
            raise ValueError("Pending investments are still within their completion period.")
        pending_ids = list(pending.values_list("id", flat=True))
        pending.update(status=Investment.Status.FAILED, updated_at=now)
        from apps.audit.models import AuditLog
        AuditLog.objects.bulk_create([
            AuditLog(
                action="investment.status_changed", target_type="investment", target_id=str(investment_id),
                metadata={"before": Investment.Status.PENDING, "after": Investment.Status.FAILED, "reason": "funding_reconciliation_deadline"},
            )
            for investment_id in pending_ids
        ])
    snapshot = get_project_funding_snapshot(project)
    if snapshot["funded_amount"] < project.goal_amount:
        raise ValueError("The project has not reached its funding goal.")
    if project.status == Project.Status.IMPLEMENTATION:
        return project
    if project.status != Project.Status.SUCCESSFUL:
        raise ValueError("Only fully funded projects can enter implementation.")
    account = ProjectFundingAccount.objects.select_for_update().filter(project=project).first()
    if account is None:
        account = ProjectFundingAccount.objects.create(project=project)
    before = {
        "secured": str(account.secured),
        "released": str(account.released),
        "refunded": str(account.refunded),
    }
    account.secured = snapshot["funded_amount"] - account.released - account.refunded
    if account.secured < 0:
        raise ValueError("Funding ledger totals are inconsistent.")
    account.save(update_fields=["secured", "updated_at"])
    project.status = Project.Status.IMPLEMENTATION
    project.funding_finalized_at = now
    project.funding_finalized_by = admin
    project.save(update_fields=["status", "funding_finalized_at", "funding_finalized_by", "updated_at"])
    first_milestone = project.milestones.select_for_update().order_by("order").first()
    if first_milestone and first_milestone.status == Milestone.Status.PENDING:
        first_milestone.status = Milestone.Status.IN_PROGRESS
        first_milestone.save(update_fields=["status", "updated_at"])
        audit_log(
            action="milestone.status_changed",
            actor=admin,
            target_type="milestone",
            target_id=str(first_milestone.id),
            metadata={
                "before": Milestone.Status.PENDING,
                "after": Milestone.Status.IN_PROGRESS,
                "reason": "project_funding_finalized",
            },
            request=request,
        )
    audit_log(
        action="project.funding_finalized", actor=admin, target_type="project", target_id=str(project.id),
        metadata={
            "balances_before": before,
            "balances_after": {
                "secured": str(account.secured),
                "released": str(account.released),
                "refunded": str(account.refunded),
                "available": str(account.available),
            },
        },
        request=request,
    )
    return project


def publish_investment_confirmed_event(investment_id):
    investment = (
        Investment.objects
        .select_related("investor", "project")
        .filter(pk=investment_id)
        .first()
    )
    if not investment or investment.status not in FUNDED_INVESTMENT_STATUSES:
        return

    snapshot = sync_project_totals(investment.project)
    if not snapshot:
        return

    project = investment.project
    payload = {
        "type": "investment_confirmed",
        "project_id": str(project.id),
        "funded_amount": float(snapshot["funded_amount"]),
        "investor_count": snapshot["investor_count"],
        "funding_percent": snapshot["funding_percent"],
        "payment": {
            "id": str(investment.id),
            "investor_name": investment.investor.full_name or investment.investor.username,
            "amount": float(investment.amount),
            "date": investment.investment_date.isoformat(),
            "payment_method": investment.payment_method,
        },
    }

    try:
        import redis

        r = redis.Redis.from_url(
            settings.CELERY_BROKER_URL,
            socket_connect_timeout=1,
            socket_timeout=1,
        )
        r.publish(f"project_{project.id}", json.dumps(payload))
    except Exception as exc:
        print(f"Failed to publish event to Redis: {exc}")
