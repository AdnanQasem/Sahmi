from django.contrib import admin

from apps.audit.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "id", "actor", "action", "target_type", "target_id",
        "result", "created_at",
    )
    list_filter = ("result", "action", "target_type")
    search_fields = ("action", "metadata", "ip_address")
    readonly_fields = (
        "id", "actor", "action", "target_type", "target_id",
        "result", "metadata", "request_id", "ip_address",
        "user_agent", "created_at", "updated_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
