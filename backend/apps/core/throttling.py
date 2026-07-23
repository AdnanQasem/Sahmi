from rest_framework.throttling import (
    AnonRateThrottle as DRFAnonRateThrottle,
    UserRateThrottle as DRFUserRateThrottle,
    ScopedRateThrottle as DRFScopedRateThrottle,
)


class ScopedRateThrottle(DRFScopedRateThrottle):
    """Use the scope declared by the throttle class for APIView endpoints."""

    def allow_request(self, request, view):
        if not getattr(view, "throttle_scope", None):
            view.throttle_scope = self.scope
        return super().allow_request(request, view)


class AnonRateThrottle(DRFAnonRateThrottle):
    scope = "anon"


class UserRateThrottle(DRFUserRateThrottle):
    scope = "user"


class LoginRateThrottle(ScopedRateThrottle):
    scope = "login"


class RegisterRateThrottle(ScopedRateThrottle):
    scope = "register"


class RefreshRateThrottle(ScopedRateThrottle):
    scope = "refresh"


class PasswordChangeRateThrottle(ScopedRateThrottle):
    scope = "password_change"


class MessageSendRateThrottle(ScopedRateThrottle):
    scope = "message_send"


class ConversationCreateRateThrottle(ScopedRateThrottle):
    scope = "conversation_create"


class NotificationReadRateThrottle(ScopedRateThrottle):
    scope = "notification_read"


class AdminVerificationRateThrottle(ScopedRateThrottle):
    scope = "admin_verification"
