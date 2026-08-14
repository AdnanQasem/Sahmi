import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.contrib.auth import update_session_auth_hash
from rest_framework import generics, permissions, status
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema

from apps.audit.models import AuditLog
from apps.audit.services import log as audit_log
from apps.core.throttling import (
    LoginRateThrottle,
    PasswordChangeRateThrottle,
    PasswordResetRateThrottle,
    RefreshRateThrottle,
    RegisterRateThrottle,
)

from .serializers import (
    EmailTokenObtainPairSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
    build_auth_payload,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    renderer_classes = [JSONRenderer]
    throttle_classes = [RegisterRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        audit_log(
            action="user.register",
            actor=user,
            target_type="user",
            target_id=str(user.id),
            metadata={"user_type": user.user_type},
            request=request,
        )
        return Response(build_auth_payload(user, context={"request": request}), status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]
    renderer_classes = [JSONRenderer]
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            # Identify who logged in to log the actor without storing credentials.
            email = request.data.get("email", "")
            user = None
            from .models import User

            try:
                user = User.objects.get(email__iexact=email)
            except (User.DoesNotExist, User.MultipleObjectsReturned):
                pass
            audit_log(
                action="user.login",
                actor=user,
                target_type="user",
                target_id=str(user.id) if user else "",
                metadata={"result_ok": True},
                request=request,
            )
        else:
            # Failed login: do not log the attempted password; log IP/UA only.
            audit_log(
                action="user.login",
                actor=None,
                result="failure",
                metadata={"reason": "auth_failed"},
                target_type="user",
                target_id="",
                request=request,
            )
        return response


class RefreshTokenView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]
    renderer_classes = [JSONRenderer]
    throttle_classes = [RefreshRateThrottle]


class LogoutView(APIView):
    """Blacklist the submitted refresh token. Tokens are never logged."""

    permission_classes = [permissions.IsAuthenticated]
    renderer_classes = [JSONRenderer]

    @extend_schema(request=OpenApiTypes.OBJECT, responses={200: OpenApiTypes.OBJECT})
    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except TokenError as exc:
            return Response(
                {"detail": f"Invalid or expired refresh token: {exc}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        audit_log(
            action="user.logout",
            actor=request.user,
            target_type="user",
            target_id=str(request.user.id),
            request=request,
        )
        return Response({"detail": "Logout successful."})


class MeView(APIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    renderer_classes = [JSONRenderer]

    def get(self, request):
        return Response(UserSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        protected = {"user_type", "is_staff", "is_superuser", "groups", "user_permissions"}
        attempted = protected.intersection(request.data.keys())
        if attempted:
            return Response(
                {field: ["This field cannot be changed through the profile API."] for field in sorted(attempted)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = UserSerializer(
            request.user, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        # Defensive: the serializer already marks these read-only, but if any
        # future serializer regression re-exposes them, this server boundary
        # removes them before saving.
        validated = serializer.validated_data
        validated.pop("is_staff", None)
        validated.pop("is_superuser", None)
        validated.pop("groups", None)
        validated.pop("user_permissions", None)
        new_user_type = validated.get("user_type")
        if new_user_type and new_user_type != request.user.user_type:
            audit_log(
                action="user.profile.role_change_denied",
                actor=request.user,
                target_type="user",
                target_id=str(request.user.id),
                result=AuditLog.Result.DENIED,
                metadata={"attempted_user_type": str(new_user_type)},
                request=request,
            )
            validated.pop("user_type")
        serializer.save()
        audit_log(
            action="user.profile.update",
            actor=request.user,
            target_type="user",
            target_id=str(request.user.id),
            request=request,
        )
        return Response(serializer.data)


logger = logging.getLogger(__name__)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    renderer_classes = [JSONRenderer]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if settings.EMAIL_BACKEND.endswith("console.EmailBackend"):
            return Response(
                {"detail": "Password reset email delivery is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        from .models import User

        user = User.objects.filter(
            email__iexact=serializer.validated_data["email"],
            is_active=True,
        ).first()
        reset_url = None
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            try:
                send_mail(
                    subject="Reset your Sahmi password",
                    message=(
                        "We received a request to reset your Sahmi password.\n\n"
                        f"Open this link to choose a new password:\n{reset_url}\n\n"
                        "If you did not request this, you can ignore this email."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception:
                logger.exception("Password reset email delivery failed")
                return Response(
                    {"detail": "The reset email could not be delivered. Please try again later."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        response = {
            "message": (
                "If an active account exists for that email, a password reset "
                "link has been sent."
            )
        }
        return Response(response, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    renderer_classes = [JSONRenderer]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Password reset successfully."},
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]
    renderer_classes = [JSONRenderer]
    throttle_classes = [PasswordChangeRateThrottle]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        update_session_auth_hash(request, request.user)
        audit_log(
            action="user.password_change",
            actor=request.user,
            target_type="user",
            target_id=str(request.user.id),
            request=request,
        )
        return Response({"message": "Password updated successfully."})
