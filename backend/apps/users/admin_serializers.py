from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers


User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    """Staff-facing user serializer that deliberately excludes password data."""

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "phone_number",
            "user_type",
            "profile_picture",
            "bio",
            "country",
            "city",
            "is_verified",
            "is_kyc_verified",
            "kyc_document",
            "kyc_verified_at",
            "investor_tier",
            "total_invested",
            "total_returned",
            "average_roi",
            "risk_preference",
            "business_name",
            "business_registration_number",
            "business_established_date",
            "business_address",
            "total_funded",
            "total_repaid",
            "reputation_score",
            "is_active",
            "is_staff",
            "is_superuser",
            "groups",
            "user_permissions",
            "last_login",
            "date_joined",
        ]
        read_only_fields = ["id", "last_login", "date_joined"]
        extra_kwargs = {
            "username": {"required": False, "allow_blank": True},
        }

    def validate_email(self, value):
        value = value.strip().lower()
        queryset = User.objects.filter(email__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        instance = self.instance
        requested_is_staff = attrs.get('is_staff', serializers.empty)
        request = self.context.get("request")

        resulting_user_type = attrs.get(
            "user_type",
            getattr(instance, "user_type", User.UserType.INVESTOR),
        )
        resulting_is_staff = attrs.get(
            "is_staff",
            getattr(instance, "is_staff", False),
        )
        resulting_is_superuser = attrs.get(
            "is_superuser",
            getattr(instance, "is_superuser", False),
        )
        resulting_is_active = attrs.get(
            "is_active",
            getattr(instance, "is_active", True),
        )

        if resulting_user_type == User.UserType.ADMIN:
            resulting_is_staff = True
            attrs["is_staff"] = True

        if resulting_is_superuser and not resulting_is_staff:
            raise serializers.ValidationError(
                {"is_staff": "A superuser must also have staff access."}
            )

        if not instance:
            return attrs

        errors = {}
        is_self = bool(request and request.user.pk == instance.pk)
        if is_self:
            if requested_is_staff is False:
                errors['is_staff'] = 'You cannot remove your own staff access.'
            if instance.is_active and not resulting_is_active:
                errors["is_active"] = "You cannot deactivate your own account."
            if instance.is_staff and not resulting_is_staff:
                errors["is_staff"] = "You cannot remove your own staff access."
            if instance.is_superuser and not resulting_is_superuser:
                errors["is_superuser"] = "You cannot remove your own superuser access."
            if (
                instance.user_type == User.UserType.ADMIN
                and resulting_user_type != User.UserType.ADMIN
            ):
                errors["user_type"] = "You cannot demote your own admin role."

        removes_active_staff = (
            instance.is_active
            and instance.is_staff
            and not (resulting_is_active and resulting_is_staff)
        )
        if removes_active_staff and not User.objects.exclude(pk=instance.pk).filter(
            is_active=True,
            is_staff=True,
        ).exists():
            errors["is_staff"] = "At least one active staff account must remain."

        removes_active_superuser = (
            instance.is_active
            and instance.is_superuser
            and not (resulting_is_active and resulting_is_superuser)
        )
        if removes_active_superuser and not User.objects.exclude(pk=instance.pk).filter(
            is_active=True,
            is_superuser=True,
        ).exists():
            errors["is_superuser"] = "At least one active superuser must remain."

        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class AdminUserCreateSerializer(AdminUserSerializer):
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        validators=[validate_password],
    )

    class Meta(AdminUserSerializer.Meta):
        fields = [*AdminUserSerializer.Meta.fields, "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        groups = validated_data.pop("groups", [])
        user_permissions = validated_data.pop("user_permissions", [])
        if not validated_data.get("username"):
            validated_data["username"] = validated_data["email"]

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        user.groups.set(groups)
        user.user_permissions.set(user_permissions)
        return user


class AdminPasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        try:
            validate_password(attrs["password"], self.context["user"])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs

    def save(self, **kwargs):
        user = self.context["user"]
        user.set_password(self.validated_data["password"])
        user.save(update_fields=["password"])
        return user
