from rest_framework import permissions, viewsets
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum
from rest_framework.exceptions import ValidationError

from apps.notifications.models import Notification
from apps.notifications.services import notify_on_commit
from apps.projects.models import Project

from .admin_serializers import (
    AdminInvestmentSerializer,
    AdminMilestoneSerializer,
    AdminRepaymentSerializer,
)
from .models import Investment, Milestone, ProjectFundingAccount, Repayment
from .services import FUNDED_INVESTMENT_STATUSES


class AdminInvestmentViewSet(viewsets.ModelViewSet):
    queryset = Investment.objects.select_related(
        "investor", "project", "project__entrepreneur"
    )
    serializer_class = AdminInvestmentSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = {
        "investor": ["exact"],
        "project": ["exact"],
        "status": ["exact"],
        "payment_method": ["exact"],
        "investment_date": ["date", "gte", "lte"],
        "return_received_at": ["date", "gte", "lte", "isnull"],
    }
    search_fields = [
        "transaction_id", "notes", "investor__email", "investor__full_name",
        "project__title", "project__slug",
    ]
    ordering_fields = [
        "investment_date", "created_at", "updated_at", "amount", "quantity",
        "status", "expected_return", "actual_return", "return_received_at",
    ]
    ordering = ["-investment_date"]

    def perform_update(self, serializer):
        with transaction.atomic():
            locked = Investment.objects.select_for_update().select_related("project").get(pk=serializer.instance.pk)
            previous_status = locked.status
            next_status = serializer.validated_data.get("status", previous_status)
            if previous_status == Investment.Status.PENDING and next_status == Investment.Status.CONFIRMED:
                project = Project.objects.select_for_update().get(pk=locked.project_id)
                if project.status != Project.Status.ACTIVE:
                    raise ValidationError({"status": "This project is no longer accepting investment confirmations."})
                funded = Investment.objects.filter(
                    project=project,
                    status__in=FUNDED_INVESTMENT_STATUSES,
                ).exclude(pk=locked.pk).aggregate(total=Sum("amount"))["total"] or 0
                if funded + serializer.validated_data.get("amount", locked.amount) > project.goal_amount:
                    raise ValidationError({"amount": f"Exceeding value. Remaining funding is {max(project.goal_amount - funded, 0)}."})
            serializer.instance = locked
            investment = serializer.save()
        if previous_status == investment.status:
            return

        from apps.audit.services import log as audit_log
        audit_log(
            action="investment.status_changed", actor=self.request.user, target_type="investment",
            target_id=str(investment.id), metadata={"before": previous_status, "after": investment.status},
            request=self.request,
        )

        status_label = investment.get_status_display().lower()
        confirmed = investment.status == Investment.Status.CONFIRMED
        title = "Investment confirmed" if confirmed else f"Investment {status_label}"
        confirmed_body = f"An investment of {investment.amount} on your project {investment.project.title} has been confirmed."
        notify_on_commit(
            recipient=investment.investor,
            notification_type=Notification.NotificationType.INVESTMENT_STATUS_CHANGED,
            title=title,
            body=confirmed_body if confirmed else (
                f"Your investment of {investment.amount} in "
                f"“{investment.project.title}” is now {status_label}."
            ),
            actor=self.request.user,
            target_type="investment",
            target_id=str(investment.id),
        )

        owner = investment.project.entrepreneur
        if owner and owner.pk != investment.investor_id:
            notify_on_commit(
                recipient=owner,
                notification_type=Notification.NotificationType.INVESTMENT_STATUS_CHANGED,
                title=title,
                body=confirmed_body if confirmed else (
                    f"An investment of {investment.amount} in "
                    f"“{investment.project.title}” is now {status_label}."
                ),
                actor=self.request.user,
                target_type="investment",
                target_id=str(investment.id),
            )


class AdminMilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.select_related("project", "project__entrepreneur")
    serializer_class = AdminMilestoneSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = {
        "project": ["exact"],
        "status": ["exact"],
        "target_date": ["exact", "gte", "lte"],
        "actual_completion_date": ["exact", "gte", "lte", "isnull"],
    }
    search_fields = [
        "title", "description", "deliverables", "project__title", "project__slug",
    ]
    ordering_fields = [
        "target_date", "actual_completion_date", "order", "status",
        "percentage_of_project", "funding_released", "created_at", "updated_at",
    ]
    ordering = ["project", "order"]

    @transaction.atomic
    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        milestone = serializer.save()
        if previous_status == milestone.status:
            return
        project = Project.objects.select_for_update().get(pk=milestone.project_id)
        recipients = {project.entrepreneur_id: project.entrepreneur}
        for investment in project.investments.filter(status__in=FUNDED_INVESTMENT_STATUSES).select_related("investor"):
            recipients[investment.investor_id] = investment.investor
        for recipient in recipients.values():
            notify_on_commit(
                recipient=recipient,
                notification_type=Notification.NotificationType.MILESTONE_UPDATED,
                title="Milestone approved" if milestone.status == Milestone.Status.COMPLETED else "Milestone updated",
                body=f"Milestone “{milestone.title}” for “{project.title}” is now {milestone.get_status_display().lower()}.",
                actor=self.request.user, target_type="milestone", target_id=str(milestone.id),
            )
        if milestone.status == Milestone.Status.COMPLETED:
            all_complete = project.milestones.exclude(status=Milestone.Status.COMPLETED).exists() is False
            account = ProjectFundingAccount.objects.select_for_update().filter(project=project).first()
            if not all_complete:
                next_milestone = project.milestones.select_for_update().filter(
                    order__gt=milestone.order,
                    status=Milestone.Status.PENDING,
                ).order_by("order").first()
                if next_milestone:
                    next_milestone.status = Milestone.Status.IN_PROGRESS
                    next_milestone.save(update_fields=["status", "updated_at"])
                    from apps.audit.services import log as audit_log
                    audit_log(
                        action="milestone.status_changed",
                        actor=self.request.user,
                        target_type="milestone",
                        target_id=str(next_milestone.id),
                        metadata={
                            "before": Milestone.Status.PENDING,
                            "after": Milestone.Status.IN_PROGRESS,
                            "reason": "previous_milestone_completed",
                        },
                        request=self.request,
                    )
            if all_complete and account and account.available == 0 and project.status == Project.Status.IMPLEMENTATION:
                previous_project_status = project.status
                project.status = Project.Status.CLOSED
                project.save(update_fields=["status", "updated_at"])
                completed_ids = list(Investment.objects.filter(
                    project=project, status=Investment.Status.CONFIRMED,
                ).values_list("id", flat=True))
                Investment.objects.filter(id__in=completed_ids).update(
                    status=Investment.Status.COMPLETED, updated_at=timezone.now(),
                )
                from apps.audit.services import log as audit_log
                from apps.audit.models import AuditLog
                AuditLog.objects.bulk_create([
                    AuditLog(
                        actor=self.request.user, action="investment.status_changed",
                        target_type="investment", target_id=str(investment_id),
                        metadata={"before": Investment.Status.CONFIRMED, "after": Investment.Status.COMPLETED, "reason": "project_completed"},
                    )
                    for investment_id in completed_ids
                ])
                audit_log(
                    action="project.status_changed", actor=self.request.user, target_type="project",
                    target_id=str(project.id), metadata={"before": previous_project_status, "after": project.status},
                    request=self.request,
                )


class AdminRepaymentViewSet(viewsets.ModelViewSet):
    queryset = Repayment.objects.select_related(
        "investment", "investment__investor", "investment__project",
        "investment__project__entrepreneur",
    )
    serializer_class = AdminRepaymentSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = {
        "investment": ["exact"],
        "status": ["exact"],
        "payment_method": ["exact"],
        "scheduled_date": ["exact", "gte", "lte"],
        "actual_payment_date": ["exact", "gte", "lte", "isnull"],
    }
    search_fields = [
        "transaction_id", "notes", "investment__investor__email",
        "investment__investor__full_name", "investment__project__title",
        "investment__project__slug",
    ]
    ordering_fields = [
        "scheduled_date", "actual_payment_date", "amount", "status",
        "created_at", "updated_at",
    ]
    ordering = ["scheduled_date"]
