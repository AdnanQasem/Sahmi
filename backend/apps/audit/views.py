from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAdminUser

from apps.audit.models import AuditLog
from apps.audit.serializers import AuditLogSerializer


class AuditLogViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Read-only admin-only audit log endpoint."""

    permission_classes = [IsAdminUser]
    serializer_class = AuditLogSerializer
    filterset_fields = ["action", "target_type", "result", "actor"]
    search_fields = ["action", "metadata", "target_type"]
    ordering_fields = ["created_at", "action"]
    queryset = AuditLog.objects.select_related("actor").all()
