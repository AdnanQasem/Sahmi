from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardResultsSetPagination
from apps.core.throttling import NotificationReadRateThrottle
from apps.notifications.models import Notification, NotificationPreference
from apps.notifications.serializers import (
    NotificationPreferenceSerializer,
    NotificationSerializer,
)
from apps.notifications.services import get_or_create_preference


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        parameters=[
            OpenApiParameter("read", bool, description="Filter read/unread."),
            OpenApiParameter("type", str, description="Filter by notification type."),
        ],
        responses=NotificationSerializer(many=True),
    )
    def get(self, request, *args, **kwargs):
        qs = Notification.objects.filter(recipient=request.user)
        read_param = request.query_params.get("read")
        if read_param is not None:
            is_read = read_param.lower() in {"true", "1", "yes"}
            qs = qs.filter(read_at__isnull=not is_read)
        ntype = request.query_params.get("type")
        if ntype:
            qs = qs.filter(notification_type=ntype)
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request, view=self)
        data = NotificationSerializer(page, many=True).data
        return paginator.get_paginated_response(data)


class NotificationUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def get(self, request, *args, **kwargs):
        count = Notification.objects.filter(
            recipient=request.user, read_at__isnull=True
        ).count()
        return Response({"unread_count": count})


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [NotificationReadRateThrottle]

    @extend_schema(request=None, responses={200: OpenApiTypes.OBJECT})
    def post(self, request, *args, **kwargs):
        notification = get_object_or_404(
            Notification, pk=kwargs["pk"], recipient=request.user
        )
        if notification.read_at is None:
            from django.utils import timezone

            notification.read_at = timezone.now()
            notification.save(update_fields=["read_at", "updated_at"])
        return Response({"read": True})


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [NotificationReadRateThrottle]

    @extend_schema(request=None, responses={200: OpenApiTypes.OBJECT})
    def post(self, request, *args, **kwargs):
        from django.utils import timezone

        Notification.objects.filter(
            recipient=request.user, read_at__isnull=True
        ).update(read_at=timezone.now())
        return Response({"marked_all_read": True})


class NotificationPreferenceView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationPreferenceSerializer

    def get_object(self):
        return get_or_create_preference(self.request.user)

    def retrieve(self, request, *args, **kwargs):
        pref = self.get_object()
        return Response(self.get_serializer(pref).data)

    def update(self, request, *args, **kwargs):
        pref = self.get_object()
        serializer = self.get_serializer(pref, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        # Owner is always request.user; ignore any ``user`` field in payload.
        data = {k: v for k, v in serializer.validated_data.items() if k != "user"}
        for k, v in data.items():
            setattr(pref, k, bool(v))
        pref.save(update_fields=list(data.keys()) + ["updated_at"])
        return Response(serializer.to_representation(pref))
