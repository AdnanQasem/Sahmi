from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from .models import Investment, Milestone, Repayment
from .permissions import InvestmentPermission, MilestonePermission, RepaymentPermission
from .serializers import InvestmentSerializer, MilestoneSerializer, RepaymentSerializer
from .services import sync_project_totals


class InvestmentViewSet(viewsets.ModelViewSet):
    serializer_class = InvestmentSerializer
    permission_classes = [InvestmentPermission]
    filterset_fields = ["project", "status", "payment_method"]
    ordering_fields = ["investment_date", "amount", "status"]
    queryset = Investment.objects.none()

    def get_queryset(self):
        user = self.request.user
        queryset = Investment.objects.select_related(
            "investor", "project", "project__entrepreneur"
        )
        if not user.is_authenticated:
            return queryset.none()
        if user.is_staff:
            return queryset
        # Investors see their own; entrepreneurs see those for their projects.
        # Field-level scope is enforced inside the serializer representation later
        # — here we only leak the existence of investments, not extra PII.
        return (queryset.filter(investor=user)
                | queryset.filter(project__entrepreneur=user)).distinct()

    def perform_create(self, serializer):
        investment = serializer.save(investor=self.request.user)
        from apps.notifications.models import Notification
        from apps.notifications.services import notify_on_commit

        notify_on_commit(
            recipient=investment.investor,
            notification_type=Notification.NotificationType.INVESTMENT_CREATED,
            title="Investment recorded",
            body=f"Your investment record of {investment.amount} has been created (pending).",
            actor=self.request.user,
            target_type="investment",
            target_id=str(investment.id),
        )
        # Notify the project owner too.
        owner = investment.project.entrepreneur
        if owner and owner.pk != investment.investor_id:
            notify_on_commit(
                recipient=owner,
                notification_type=Notification.NotificationType.INVESTMENT_CREATED,
                title="New investment received",
                body=f"A new investment record ({investment.amount}) is pending on your project “{investment.project.title}”.",
                actor=investment.investor,
                target_type="investment",
                target_id=str(investment.id),
            )

    def perform_update(self, serializer):
        old_project_id = serializer.instance.project_id
        new_project = serializer.validated_data.get("project", serializer.instance.project)
        if not self.request.user.is_staff and new_project.pk != old_project_id:
            raise PermissionDenied("Project reassignment is administrator-controlled.")
        with transaction.atomic():
            investment = serializer.save()
            sync_project_totals(old_project_id)
            if investment.project_id != old_project_id:
                sync_project_totals(investment.project_id)

    def perform_destroy(self, instance):
        project_id = instance.project_id
        with transaction.atomic():
            instance.delete()
            sync_project_totals(project_id)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated],
        url_path="cancel",
    )
    def cancel(self, request, pk=None):
        """An investor may withdraw their own pending investment."""
        investment = self.get_object()
        if investment.investor_id != request.user.id and not request.user.is_staff:
            raise PermissionDenied("You can only cancel your own investments.")
        if investment.status != Investment.Status.PENDING:
            raise ValidationError("Only pending investments can be cancelled.")
        with transaction.atomic():
            investment.status = Investment.Status.CANCELED
            investment.save(update_fields=["status", "updated_at"])
            sync_project_totals(investment.project_id)
        from apps.notifications.models import Notification
        from apps.notifications.services import notify_on_commit

        notify_on_commit(
            recipient=investment.investor,
            notification_type=Notification.NotificationType.INVESTMENT_STATUS_CHANGED,
            title="Investment cancelled",
            body="Your investment has been cancelled.",
            actor=request.user,
            target_type="investment",
            target_id=str(investment.id),
        )
        return Response(InvestmentSerializer(investment).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAdminUser],
        url_path="confirm",
    )
    def confirm(self, request, pk=None):
        """Only an authorized staff member may confirm an investment."""
        investment = self.get_object()
        if investment.status == Investment.Status.CONFIRMED:
            return Response(InvestmentSerializer(investment).data)
        if investment.status != Investment.Status.PENDING:
            raise ValidationError(
                "Only pending investments can be confirmed by an administrator."
            )
        with transaction.atomic():
            investment.status = Investment.Status.CONFIRMED
            investment.save(update_fields=["status", "updated_at"])
            sync_project_totals(investment.project_id)
        from apps.notifications.models import Notification
        from apps.notifications.services import notify_on_commit

        notify_on_commit(
            recipient=investment.investor,
            notification_type=Notification.NotificationType.INVESTMENT_STATUS_CHANGED,
            title="Investment confirmed",
            body=f"Your investment of {investment.amount} has been confirmed.",
            actor=request.user,
            target_type="investment",
            target_id=str(investment.id),
        )
        owner = investment.project.entrepreneur
        if owner and owner.pk != investment.investor_id:
            notify_on_commit(
                recipient=owner,
                notification_type=Notification.NotificationType.INVESTMENT_STATUS_CHANGED,
                title="Investment confirmed",
                body=f"An investment of {investment.amount} on your project “{investment.project.title}” has been confirmed.",
                actor=request.user,
                target_type="investment",
                target_id=str(investment.id),
            )
        return Response(InvestmentSerializer(investment).data)


class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.select_related("project", "project__entrepreneur")
    serializer_class = MilestoneSerializer
    permission_classes = [MilestonePermission]
    filterset_fields = ["project", "status"]
    ordering_fields = ["target_date", "order", "status"]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.is_staff:
            return queryset
        return queryset.filter(project__entrepreneur=user)

    def _ensure_project_access(self, project):
        if not self.request.user.is_staff and project.entrepreneur_id != self.request.user.id:
            raise PermissionDenied('You can only create milestones for your own projects.')

    def perform_create(self, serializer):
        self._ensure_project_access(serializer.validated_data['project'])
        serializer.save()

    def perform_update(self, serializer):
        project = serializer.validated_data.get('project', serializer.instance.project)
        self._ensure_project_access(project)
        original_status = serializer.instance.status if serializer.instance else None
        milestone = serializer.save()
        if original_status != milestone.status:
            from apps.notifications.models import Notification
            from apps.notifications.services import notify_on_commit

            notify_on_commit(
                recipient=milestone.project.entrepreneur,
                notification_type=Notification.NotificationType.MILESTONE_UPDATED,
                title="Milestone updated",
                body=f"Milestone “{milestone.title}” was updated.",
                actor=self.request.user,
                target_type="milestone",
                target_id=str(milestone.id),
            )


class RepaymentViewSet(viewsets.ModelViewSet):
    queryset = Repayment.objects.select_related("investment", "investment__investor", "investment__project")
    serializer_class = RepaymentSerializer
    permission_classes = [RepaymentPermission]
    filterset_fields = ["investment", "status", "scheduled_date"]
    ordering_fields = ["scheduled_date", "amount", "status"]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.is_staff:
            return queryset
        return (queryset.filter(investment__investor=user)
                | queryset.filter(investment__project__entrepreneur=user)).distinct()

    def _ensure_investment_access(self, investment):
        is_related_party = (
            investment.investor_id == self.request.user.id
            or investment.project.entrepreneur_id == self.request.user.id
        )
        if not self.request.user.is_staff and not is_related_party:
            raise PermissionDenied(
                'You can only create repayments for investments you are involved in.'
            )

    def perform_create(self, serializer):
        self._ensure_investment_access(serializer.validated_data['investment'])
        serializer.save()

    def perform_update(self, serializer):
        investment = serializer.validated_data.get(
            'investment',
            serializer.instance.investment,
        )
        self._ensure_investment_access(investment)
        original_status = serializer.instance.status if serializer.instance else None
        repayment = serializer.save()
        if original_status != repayment.status:
            from apps.notifications.models import Notification
            from apps.notifications.services import notify_on_commit

            notify_on_commit(
                recipient=repayment.investment.investor,
                notification_type=Notification.NotificationType.REPAYMENT_UPDATED,
                title="Repayment updated",
                body="A repayment record you are party to has been updated.",
                actor=self.request.user,
                target_type="repayment",
                target_id=str(repayment.id),
            )
