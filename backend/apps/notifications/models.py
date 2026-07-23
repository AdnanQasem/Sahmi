import uuid

from django.conf import settings
from django.db import models

from apps.core.models import UUIDTimestampModel


class Notification(UUIDTimestampModel):
    class NotificationType(models.TextChoices):
        MESSAGE_RECEIVED = "message_received", "Message received"
        PROJECT_SUBMITTED = "project_submitted", "Project submitted"
        PROJECT_VERIFIED = "project_verified", "Project verified"
        PROJECT_REJECTED = "project_rejected", "Project rejected"
        INVESTMENT_CREATED = "investment_created", "Investment created"
        INVESTMENT_STATUS_CHANGED = "investment_status_changed", (
            "Investment status changed"
        )
        MILESTONE_UPDATED = "milestone_updated", "Milestone updated"
        REPAYMENT_UPDATED = "repayment_updated", "Repayment updated"
        SYSTEM = "system", "System"

    class DeliveryStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        DELIVERED_IN_APP = "delivered_in_app", "Delivered in app"
        EMAIL_SENT = "email_sent", "Email sent"
        EMAIL_FAILED = "email_failed", "Email failed"
        SKIPPED = "skipped", "Skipped (preference)"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="triggered_notifications",
        null=True,
        blank=True,
    )
    notification_type = models.CharField(
        max_length=40,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
    )
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    target_type = models.CharField(max_length=40, blank=True)
    target_id = models.CharField(max_length=64, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    delivery_status = models.CharField(
        max_length=30,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.PENDING,
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "read_at"]),
            models.Index(fields=["recipient", "notification_type", "created_at"]),
            models.Index(fields=["recipient", "delivery_status", "created_at"]),
        ]

    def __str__(self):
        return f"{self.notification_type}:{self.id}"


class NotificationPreference(UUIDTimestampModel):
    """
    Per-user delivery preferences. Defaults preserve important account and
    security events by keeping in-app notifications on.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_preference",
    )
    in_app_enabled = models.BooleanField(default=True)
    email_enabled = models.BooleanField(default=False)
    message_notifications = models.BooleanField(default=True)
    project_notifications = models.BooleanField(default=True)
    investment_notifications = models.BooleanField(default=True)
    milestone_notifications = models.BooleanField(default=True)
    repayment_notifications = models.BooleanField(default=True)

    class Meta:
        indexes = [models.Index(fields=["user"])]
