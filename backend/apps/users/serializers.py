from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "full_name", "phone_number", "user_type",
            "profile_picture", "bio", "country", "city", "is_verified", "is_kyc_verified",
            "investor_tier", "total_invested", "total_returned", "average_roi",
            "risk_preference", "business_name", "business_registration_number",
            "business_established_date", "business_address", "total_funded",
            "total_repaid", "reputation_score", "is_staff", "date_joined", "last_login",
        ]
        read_only_fields = [
            "id", "user_type", "is_verified", "is_kyc_verified", "total_invested",
            "total_returned", "average_roi", "total_funded", "total_repaid",
            "reputation_score", "is_staff", "date_joined", "last_login",
        ]


def build_auth_payload(user, context=None):
    refresh = EmailTokenObtainPairSerializer.get_token(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": UserSerializer(user, context=context or {}).data,
    }


class RegisterSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "name", "full_name", "password", "user_type",
            "phone_number", "country", "city", "business_name",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "username": {"required": False, "allow_blank": True},
            "full_name": {"required": False, "allow_blank": True},
            "user_type": {"required": False},
        }

    def validate(self, attrs):
        attrs = super().validate(attrs)
        name = attrs.pop("name", "").strip()
        full_name = attrs.get("full_name", "").strip()
        if not full_name and name:
            attrs["full_name"] = name
        if not attrs.get("full_name"):
            raise serializers.ValidationError({"full_name": "Full name is required."})
        return attrs

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
        password = validated_data.pop("password")
        validated_data["email"] = validated_data["email"].strip().lower()
        if not validated_data.get("username"):
            validated_data["username"] = validated_data["email"]
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


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
