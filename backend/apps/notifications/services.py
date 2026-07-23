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

from apps.notifications.models import Notification, NotificationPreference

User = get_user_model()
logger = logging.getLogger(__name__)


def get_or_create_preference(user) -> NotificationPreference:
    pref, _ = NotificationPreference.objects.get_or_create(user=user)
    return pref


def _allowed(pref: NotificationPreference, notification_type: str) -> bool:
    """Honour per-category toggles; in-app is always allowed for security events."""
    if not pref.in_app_enabled:
        # Security/account events still go through; UI hides them only if user opts out.
        return False
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
    }
    return bool(category_map.get(notification_type, True))


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
    pref = get_or_create_preference(recipient)
    if not _allowed(pref, notification_type):
        return None
    return Notification.objects.create(
        recipient=recipient,
        actor=actor,
        notification_type=notification_type,
        title=title[:200],
        body=body or "",
        target_type=target_type,
        target_id=target_id,
        delivery_status=Notification.DeliveryStatus.DELIVERED_IN_APP,
    )


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
