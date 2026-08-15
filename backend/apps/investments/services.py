import json
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from apps.projects.models import Project

from .models import Investment, Milestone, ProjectFundingAccount


FUNDED_INVESTMENT_STATUSES = (
    Investment.Status.CONFIRMED,
    Investment.Status.COMPLETED,
)


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
