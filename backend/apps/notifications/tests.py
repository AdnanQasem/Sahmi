from django.contrib.auth import get_user_model
from django.core.cache import cache
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