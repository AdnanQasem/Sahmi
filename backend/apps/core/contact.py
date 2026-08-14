import logging

from django.conf import settings
from django.core.mail import EmailMessage
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .throttling import ContactMessageRateThrottle


logger = logging.getLogger(__name__)


class ContactMessageSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120, trim_whitespace=True)
    email = serializers.EmailField(max_length=254)
    subject = serializers.CharField(max_length=160, trim_whitespace=True)
    message = serializers.CharField(max_length=5000, trim_whitespace=True)

    def validate_subject(self, value):
        if "\n" in value or "\r" in value:
            raise serializers.ValidationError("Subject cannot contain line breaks.")
        return value


class ContactMessageView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ContactMessageRateThrottle]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if settings.EMAIL_BACKEND.endswith("console.EmailBackend"):
            return Response(
                {"detail": "Contact email delivery is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        email = EmailMessage(
            subject=f"Sahmi contact: {data['subject']}",
            body=(
                f"Name: {data['name']}\n"
                f"Email: {data['email']}\n\n"
                f"Message:\n{data['message']}"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[settings.CONTACT_EMAIL],
            reply_to=[data["email"]],
        )
        try:
            email.send(fail_silently=False)
        except Exception:
            logger.exception("Contact email delivery failed")
            return Response(
                {"detail": "Your message could not be delivered. Please try again later."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({"message": "Your message was sent successfully."})
