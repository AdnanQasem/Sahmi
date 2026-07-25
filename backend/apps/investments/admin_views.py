from rest_framework import permissions, viewsets

from apps.notifications.models import Notification
from apps.notifications.services import notify_on_commit

from .admin_serializers import (
    AdminInvestmentSerializer,
    AdminMilestoneSerializer,
    AdminRepaymentSerializer,
)
from .models import Investment, Milestone, Repayment


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
        previous_status = serializer.instance.status
        investment = serializer.save()
        if previous_status == investment.status:
            return

        status_label = investment.get_status_display().lower()
        notify_on_commit(
            recipient=investment.investor,
            notification_type=Notification.NotificationType.INVESTMENT_STATUS_CHANGED,
            title=f"Investment {status_label}",
            body=(
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
                title=f"Investment {status_label}",
                body=(
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
