from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core import mail
from django.test import override_settings
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.notifications.models import Notification, NotificationPreference

User = get_user_model()


class NotificationOwnershipTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", email="owner@n.test", full_name="Owner", password="password")
        self.other = User.objects.create_user(username="other", email="other@n.test", full_name="Other", password="password")
        self.own_notification = Notification.objects.create(recipient=self.owner, title="Own", body="visible")
        self.other_notification = Notification.objects.create(recipient=self.other, title="Other", body="hidden")
        self.client.force_authenticate(self.owner)

    def test_list_and_mark_read_are_owner_scoped(self):
        response = self.client.get(reverse("notification-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data["results"]], [str(self.own_notification.id)])
        denied = self.client.post(reverse("notification-mark-read", args=[self.other_notification.id]))
        self.assertEqual(denied.status_code, status.HTTP_404_NOT_FOUND)
        marked = self.client.post(reverse("notification-mark-read", args=[self.own_notification.id]))
        self.assertEqual(marked.status_code, status.HTTP_200_OK)
        self.own_notification.refresh_from_db()
        self.assertIsNotNone(self.own_notification.read_at)

    def test_preferences_are_persistent_and_owner_scoped(self):
        response = self.client.patch(reverse("notification-preference"), {"message_notifications": False, "user": str(self.other.id)}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        preference = NotificationPreference.objects.get(user=self.owner)
        self.assertFalse(preference.message_notifications)
        self.assertFalse(NotificationPreference.objects.filter(user=self.other).exists())
        reloaded = self.client.get(reverse("notification-preference"))
        self.assertFalse(reloaded.data["message_notifications"])

    def test_mark_all_only_changes_current_users_notifications(self):
        response = self.client.post(reverse("notification-mark-all-read"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.own_notification.refresh_from_db()
        self.other_notification.refresh_from_db()
        self.assertIsNotNone(self.own_notification.read_at)
        self.assertIsNone(self.other_notification.read_at)

    def test_notification_response_contains_clickable_destination(self):
        self.own_notification.target_type = "conversation"
        self.own_notification.target_id = "11111111-1111-1111-1111-111111111111"
        self.own_notification.save(update_fields=["target_type", "target_id", "updated_at"])
        response = self.client.get(reverse("notification-list"))
        self.assertEqual(response.data["results"][0]["target_url"], "/dashboard/investor/messages?conversation=11111111-1111-1111-1111-111111111111")

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_email_preference_delivers_and_records_notification_email(self):
        from apps.notifications.services import create_notification

        preference = NotificationPreference.objects.create(user=self.owner, email_enabled=True)
        notification = create_notification(
            recipient=self.owner,
            notification_type=Notification.NotificationType.SYSTEM,
            title="Security update",
            body="Your account was updated.",
        )
        notification.refresh_from_db()
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.owner.email])
        self.assertEqual(notification.delivery_status, Notification.DeliveryStatus.EMAIL_SENT)
        self.assertIsNotNone(notification.email_sent_at)

    def test_system_notification_remains_visible_when_in_app_is_disabled(self):
        from apps.notifications.services import create_notification

        NotificationPreference.objects.create(user=self.owner, in_app_enabled=False)
        notification = create_notification(
            recipient=self.owner,
            notification_type=Notification.NotificationType.SYSTEM,
            title="Security update",
        )
        self.assertTrue(notification.in_app_visible)


class NotificationThrottleTests(APITestCase):
    def test_mark_read_is_throttled(self):
        user = User.objects.create_user(username="limited", email="limited@n.test", full_name="Limited", password="password")
        first = Notification.objects.create(recipient=user, title="One")
        second = Notification.objects.create(recipient=user, title="Two")
        self.client.force_authenticate(user)
        from apps.core.throttling import NotificationReadRateThrottle
        cache.clear()
        with patch.dict(NotificationReadRateThrottle.THROTTLE_RATES, {"notification_read": "1/min"}):
            self.assertEqual(self.client.post(reverse("notification-mark-read", args=[first.id])).status_code, 200)
            self.assertEqual(self.client.post(reverse("notification-mark-read", args=[second.id])).status_code, 429)


@override_settings(DEMO_SINGLE_NOTIFICATION_EMAILS={"invest@gmail.com", "fund@gmail.com"})
class DemoNotificationStreamTests(APITestCase):
    def test_demo_users_keep_only_latest_confirmed_investment_notification(self):
        from apps.notifications.services import create_notification

        user = User.objects.create_user(username="demo-invest", email="invest@gmail.com", password="password")
        create_notification(recipient=user, notification_type=Notification.NotificationType.SYSTEM, title="Ignored")
        create_notification(
            recipient=user,
            notification_type=Notification.NotificationType.INVESTMENT_STATUS_CHANGED,
            title="Investment confirmed",
            body="An investment of 200 on your project Solar Shop has been confirmed.",
        )
        create_notification(
            recipient=user,
            notification_type=Notification.NotificationType.INVESTMENT_STATUS_CHANGED,
            title="Investment confirmed",
            body="An investment of 300 on your project Solar Shop has been confirmed.",
        )
        self.client.force_authenticate(user)
        response = self.client.get(reverse("notification-list"))
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["body"], "An investment of 300 on your project Solar Shop has been confirmed.")
