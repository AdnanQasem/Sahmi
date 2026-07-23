from rest_framework.permissions import BasePermission

from apps.messaging.services import is_participant  # noqa: F401  (re-export)


class IsAuthenticatedParticipant(BasePermission):
    """Only authenticated users who are participants of the conversation."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        from apps.messaging.models import Conversation, Message

        if isinstance(obj, Conversation):
            conversation = obj
        elif isinstance(obj, Message):
            conversation = obj.conversation
        else:
            return False
        from apps.messaging.models import ConversationParticipant

        return ConversationParticipant.objects.filter(
            conversation=conversation, user=user
        ).exists()


class IsMessageSender(BasePermission):
    """Only the user who created the message may edit or delete it."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        return obj.sender_id == request.user.id
