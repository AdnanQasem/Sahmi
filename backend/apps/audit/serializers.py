from rest_framework import serializers

from apps.audit.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_detail = serializers.SerializerMethodField()

    def get_actor_detail(self, obj):
        if not obj.actor:
            return None
        return {
            "id": str(obj.actor_id),
            "email": obj.actor.email,
            "full_name": obj.actor.full_name,
            "user_type": obj.actor.user_type,
        }

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor",
            "actor_detail",
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
