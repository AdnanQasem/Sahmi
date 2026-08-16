from datetime import timedelta

from django.db import models
from django.db.models import Count, Q, Sum
from django.utils import timezone


def is_participant(user, conversation):
    """Return whether an authenticated user belongs to the conversation."""
    if user is None or not user.is_authenticated:
        return False
    from apps.messaging.models import ConversationParticipant

    return ConversationParticipant.objects.filter(
        conversation=conversation,
        user=user,
    ).exists()


def _direct_key(user_a, user_b):
    """Return a stable string uniquely identifying a 1:1 conversation."""
    ids = sorted(str(user_a.pk) for user_a in (user_a, user_b))
    return f"direct:{ids[0]}:{ids[1]}"


def get_or_create_direct_conversation(actor, other):
    """
    Create or reuse a direct conversation between ``actor`` and ``other``.

    The function is idempotent so that the same pair always reuses the same
    conversation regardless of which user initiated it. Both users become
    participants. ``actor`` becomes ``created_by``.
    """
    from apps.messaging.models import (
        Conversation,
        ConversationParticipant,
    )

    if actor.pk == other.pk:
        raise ValueError("Cannot create a direct conversation with yourself only.")

    key = _direct_key(actor, other)
    conversation, created = Conversation.objects.get_or_create(
        kind=Conversation.KIND_DIRECT,
        direct_key=key,
        defaults={"created_by": actor},
    )
    ConversationParticipant.objects.get_or_create(
        conversation=conversation, user=actor
    )
    ConversationParticipant.objects.get_or_create(
        conversation=conversation, user=other
    )
    return conversation


def create_project_conversation(actor, other, project):
    """
    Create a project-related conversation between two users. Unlike direct
    conversations, project conversations are not deduplicated.
    """
    from apps.messaging.models import (
        Conversation,
        ConversationParticipant,
    )

    if actor.pk == other.pk:
        raise ValueError("Cannot create a project conversation with yourself only.")

    conversation = Conversation.objects.create(
        kind=Conversation.KIND_PROJECT,
        created_by=actor,
        project=project,
        title=project.title[:160] if project.title else "",
    )
    ConversationParticipant.objects.bulk_create(
        [
            ConversationParticipant(conversation=conversation, user=actor),
            ConversationParticipant(conversation=conversation, user=other),
        ]
    )
    return conversation


def send_message(conversation, sender, body="", attachment=None):
    """
    Persist a new message against ``conversation`` on behalf of ``sender``.

    It is the caller's responsibility to verify that ``sender`` is a participant
    of the conversation.
    """
    from pathlib import Path

    from apps.messaging.models import MAX_MESSAGE_LENGTH, Message
    from apps.messaging.validators import validate_message_attachment

    body = (body or "").strip()
    if not body and not attachment:
        raise ValueError("Add a message or an attachment.")
    if len(body) > MAX_MESSAGE_LENGTH:
        raise ValueError("Message body is too long.")

    if attachment:
        validate_message_attachment(attachment)
    message = Message.objects.create(
        conversation=conversation,
        sender=sender,
        body=body,
        attachment=attachment,
        attachment_name=Path(attachment.name).name[:255] if attachment else "",
        attachment_content_type=(getattr(attachment, "content_type", "") or "")[:120] if attachment else "",
        attachment_size=attachment.size if attachment else 0,
    )
    conversation.last_message_at = message.created_at
    conversation.save(update_fields=["last_message_at"])
    return message


def edit_message(message, actor, body):
    """Edit a message owned by ``actor``. Returns True if the body changed."""
    from apps.messaging.models import MAX_MESSAGE_LENGTH, Message

    if message.sender_id != actor.pk:
        raise PermissionError("Only the sender may edit a message.")
    if message.is_deleted:
        raise ValueError("Deleted messages cannot be edited.")
    body = (body or "").strip()
    if not body:
        raise ValueError("Message body cannot be empty.")
    if len(body) > MAX_MESSAGE_LENGTH:
        raise ValueError("Message body is too long.")
    if body == message.body:
        return False
    message.body = body
    message.edited_at = timezone.now()
    message.save(update_fields=["body", "edited_at", "updated_at"])
    return True


def soft_delete_message(message, actor):
    """Soft-delete a message owned by ``actor``."""
    if message.sender_id != actor.pk:
        raise PermissionError("Only the sender may delete a message.")
    if message.is_deleted:
        return False
    message.deleted_at = timezone.now()
    message.save(update_fields=["deleted_at", "updated_at"])
    return True


def mark_conversation_read(conversation, user):
    """Update the participant's last-read marker for the given conversation."""
    from apps.messaging.models import ConversationParticipant

    now = timezone.now()
    updated = ConversationParticipant.objects.filter(
        conversation=conversation, user=user
    ).update(last_read_at=now)
    return bool(updated)


def archive_conversation(conversation, user, archived=True):
    from apps.messaging.models import ConversationParticipant

    updated = ConversationParticipant.objects.filter(
        conversation=conversation, user=user
    ).update(is_archived=archived)
    return bool(updated)


def mute_conversation(conversation, user, muted=True):
    from apps.messaging.models import ConversationParticipant

    updated = ConversationParticipant.objects.filter(
        conversation=conversation, user=user
    ).update(is_muted=muted)
    return bool(updated)


def unread_count_for_user(user):
    """Total count of unread messages across all the user's conversations."""
    from apps.messaging.models import ConversationParticipant, Message

    participation_qs = ConversationParticipant.objects.filter(user=user)
    total = 0
    for participation in participation_qs:
        cutoff = participation.last_read_at or participation.joined_at - timedelta(seconds=1)
        total += Message.objects.filter(
            conversation_id=participation.conversation_id,
            created_at__gt=cutoff,
            deleted_at__isnull=True,
        ).exclude(sender=user).count()
    return total


def unread_counts_by_conversation(user):
    """Map of conversation_id -> unread count for the given user."""
    from apps.messaging.models import ConversationParticipant, Message

    out = {}
    for participation in ConversationParticipant.objects.filter(user=user):
        cutoff = participation.last_read_at or participation.joined_at - timedelta(seconds=1)
        out[str(participation.conversation_id)] = Message.objects.filter(
            conversation_id=participation.conversation_id,
            created_at__gt=cutoff,
            deleted_at__isnull=True,
        ).exclude(sender=user).count()
    return out
