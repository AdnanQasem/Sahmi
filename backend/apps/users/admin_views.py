from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .admin_serializers import (
    AdminPasswordResetSerializer,
    AdminUserCreateSerializer,
    AdminUserSerializer,
)


User = get_user_model()


class AdminUserViewSet(viewsets.ModelViewSet):
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
        instance = self.get_object()
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
