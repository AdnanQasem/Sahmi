from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
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
            "total_repaid", "reputation_score", "date_joined", "last_login",
        ]
        read_only_fields = [
            "id", "is_verified", "is_kyc_verified", "total_invested", "total_returned",
            "average_roi", "total_funded", "total_repaid", "reputation_score",
            "date_joined", "last_login",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "full_name", "password", "user_type",
            "phone_number", "country", "city", "business_name",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {"username": {"required": False, "allow_blank": True}}

    def create(self, validated_data):
        password = validated_data.pop("password")
        if not validated_data.get("username"):
            validated_data["username"] = validated_data["email"]
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.EMAIL_FIELD

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        user = authenticate(request=self.context.get("request"), username=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is disabled.")

        refresh = self.get_token(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializer(user, context=self.context).data,
        }
