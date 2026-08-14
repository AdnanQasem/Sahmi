import uuid

from django.conf import settings
from django.db import models

from apps.core.models import UUIDTimestampModel


class AuditLog(UUIDTimestampModel):
    class Result(models.TextChoices):
        SUCCESS = "success", "Success"
        FAILURE = "failure", "Failure"
        DENIED = "denied", "Denied"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="audit_actions",
        null=True,
        blank=True,
    )
    action = models.CharField(max_length=80, db_index=True)
    target_type = models.CharField(max_length=60, blank=True)
    target_id = models.CharField(max_length=64, blank=True)
    result = models.CharField(
        max_length=20, choices=Result.choices, default=Result.SUCCESS
    )
    metadata = models.JSONField(default=dict, blank=True)
    request_id = models.CharField(max_length=64, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["actor", "created_at"]),
            models.Index(fields=["action", "created_at"]),
            models.Index(fields=["target_type", "target_id", "created_at"]),
            models.Index(fields=["result", "created_at"]),
        ]

    def __str__(self):
        return f"{self.action}:{self.id}"
