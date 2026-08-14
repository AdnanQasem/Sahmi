from rest_framework import serializers

from apps.messaging.models import (
    MAX_MESSAGE_LENGTH,
    Conversation,
    ConversationParticipant,
    Message,
)
from apps.messaging.services import (
    create_project_conversation,
    get_or_create_direct_conversation,
)


class MinimalUserSerializer(serializers.ModelSerializer):
    """Public-friendly summary used as participant representation."""

    class Meta:
        from apps.users.models import User

        model = User
        fields = ["id", "full_name", "user_type"]
        read_only_fields = fields


class ConversationParticipantSerializer(serializers.ModelSerializer):
    user = MinimalUserSerializer(read_only=True)

    class Meta:
        model = ConversationParticipant
        fields = ["id", "user", "joined_at", "last_read_at", "is_muted", "is_archived"]
        read_only_fields = ["id", "user", "joined_at", "last_read_at"]


class ConversationSerializer(serializers.ModelSerializer):
    participants = ConversationParticipantSerializer(many=True, read_only=True)
    last_message_preview = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    created_by = MinimalUserSerializer(read_only=True)

    class Meta:
        model = Conversation
        fields = [
            "id",
            "kind",
            "title",
            "project",
            "created_by",
            "participants",
            "last_message_preview",
            "unread_count",
            "is_archived",
            "last_message_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "kind",
            "title",
            "project",
            "created_by",
            "participants",
            "last_message_preview",
            "unread_count",
            "last_message_at",
            "created_at",
            "updated_at",
        ]

    def get_last_message_preview(self, obj):
        last = (
            obj.messages.filter(deleted_at__isnull=True)
            .order_by("-created_at")
            .first()
        )
        if not last:
            return None
        return {
            "id": str(last.id),
            "sender_id": str(last.sender_id),
            "preview": last.body[:200],
            "created_at": last.created_at.isoformat() if last.created_at else None,
        }

    def get_unread_count(self, obj):
        from apps.messaging.services import unread_counts_by_conversation

        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0
        counts = self.context.get("_unread_counts_cache")
        if counts is None:
            counts = unread_counts_by_conversation(request.user)
            self.context["_unread_counts_cache"] = counts
        return counts.get(str(obj.id), 0)


class CreateDirectConversationSerializer(serializers.Serializer):
    other_user_id = serializers.UUIDField()

    def validate_other_user_id(self, value):
        from apps.users.models import User

        try:
            User.objects.get(pk=value)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("User does not exist.") from exc
        return value

    def create(self, validated_data):
        request = self.context["request"]
        from apps.users.models import User

        other = User.objects.get(pk=validated_data["other_user_id"])
        return get_or_create_direct_conversation(
            actor=request.user, other=other
        )


class CreateProjectConversationSerializer(serializers.Serializer):
    other_user_id = serializers.UUIDField(required=True)
    project_id = serializers.UUIDField(required=True)

    def validate_other_user_id(self, value):
        from apps.users.models import User

        if not User.objects.filter(pk=value).exists():
            raise serializers.ValidationError("User does not exist.")
        return value

    def validate_project_id(self, value):
        from apps.projects.models import Project

        if not Project.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Project does not exist.")
        return value

    def create(self, validated_data):
        request = self.context["request"]
        from apps.projects.models import Project
        from apps.users.models import User

        other = User.objects.get(pk=validated_data["other_user_id"])
        project = Project.objects.get(pk=validated_data["project_id"])
        return create_project_conversation(
            actor=request.user, other=other, project=project
        )


class MessageSerializer(serializers.ModelSerializer):
    body = serializers.SerializerMethodField()
    sender = MinimalUserSerializer(read_only=True)
    sender_id = serializers.PrimaryKeyRelatedField(
        read_only=True, source="sender"
    )
    is_deleted = serializers.BooleanField(read_only=True)
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "sender_id",
            "body",
            "is_deleted",
            "edited_at",
            "created_at",
            "updated_at",
            "can_edit",
        ]
        read_only_fields = [
            "id",
            "conversation",
            "sender",
            "is_deleted",
            "edited_at",
            "created_at",
            "updated_at",
            "can_edit",
        ]

    def get_body(self, obj):
        return "" if obj.is_deleted else obj.body

    def get_can_edit(self, obj):
        request = self.context.get("request")
        return bool(
            request
            and request.user.is_authenticated
            and obj.sender_id == request.user.id
            and not obj.is_deleted
        )

    def validate_body(self, value):
        body = (value or "").strip()
        if not body:
            raise serializers.ValidationError("Message body is empty.")
        if len(body) > MAX_MESSAGE_LENGTH:
            raise serializers.ValidationError(
                f"Message body exceeds {MAX_MESSAGE_LENGTH} characters."
            )
        return body


class CreateMessageSerializer(serializers.Serializer):
    body = serializers.CharField(
        max_length=MAX_MESSAGE_LENGTH,
        trim_whitespace=True,
    )

    def validate_body(self, value):
        body = (value or "").strip()
        if not body:
            raise serializers.ValidationError("Message body is empty.")
        if len(body) > MAX_MESSAGE_LENGTH:
            raise serializers.ValidationError(
                f"Message body exceeds {MAX_MESSAGE_LENGTH} characters."
            )
        return body


class UpdateMessageSerializer(serializers.Serializer):
    body = serializers.CharField(
        max_length=MAX_MESSAGE_LENGTH,
        trim_whitespace=True,
    )

    def validate_body(self, value):
        body = (value or "").strip()
        if not body:
            raise serializers.ValidationError("Message body cannot be empty.")
        if len(body) > MAX_MESSAGE_LENGTH:
            raise serializers.ValidationError(
                f"Message body exceeds {MAX_MESSAGE_LENGTH} characters."
            )
        return body


class ConversationUnreadSerializer(serializers.Serializer):
    conversation_id = serializers.UUIDField()
    unread_count = serializers.IntegerField()
