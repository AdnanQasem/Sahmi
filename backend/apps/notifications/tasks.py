import logging

from django.conf import settings
from django.core.mail import EmailMessage
from django.utils import timezone

from config.celery import app
from .models import Notification

logger = logging.getLogger(__name__)


@app.task
def send_notification_email(notification_id):
    """Deliver one notification by email and persist the delivery outcome."""
    try:
        notification = Notification.objects.select_related("recipient").get(pk=notification_id)
    except Notification.DoesNotExist:
        return {"status": "missing"}
    try:
        EmailMessage(
            subject=f"Sahmi: {notification.title}",
            body=notification.body or notification.title,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[notification.recipient.email],
        ).send(fail_silently=False)
    except Exception as exc:
        logger.exception("Notification email delivery failed", extra={"notification_id": str(notification.id)})
        notification.delivery_status = Notification.DeliveryStatus.EMAIL_FAILED
        notification.email_error = str(exc)[:500]
        notification.save(update_fields=["delivery_status", "email_error", "updated_at"])
        return {"status": "failed"}
    notification.delivery_status = Notification.DeliveryStatus.EMAIL_SENT
    notification.email_sent_at = timezone.now()
    notification.email_error = ""
    notification.save(update_fields=["delivery_status", "email_sent_at", "email_error", "updated_at"])
    return {"status": "sent"}
