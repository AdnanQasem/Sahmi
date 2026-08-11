from django.db.models import F
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import ProjectFilter
from .models import Project, ProjectCategory
from .permissions import IsEntrepreneur, IsStaffOrReadOnly, ProjectPermission
from .serializers import (
    AdminProjectListSerializer,
    ProjectCategorySerializer,
    ProjectListSerializer,
    ProjectRejectionSerializer,
    ProjectSerializer,
    ProjectStatusSerializer,
    ProjectVerificationSerializer,
    PublicProjectSerializer,
)
from apps.audit.services import log as audit_log
from apps.core.throttling import AdminVerificationRateThrottle
from apps.notifications.models import Notification
from apps.notifications.services import notify_on_commit


class ProjectCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProjectCategory.objects.all()
    serializer_class = ProjectCategorySerializer
    permission_classes = [IsStaffOrReadOnly]
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.select_related("entrepreneur", "category").prefetch_related(
        "images", "supporting_documents", "milestones"
    )
    serializer_class = ProjectSerializer
    permission_classes = [ProjectPermission]
    filterset_class = ProjectFilter
    search_fields = ["title", "short_description", "description", "location"]
    ordering_fields = ["created_at", "goal_amount", "funded_amount", "expected_roi", "investor_count"]
    lookup_field = "slug"

    def get_permissions(self):
        if self.action == "create":
            return [ProjectPermission(), IsEntrepreneur()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == "list":
            if self.request.user.is_authenticated and self.request.user.is_staff:
                return AdminProjectListSerializer
            return ProjectListSerializer
        if self.action == "retrieve":
            instance = self.get_object() if "slug" in self.kwargs else None
            if (
                instance is not None
                and self.request.user.is_authenticated
                and (
                    self.request.user.is_staff
                    or instance.entrepreneur_id == self.request.user.id
                )
            ):
                return ProjectSerializer
            return PublicProjectSerializer
        return ProjectSerializer

    def get_queryset(self):
        queryset = super().get_queryset().filter(deleted_at__isnull=True)
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return queryset
        if self.action == "list":
            return queryset.filter(status=Project.Status.ACTIVE, is_verified=True)
        if self.action == "retrieve":
            # Public visibility follows project verified/active rule; the
            # owner of the project can always retrieve their own.
            if self.request.user.is_authenticated:
                owner_q = queryset.filter(entrepreneur=self.request.user)
            else:
                owner_q = queryset.none()
            public_q = queryset.filter(
                status=Project.Status.ACTIVE, is_verified=True
            )
            return (owner_q | public_q).distinct()
        if self.action in {"my", "payments", "events"}:
            return queryset  # action views enforce their own gating below
        # update / partial_update / destroy / verify / reject / set-status:
        reachable = queryset.none()
        if self.request.user.is_authenticated:
            reachable = queryset.filter(entrepreneur=self.request.user)
        return reachable

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Public detail cannot increment the view counter silently for drafts.
        is_owner_or_staff = (
            request.user.is_authenticated
            and (request.user.is_staff or instance.entrepreneur_id == request.user.id)
        )
        if instance.status == Project.Status.ACTIVE and instance.is_verified or is_owner_or_staff:
            Project.objects.filter(pk=instance.pk).update(view_count=F("view_count") + 1)
            instance.refresh_from_db(fields=["view_count"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        project = serializer.save(entrepreneur=self.request.user)
        from apps.users.models import User

        notify_on_commit(
            recipient=project.entrepreneur,
            notification_type=Notification.NotificationType.PROJECT_SUBMITTED,
            title="Project submitted for review",
            body=f"Your project “{project.title}” has been submitted for review.",
            actor=self.request.user,
            target_type="project",
            target_id=str(project.id),
        )
        audit_log(
            action="project.create",
            actor=project.entrepreneur,
            target_type="project",
            target_id=str(project.id),
            metadata={"slug": project.slug},
            request=self.request,
        )
        for staff_user in User.objects.filter(is_staff=True, is_active=True):
            notify_on_commit(
                recipient=staff_user,
                notification_type=Notification.NotificationType.PROJECT_SUBMITTED,
                title="New project awaiting review",
                body=f"A new project “{project.title}” is awaiting verification.",
                actor=self.request.user,
                target_type="project",
                target_id=str(project.id),
            )

    def perform_destroy(self, instance):
        instance.deleted_at = timezone.now()
        instance.save(update_fields=["deleted_at", "updated_at"])
        audit_log(
            action="project.delete",
            actor=self.request.user,
            target_type="project",
            target_id=str(instance.id),
            request=self.request,
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAdminUser],
        throttle_classes=[AdminVerificationRateThrottle],
    )
    def verify(self, request, slug=None):
        project = self.get_object()
        serializer = ProjectVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project.is_verified = True
        project.status = Project.Status.ACTIVE
        project.verified_by = request.user
        project.verified_at = timezone.now()
        project.verification_notes = serializer.validated_data["verification_notes"]
        project.save(update_fields=["is_verified", "status", "verified_by", "verified_at", "verification_notes", "updated_at"])
        notify_on_commit(
            recipient=project.entrepreneur,
            notification_type=Notification.NotificationType.PROJECT_VERIFIED,
            title="Project verified",
            body=f"Your project “{project.title}” has been verified and is now active.",
            actor=request.user,
            target_type="project",
            target_id=str(project.id),
        )
        audit_log(
            action="project.verify",
            actor=request.user,
            target_type="project",
            target_id=str(project.id),
            metadata={"notes_preview": (project.verification_notes or "")[:80]},
            request=request,
        )
        return Response(self.get_serializer(project).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAdminUser],
        throttle_classes=[AdminVerificationRateThrottle],
    )
    def reject(self, request, slug=None):
        project = self.get_object()
        serializer = ProjectRejectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project.is_verified = False
        project.status = Project.Status.FAILED
        project.verified_by = request.user
        project.verified_at = timezone.now()
        project.verification_notes = serializer.validated_data["verification_notes"]
        project.save(update_fields=["is_verified", "status", "verified_by", "verified_at", "verification_notes", "updated_at"])
        notify_on_commit(
            recipient=project.entrepreneur,
            notification_type=Notification.NotificationType.PROJECT_REJECTED,
            title="Project rejected",
            body=f"Your project “{project.title}” was rejected. Please review the verifier notes.",
            actor=request.user,
            target_type="project",
            target_id=str(project.id),
        )
        audit_log(
            action="project.reject",
            actor=request.user,
            target_type="project",
            target_id=str(project.id),
            metadata={"notes_preview": (project.verification_notes or "")[:80]},
            request=request,
        )
        return Response(self.get_serializer(project).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAdminUser],
        throttle_classes=[AdminVerificationRateThrottle],
        url_path="set-status",
    )
    def set_status(self, request, slug=None):
        project = self.get_object()
        serializer = ProjectStatusSerializer(
            data=request.data,
            context={"project": project},
        )
        serializer.is_valid(raise_exception=True)
        old_status = project.status
        project.status = serializer.validated_data["status"]
        project.save(update_fields=["status", "updated_at"])
        audit_log(
            action="project.set_status",
            actor=request.user,
            target_type="project",
            target_id=str(project.id),
            metadata={"from": old_status, "to": project.status},
            request=request,
        )
        return Response(self.get_serializer(project).data)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def my(self, request):
        queryset = super().get_queryset().filter(deleted_at__isnull=True)
        if not request.user.is_staff:
            queryset = queryset.filter(entrepreneur=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ProjectListSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)
        serializer = ProjectListSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def payments(self, request, slug=None):
        """Authenticated-only: list confirmed investments for the given project.

        ``AllowAny`` was a privacy leak; investor names are PII. Restricted to
        authenticated users; the serializer reveals only confirmed amounts and
        a public investor name (the user's stored ``full_name`` or username).
        """
        project = self.get_object()
        confirmed = project.investments.filter(status="confirmed").select_related("investor").order_by("-investment_date")
        audit_log(
            action="project.payments.view",
            actor=request.user,
            target_type="project",
            target_id=str(project.id),
            request=request,
        )
        data = [
            {
                "id": str(inv.id),
                "investor_name": inv.investor.full_name or inv.investor.username,
                "amount": float(inv.amount),
                "date": inv.investment_date.isoformat(),
                "payment_method": inv.payment_method,
            }
            for inv in confirmed
        ]
        return Response(data)

    @action(detail=True, methods=["get"], permission_classes=[permissions.AllowAny])
    def events(self, request, slug=None):
        project = self.get_object()

        def event_stream():
            import redis
            import json
            from django.conf import settings

            # Send connection established event
            yield "data: {\"type\": \"connected\"}\n\n"

            try:
                r = redis.Redis.from_url(
                    settings.CELERY_BROKER_URL,
                    socket_connect_timeout=1,
                    socket_timeout=1,
                )
                # Test the connection to catch connection errors early
                r.ping()

                pubsub = r.pubsub()
                pubsub.subscribe(f"project_{project.id}")

                try:
                    for message in pubsub.listen():
                        if message['type'] == 'message':
                            data_str = message['data'].decode('utf-8')
                            yield f"data: {data_str}\n\n"
                except GeneratorExit:
                    pubsub.unsubscribe(f"project_{project.id}")
                    pubsub.close()
            except Exception as e:
                print(f"Redis connection failed for SSE: {e}")
                yield "data: {\"type\": \"error\", \"message\": \"SSE connection failed\"}\n\n"

        from django.http import StreamingHttpResponse
        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'  # Disable buffering in Nginx
        return response


