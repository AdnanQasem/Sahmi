"""Notification service: deterministic creation of notifications from domain events.

This module is the only place that should construct ``Notification`` rows for
domain events. It intentionally does NOT expose a public write API to clients.

Notification bodies are short summaries; they MUST NOT include private message
text, document URLs, token values, or other sensitive data.
"""

from __future__ import annotations

import logging
from typing import Optional

from django.contrib.auth import get_user_model
from django.db import transaction
from django.conf import settings

from apps.notifications.models import Notification, NotificationPreference

User = get_user_model()
logger = logging.getLogger(__name__)


def get_or_create_preference(user) -> NotificationPreference:
    pref, _ = NotificationPreference.objects.get_or_create(user=user)
    return pref


def _allowed(pref: NotificationPreference, notification_type: str) -> bool:
    """Honour per-category toggles; in-app is always allowed for security events."""
    security_types = {
        Notification.NotificationType.SYSTEM,
    }
    if notification_type in security_types:
        return True
    category_map = {
        Notification.NotificationType.MESSAGE_RECEIVED: pref.message_notifications,
        Notification.NotificationType.PROJECT_SUBMITTED: pref.project_notifications,
        Notification.NotificationType.PROJECT_VERIFIED: pref.project_notifications,
        Notification.NotificationType.PROJECT_REJECTED: pref.project_notifications,
        Notification.NotificationType.INVESTMENT_CREATED: pref.investment_notifications,
        Notification.NotificationType.INVESTMENT_STATUS_CHANGED: pref.investment_notifications,
        Notification.NotificationType.MILESTONE_UPDATED: pref.milestone_notifications,
        Notification.NotificationType.REPAYMENT_UPDATED: pref.repayment_notifications,
        Notification.NotificationType.FUNDING_GOAL_REACHED: pref.project_notifications,
        Notification.NotificationType.WITHDRAWAL_UPDATED: pref.milestone_notifications,
        Notification.NotificationType.FUNDS_RELEASED: pref.milestone_notifications,
    }
    return bool(category_map.get(notification_type, True))


def _publish_live(notification):
    try:
        import json
        import redis

        client = redis.Redis.from_url(settings.CELERY_BROKER_URL, socket_connect_timeout=1, socket_timeout=1)
        client.publish(
            f"notifications_{notification.recipient_id}",
            json.dumps({"type": "notification", "id": str(notification.id)}),
        )
    except Exception:
        logger.info("Live notification publishing unavailable", exc_info=True)


def create_notification(
    *,
    recipient,
    notification_type: str,
    title: str,
    body: str = "",
    actor=None,
    target_type: str = "",
    target_id: str = "",
    commit: bool = True,
) -> Optional[Notification]:
    """Create a notification, honouring user preferences."""
    if recipient is None:
        return None
    demo_recipient = recipient.email.lower() in settings.DEMO_SINGLE_NOTIFICATION_EMAILS
    is_confirmed = (
        notification_type == Notification.NotificationType.INVESTMENT_STATUS_CHANGED
        and title == "Investment confirmed"
    )
    if demo_recipient and not is_confirmed:
        return None
    pref = get_or_create_preference(recipient)
    if not _allowed(pref, notification_type):
        return None
    is_security = notification_type == Notification.NotificationType.SYSTEM
    in_app_visible = pref.in_app_enabled or is_security
    if not in_app_visible and not pref.email_enabled:
        return None
    if demo_recipient:
        Notification.objects.filter(recipient=recipient).delete()
    notification = Notification.objects.create(
        recipient=recipient,
        actor=actor,
        notification_type=notification_type,
        title=title[:200],
        body=body or "",
        target_type=target_type,
        target_id=target_id,
        delivery_status=(
            Notification.DeliveryStatus.DELIVERED_IN_APP
            if in_app_visible else Notification.DeliveryStatus.PENDING
        ),
        in_app_visible=in_app_visible,
    )
    if in_app_visible:
        _publish_live(notification)
    if pref.email_enabled and recipient.email:
        from .tasks import send_notification_email
        send_notification_email(str(notification.id))
    return notification


def notify_on_commit(
    *,
    recipient,
    notification_type: str,
    title: str,
    body: str = "",
    actor=None,
    target_type: str = "",
    target_id: str = "",
):
    """Schedule notification creation after the surrounding transaction commits."""
    transaction.on_commit(
        lambda: create_notification(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            body=body,
            actor=actor,
            target_type=target_type,
            target_id=target_id,
        )
    )
