from django.contrib import admin

from apps.messaging.models import (
    Conversation,
    ConversationParticipant,
    Message,
)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "kind", "created_by", "project", "is_archived", "created_at")
    list_filter = ("kind", "is_archived")
    search_fields = ("id", "title")
    readonly_fields = ("id", "created_at", "updated_at", "last_message_at")


@admin.register(ConversationParticipant)
class ConversationParticipantAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "user", "joined_at", "is_muted", "is_archived")
    list_filter = ("is_muted", "is_archived")
    readonly_fields = ("id", "joined_at", "last_read_at")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "sender", "created_at", "edited_at", "deleted_at")
    list_filter = ("deleted_at", "edited_at")
    readonly_fields = ("id", "conversation", "sender", "created_at", "updated_at", "edited_at", "deleted_at")
