from rest_framework import serializers

from apps.audit.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor",
            "action",
            "target_type",
            "target_id",
            "result",
            "metadata",
            "request_id",
            "ip_address",
            "user_agent",
            "created_at",
        ]
        read_only_fields = fields
