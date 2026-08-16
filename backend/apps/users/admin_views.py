from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.admin_mixins import ApplicationAdminCreateGuardMixin

from .admin_serializers import (
    AdminPasswordResetSerializer,
    AdminUserCreateSerializer,
    AdminUserSerializer,
)


User = get_user_model()


def entrepreneur_deletion_blocker(user):
    """Return the financial prerequisite that blocks deleting an entrepreneur."""
    if user.user_type != User.UserType.ENTREPRENEUR:
        return None

    from apps.investments.models import Investment, Repayment
    from apps.projects.models import Project

    projects = list(
        Project.objects.select_for_update()
        .filter(entrepreneur=user)
    )
    project_ids = [project.pk for project in projects]
    investments = list(
        Investment.objects.select_for_update().filter(project_id__in=project_ids)
    )
    investment_ids = [investment.pk for investment in investments]
    repayments = list(
        Repayment.objects.select_for_update().filter(
            investment_id__in=investment_ids,
            status=Repayment.Status.PAID,
        )
    )
    investments_by_project = {project.pk: [] for project in projects}
    for investment in investments:
        investments_by_project[investment.project_id].append(investment)
    paid_by_investment = {investment.pk: Decimal("0.00") for investment in investments}
    for repayment in repayments:
        paid_by_investment[repayment.investment_id] += repayment.amount
    funded_statuses = {
        Investment.Status.CONFIRMED,
        Investment.Status.COMPLETED,
    }

    # Money committed to an unfinished project must leave the funded ledger
    # before cascade deletion can remove its financial history.
    if any(
        project.status != Project.Status.CLOSED
        and any(
            investment.status in funded_statuses
            for investment in investments_by_project[project.pk]
        )
        for project in projects
    ):
        return "Investments must be sent back before deleting this entrepreneur account."

    # A completed project remains financially open until principal plus the
    # captured expected profit has been fully recorded as paid.
    for project in projects:
        if project.status != Project.Status.CLOSED:
            continue
        for investment in investments_by_project[project.pk]:
            if investment.status not in funded_statuses:
                continue
            obligation = investment.amount + investment.expected_return
            paid = paid_by_investment[investment.pk]
            if paid < obligation:
                return "Return of investments must be done before deleting this entrepreneur account."

    return None


class AdminUserViewSet(ApplicationAdminCreateGuardMixin, viewsets.ModelViewSet):
    queryset = User.objects.all().prefetch_related("groups", "user_permissions")
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = [
        "user_type",
        "is_active",
        "is_verified",
        "is_kyc_verified",
        "is_staff",
        "is_superuser",
        "investor_tier",
        "risk_preference",
        "country",
    ]
    search_fields = [
        "email",
        "username",
        "full_name",
        "phone_number",
        "business_name",
        "business_registration_number",
    ]
    ordering_fields = [
        "email",
        "full_name",
        "date_joined",
        "last_login",
        "user_type",
        "is_active",
        "is_staff",
        "total_invested",
        "total_funded",
    ]
    ordering = ["-date_joined"]
    creation_denied_message = "Application administrators cannot create users."

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_superuser:
            return queryset
        return queryset.filter(is_superuser=False)

    def get_serializer_class(self):
        if self.action == "create":
            return AdminUserCreateSerializer
        if self.action == "reset_password":
            return AdminPasswordResetSerializer
        return AdminUserSerializer

    @staticmethod
    def _lock_administrator_rows():
        # Serializes concurrent demotions/deletions so two requests cannot both
        # observe another administrator and remove the final accounts together.
        list(
            User.objects.select_for_update()
            .filter(Q(is_staff=True) | Q(is_superuser=True))
            .values_list("pk", flat=True)
        )

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        self._lock_administrator_rows()
        return super().update(request, *args, **kwargs)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        self._lock_administrator_rows()
        instance = User.objects.select_for_update().get(pk=self.get_object().pk)
        if instance.pk == request.user.pk:
            raise serializers.ValidationError(
                {"detail": "You cannot delete your own account."}
            )
        if instance.is_active and instance.is_staff and not User.objects.exclude(
            pk=instance.pk
        ).filter(is_active=True, is_staff=True).exists():
            raise serializers.ValidationError(
                {"detail": "At least one active staff account must remain."}
            )
        if instance.is_active and instance.is_superuser and not User.objects.exclude(
            pk=instance.pk
        ).filter(is_active=True, is_superuser=True).exists():
            raise serializers.ValidationError(
                {"detail": "At least one active superuser must remain."}
            )
        financial_blocker = entrepreneur_deletion_blocker(instance)
        if financial_blocker:
            raise serializers.ValidationError({"detail": financial_blocker})
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        user = self.get_object()
        serializer = self.get_serializer(
            data=request.data,
            context={"request": request, "user": user},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Password reset successfully."})
