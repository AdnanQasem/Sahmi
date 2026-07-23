from rest_framework import serializers

from apps.notifications.models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "title",
            "body",
            "actor",
            "target_type",
            "target_id",
            "read_at",
            "delivery_status",
            "created_at",
        ]
        read_only_fields = fields


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            "in_app_enabled",
            "email_enabled",
            "message_notifications",
            "project_notifications",
            "investment_notifications",
            "milestone_notifications",
            "repayment_notifications",
        ]
        read_only_fields = []  # all listed fields are user-editable preferences
