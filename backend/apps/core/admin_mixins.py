from rest_framework.exceptions import PermissionDenied


class ApplicationAdminCreateGuardMixin:
    """Reserve object creation for true Django superusers.

    Sahmi application administrators are staff reviewers/operators. They may
    inspect and manage existing records, but they do not originate financial
    or ownership records. Categories intentionally do not use this mixin.
    """

    creation_denied_message = "Application administrators cannot create this record."

    def create(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            from apps.audit.models import AuditLog
            from apps.audit.services import log as audit_log

            audit_log(
                action="admin.create_denied",
                actor=request.user,
                target_type=getattr(self, "basename", "admin_record") or "admin_record",
                result=AuditLog.Result.DENIED,
                metadata={"path": request.path, "method": request.method},
                request=request,
            )
            raise PermissionDenied(self.creation_denied_message)
        return super().create(request, *args, **kwargs)
