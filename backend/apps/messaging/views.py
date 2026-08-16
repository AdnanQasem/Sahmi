from django.db.models import Q
from django.http import FileResponse
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import (
    NotFound,
    PermissionDenied,
    ValidationError,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.pagination import StandardResultsSetPagination
from apps.core.throttling import ConversationCreateRateThrottle, MessageSendRateThrottle
from apps.messaging.models import (
    Conversation,
    ConversationParticipant,
    Message,
)
from apps.messaging.permissions import (
    IsAuthenticatedParticipant,
    IsMessageSender,
    is_participant,
)
from apps.messaging.serializers import (
    ConversationSerializer,
    CreateDirectConversationSerializer,
    CreateMessageSerializer,
    CreateProjectConversationSerializer,
    MessageSerializer,
    MinimalUserSerializer,
    UpdateMessageSerializer,
)
from apps.messaging.services import (
    archive_conversation,
    edit_message,
    get_or_create_direct_conversation,
    mark_conversation_read,
    send_message,
    soft_delete_message,
    unread_count_for_user,
    unread_counts_by_conversation,
)


class ConversationViewSet(viewsets.GenericViewSet):
    """
    Conversations for the current user. Only authenticated users. Only
    conversations where the requesting user is a participant are ever returned.
    """

    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    serializer_class = ConversationSerializer
    queryset = Conversation.objects.none()

    def get_throttles(self):
        if self.action == "create":
            return [ConversationCreateRateThrottle()]
        if self.action == "messages" and self.request.method == "POST":
            return [MessageSendRateThrottle()]
        return super().get_throttles()

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Conversation.objects.none()
        return (
            Conversation.objects.filter(participants__user=self.request.user)
            .select_related("created_by", "project")
            .prefetch_related("participants__user")
            .distinct()
        )

    def get_object_or_404(self):
        try:
            conversation = self.get_queryset().get(pk=self.kwargs["pk"])
        except (Conversation.DoesNotExist, ValueError):
            raise NotFound("Conversation not found.")
        return conversation

    @extend_schema(
        responses=ConversationSerializer,
        parameters=[
            OpenApiParameter(
                "include_archived",
                type=bool,
                description="Include archived conversations.",
            ),
        ],
    )
    def list(self, request, *args, **kwargs):
        archived = request.query_params.get("include_archived", "false").lower() in {
            "1",
            "true",
            "yes",
        }
        qs = self.get_queryset()
        if not archived:
            visible_conversation_ids = (
                ConversationParticipant.objects.filter(
                    user=request.user, is_archived=False
                ).values_list("conversation_id", flat=True)
            )
            qs = qs.filter(pk__in=visible_conversation_ids)
        page = self.paginate_queryset(qs)
        context = {"request": request, "_unread_counts_cache": unread_counts_by_conversation(request.user)}
        serializer = ConversationSerializer(page, many=True, context=context)
        return self.get_paginated_response(serializer.data)

    @extend_schema(
        request=CreateDirectConversationSerializer,
        responses=ConversationSerializer,
    )
    def create(self, request, *args, **kwargs):
        kind = request.data.get("kind", Conversation.KIND_DIRECT)
        if kind == Conversation.KIND_PROJECT:
            serializer = CreateProjectConversationSerializer(
                data=request.data, context={"request": request}
            )
            serializer.is_valid(raise_exception=True)
            conversation = serializer.save()
        else:
            serializer = CreateDirectConversationSerializer(
                data=request.data, context={"request": request}
            )
            serializer.is_valid(raise_exception=True)
            conversation = serializer.save()
        context = {"request": request, "_unread_counts_cache": unread_counts_by_conversation(request.user)}
        return Response(
            ConversationSerializer(conversation, context=context).data,
            status=status.HTTP_201_CREATED,
        )

    def retrieve(self, request, *args, **kwargs):
        conversation = self.get_object_or_404()
        if not is_participant(request.user, conversation):
            raise PermissionDenied("Not a participant.")
        context = {"request": request, "_unread_counts_cache": unread_counts_by_conversation(request.user)}
        return Response(ConversationSerializer(conversation, context=context).data)

    @action(detail=True, methods=["post"], url_path="archive")
    def archive(self, request, *args, **kwargs):
        conversation = self.get_object_or_404()
        if not is_participant(request.user, conversation):
            raise PermissionDenied("Not a participant.")
        archived = archive_conversation(conversation, request.user, archived=True)
        return Response({"archived": archived})

    @action(detail=True, methods=["post"], url_path="unarchive")
    def unarchive(self, request, *args, **kwargs):
        conversation = self.get_object_or_404()
        if not is_participant(request.user, conversation):
            raise PermissionDenied("Not a participant.")
        archived = archive_conversation(conversation, request.user, archived=False)
        return Response({"archived": archived})

    @action(detail=True, methods=["post"], url_path="mute")
    def mute(self, request, *args, **kwargs):
        from apps.messaging.services import mute_conversation

        conversation = self.get_object_or_404()
        if not is_participant(request.user, conversation):
            raise PermissionDenied("Not a participant.")
        muted = mute_conversation(conversation, request.user, muted=True)
        return Response({"muted": muted})

    @action(detail=True, methods=["post"], url_path="unmute")
    def unmute(self, request, *args, **kwargs):
        from apps.messaging.services import mute_conversation

        conversation = self.get_object_or_404()
        if not is_participant(request.user, conversation):
            raise PermissionDenied("Not a participant.")
        muted = mute_conversation(conversation, request.user, muted=False)
        return Response({"muted": muted})

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, *args, **kwargs):
        conversation = self.get_object_or_404()
        if not is_participant(request.user, conversation):
            raise PermissionDenied("Not a participant.")
        updated = mark_conversation_read(conversation, request.user)
        return Response({"marked_read": updated})

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request, *args, **kwargs):
        return Response({"unread_count": unread_count_for_user(request.user)})

    @action(detail=False, methods=["get"], url_path="user-search")
    def user_search(self, request, *args, **kwargs):
        from apps.users.models import User

        query = request.query_params.get("q", "").strip()
        if len(query) < 2:
            return Response([])
        users = (
            User.objects.filter(is_active=True)
            .exclude(pk=request.user.pk)
            .filter(
                Q(full_name__icontains=query)
                | Q(business_name__icontains=query)
            )
            .order_by("full_name")[:20]
        )
        return Response(MinimalUserSerializer(users, many=True).data)

    @action(detail=True, methods=["get", "post"], url_path="messages")
    def messages(self, request, *args, **kwargs):
        if request.method == "POST":
            return self._create_message(request, *args, **kwargs)
        conversation = self.get_object_or_404()
        if not is_participant(request.user, conversation):
            raise PermissionDenied("Not a participant.")
        page_size = StandardResultsSetPagination().page_size
        page_number = int(request.query_params.get("page", 1))
        qs = (
            Message.objects.filter(conversation=conversation)
            .select_related("sender")
            .order_by("created_at")
        )
        total = qs.count()
        start = (page_number - 1) * page_size
        end = start + page_size
        items = qs[start:end]
        data = MessageSerializer(items, many=True, context={"request": request}).data
        return Response(
            {
                "count": total,
                "page": page_number,
                "page_size": page_size,
                "results": data,
            }
        )

    def _create_message(self, request, *args, **kwargs):
        conversation = self.get_object_or_404()
        if not is_participant(request.user, conversation):
            raise PermissionDenied("Not a participant.")
        serializer = CreateMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            message = send_message(
                conversation=conversation,
                sender=request.user,
                body=serializer.validated_data.get("body", ""),
                attachment=serializer.validated_data.get("attachment"),
            )
        except ValueError as exc:
            raise ValidationError(str(exc))
        return Response(
            MessageSerializer(message, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class MessageViewSet(viewsets.GenericViewSet):
    """Edit or delete individual messages. Only the sender may do either."""

    permission_classes = [IsAuthenticated]
    pagination_class = None
    serializer_class = MessageSerializer
    queryset = Message.objects.none()
    lookup_field = "pk"

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Message.objects.none()
        return Message.objects.filter(
            conversation__participants__user=self.request.user
        ).distinct()

    @action(detail=True, methods=["get"], url_path="attachment")
    def attachment(self, request, *args, **kwargs):
        message = self._get_object_or_404()
        if message.is_deleted or not message.attachment:
            raise NotFound("Attachment not found.")
        response = FileResponse(
            message.attachment.open("rb"),
            as_attachment=not message.attachment_content_type.startswith("image/"),
            filename=message.attachment_name,
            content_type=message.attachment_content_type or "application/octet-stream",
        )
        response["X-Content-Type-Options"] = "nosniff"
        response["Cache-Control"] = "private, max-age=300"
        return response

    def _get_object_or_404(self):
        try:
            return self.get_queryset().get(pk=self.kwargs["pk"])
        except Message.DoesNotExist:
            raise NotFound("Message not found.")

    def partial_update(self, request, *args, **kwargs):
        message = self._get_object_or_404()
        if message.sender_id != request.user.id:
            raise PermissionDenied("Only the sender may edit this message.")
        serializer = UpdateMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            edit_message(message, request.user, serializer.validated_data["body"])
        except (PermissionError, ValueError) as exc:
            raise ValidationError(str(exc))
        return Response(
            MessageSerializer(message, context={"request": request}).data
        )

    def destroy(self, request, *args, **kwargs):
        message = self._get_object_or_404()
        if message.sender_id != request.user.id:
            raise PermissionDenied("Only the sender may delete this message.")
        soft_delete_message(message, request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
