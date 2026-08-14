import uuid

from django.conf import settings
from django.core.validators import MaxLengthValidator
from django.db import models

from apps.core.models import UUIDTimestampModel

MAX_MESSAGE_LENGTH = 5000


class Conversation(UUIDTimestampModel):
    """
    A conversation between two or more users, optionally anchored to a project.

    Direct (1:1) conversations are deduplicated by ``direct_key`` so that the same
    pair of users always reuses the same conversation.
    """

    KIND_DIRECT = "direct"
    KIND_PROJECT = "project"
    KIND_GROUP = "group"
    KIND_CHOICES = [
        (KIND_DIRECT, "Direct"),
        (KIND_PROJECT, "Project"),
        (KIND_GROUP, "Group"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default=KIND_DIRECT)
    title = models.CharField(max_length=160, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_conversations",
    )
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="conversations",
        null=True,
        blank=True,
    )
    direct_key = models.CharField(
        max_length=128,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text="Deterministic key deduplicating 1:1 direct conversations.",
    )
    is_archived = models.BooleanField(default=False)
    last_message_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ["-last_message_at", "-created_at"]
        indexes = [
            models.Index(fields=["kind", "last_message_at"]),
            models.Index(fields=["project", "last_message_at"]),
            models.Index(fields=["direct_key"]),
        ]

    def __str__(self):
        return f"{self.kind}:{self.id}"


class ConversationParticipant(UUIDTimestampModel):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="participants",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversation_participations",
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)
    is_muted = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["conversation", "user"],
                name="unique_conversation_participant",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "conversation"]),
            models.Index(fields=["conversation", "user"]),
            models.Index(fields=["user", "is_archived"]),
        ]


class Message(UUIDTimestampModel):
    MAX_MESSAGE_LENGTH = MAX_MESSAGE_LENGTH
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )
    body = models.TextField(
        validators=[MaxLengthValidator(MAX_MESSAGE_LENGTH)],
        help_text="Plain-text only. Never rendered as HTML.",
    )
    edited_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["conversation", "created_at"]),
            models.Index(fields=["sender", "created_at"]),
        ]

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None
