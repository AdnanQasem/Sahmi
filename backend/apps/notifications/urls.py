from django.urls import path

from apps.notifications.views import (
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
    NotificationPreferenceView,
    NotificationUnreadCountView,
    NotificationStreamView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("unread-count/", NotificationUnreadCountView.as_view(),
         name="notification-unread-count"),
    path("<uuid:pk>/mark-read/", NotificationMarkReadView.as_view(),
         name="notification-mark-read"),
    path("mark-all-read/", NotificationMarkAllReadView.as_view(),
         name="notification-mark-all-read"),
    path("preferences/", NotificationPreferenceView.as_view(),
         name="notification-preference"),
    path("stream/", NotificationStreamView.as_view(), name="notification-stream"),
]
