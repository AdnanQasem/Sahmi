from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

User = get_user_model()

from .email_verification import email_verification_token
from .models import PendingRegistration


class UserSerializer(serializers.ModelSerializer):
    email_verified = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "full_name", "phone_number", "user_type",
            "preferred_language",
            "profile_picture", "bio", "country", "city", "website", "timezone", "is_verified", "email_verified", "email_verified_at", "is_kyc_verified",
            "investor_tier", "total_invested", "total_returned", "average_roi",
            "risk_preference", "business_name", "business_registration_number",
            "business_established_date", "business_address", "total_funded",
            "total_repaid", "reputation_score", "is_staff", "date_joined", "last_login",
        ]
        read_only_fields = [
            "id", "user_type", "is_verified", "email_verified", "email_verified_at", "is_kyc_verified", "total_invested",
            "total_returned", "average_roi", "total_funded", "total_repaid",
            "reputation_score", "is_staff", "date_joined", "last_login",
        ]

    def validate_email(self, value):
        value = value.strip().lower()
        duplicate = User.objects.filter(email__iexact=value)
        if self.instance:
            duplicate = duplicate.exclude(pk=self.instance.pk)
        if duplicate.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def get_email_verified(self, obj):
        return obj.email_verified_at is not None

    def validate_timezone(self, value):
        value = value.strip()
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError:
            raise serializers.ValidationError("Choose a valid time zone.")
        return value

    def validate_profile_picture(self, value):
        if value and value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Profile pictures may not exceed 5 MB.")
        return value

    def update(self, instance, validated_data):
        old_email = instance.email
        old_picture_name = instance.profile_picture.name if instance.profile_picture else ""
        picture_is_changing = "profile_picture" in validated_data
        new_email = validated_data.get("email", old_email)
        if new_email != old_email:
            instance.is_verified = False
            instance.email_verified_at = None
        updated = super().update(instance, validated_data)
        new_picture_name = updated.profile_picture.name if updated.profile_picture else ""
        if picture_is_changing and old_picture_name and old_picture_name != new_picture_name:
            updated.profile_picture.storage.delete(old_picture_name)
        return updated


def build_auth_payload(user, context=None):
    refresh = EmailTokenObtainPairSerializer.get_token(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": UserSerializer(user, context=context or {}).data,
    }


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(write_only=True, required=False, allow_blank=True)
    email = serializers.EmailField()
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    full_name = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    user_type = serializers.ChoiceField(choices=User.UserType.choices, default=User.UserType.INVESTOR)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    business_name = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        attrs.pop("username", None)
        name = attrs.pop("name", "").strip()
        full_name = attrs.get("full_name", "").strip()
        if not full_name and name:
            attrs["full_name"] = name
        if not attrs.get("full_name"):
            raise serializers.ValidationError({"full_name": "Full name is required."})
        return attrs

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_user_type(self, value):
        public_user_types = {
            User.UserType.INVESTOR,
            User.UserType.ENTREPRENEUR,
        }
        if value not in public_user_types:
            raise serializers.ValidationError(
                "Public registration is limited to investors and entrepreneurs."
            )
        return value

    def create(self, validated_data):
        password = make_password(validated_data.pop("password"))
        registration, _ = PendingRegistration.objects.update_or_create(
            email=validated_data["email"],
            defaults={**validated_data, "password": password},
        )
        return registration


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "New passwords do not match."})
        try:
            validate_password(attrs["new_password"], self.context["request"].user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"new_password": list(exc.messages)})
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(write_only=True)
    token = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "New passwords do not match."}
            )
        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, UnicodeDecodeError, User.DoesNotExist):
            raise serializers.ValidationError(
                {"token": "This password reset link is invalid or has expired."}
            )
        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError(
                {"token": "This password reset link is invalid or has expired."}
            )
        try:
            validate_password(attrs["new_password"], user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"new_password": list(exc.messages)})
        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class EmailVerificationSerializer(serializers.Serializer):
    uid = serializers.CharField(write_only=True)
    token = serializers.CharField(write_only=True)

    def validate(self, attrs):
        try:
            registration_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            registration = PendingRegistration.objects.get(pk=registration_id)
        except (TypeError, ValueError, OverflowError, UnicodeDecodeError, PendingRegistration.DoesNotExist):
            raise serializers.ValidationError({"token": "This email confirmation link is invalid or has expired."})
        if not email_verification_token.check_token(registration, attrs["token"]):
            raise serializers.ValidationError({"token": "This email confirmation link is invalid or has expired."})
        attrs["registration"] = registration
        return attrs

    def save(self, **kwargs):
        try:
            registration = PendingRegistration.objects.select_for_update().get(
                pk=self.validated_data["registration"].pk
            )
        except PendingRegistration.DoesNotExist:
            raise serializers.ValidationError(
                {"token": "This email confirmation link has already been used."}
            )
        if not email_verification_token.check_token(registration, self.validated_data["token"]):
            raise serializers.ValidationError(
                {"token": "This email confirmation link is invalid or has expired."}
            )
        if User.objects.filter(email__iexact=registration.email).exists():
            raise serializers.ValidationError({"token": "An account already exists for this email address."})
        user = User(
            username=registration.email,
            email=registration.email,
            full_name=registration.full_name,
            password=registration.password,
            user_type=registration.user_type,
            phone_number=registration.phone_number,
            country=registration.country,
            city=registration.city,
            business_name=registration.business_name,
            email_verified_at=timezone.now(),
        )
        user.save()
        registration.delete()
        return user


class EmailVerificationResendSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.EMAIL_FIELD

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password")
        if not email:
            raise serializers.ValidationError({"email": "Email is required."})
        if not password:
            raise serializers.ValidationError({"password": "Password is required."})
        try:
            authentication_email = User.objects.only("email").get(
                email__iexact=email
            ).email
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            authentication_email = email
        user = authenticate(
            request=self.context.get("request"),
            username=authentication_email,
            password=password,
        )
        if not user:
            raise serializers.ValidationError({"non_field_errors": ["Invalid email or password."]})
        if not user.is_active:
            raise serializers.ValidationError({"non_field_errors": ["This account is disabled."]})

        return build_auth_payload(user, context=self.context)
