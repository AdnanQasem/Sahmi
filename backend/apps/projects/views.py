import json
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import ProjectFilter
from .models import Project, ProjectCategory, ProjectEditRequest
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
from apps.core.throttling import AdminVerificationRateThrottle, ProjectTranslationRateThrottle
from apps.notifications.models import Notification
from apps.notifications.services import notify_on_commit
from .translation import translate_project_content, translate_project_edit_content


User = get_user_model()


class ProjectCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProjectCategory.objects.all()
    serializer_class = ProjectCategorySerializer
    permission_classes = [IsStaffOrReadOnly]
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.select_related("entrepreneur", "category", "funding_account").prefetch_related(
        "images", "supporting_documents", "milestones", "edit_requests"
    )
    serializer_class = ProjectSerializer
    permission_classes = [ProjectPermission]
    filterset_class = ProjectFilter
    search_fields = ["title", "short_description", "description", "location"]
    ordering_fields = ["created_at", "goal_amount", "funded_amount", "expected_roi", "investor_count"]
    lookup_field = "slug"
    public_statuses = (
        Project.Status.ACTIVE, Project.Status.SUCCESSFUL,
        Project.Status.IMPLEMENTATION, Project.Status.CLOSED,
    )

    def get_permissions(self):
        if self.action == "create":
            return [ProjectPermission(), IsEntrepreneur()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == "list":
            if self.request.user.is_authenticated and self.request.user.is_staff:
                return AdminProjectListSerializer
            return ProjectListSerializer
        if self.action in {"retrieve", "translation", "repayments"}:
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
            return queryset.filter(status__in=self.public_statuses, is_verified=True)
        if self.action in {"retrieve", "translation", "repayments"}:
            # Public visibility follows project verified/active rule; the
            # owner of the project can always retrieve their own.
            if self.request.user.is_authenticated:
                owner_q = queryset.filter(entrepreneur=self.request.user)
            else:
                owner_q = queryset.none()
            public_q = queryset.filter(status__in=self.public_statuses, is_verified=True)
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
        if instance.status in self.public_statuses and instance.is_verified or is_owner_or_staff:
            Project.objects.filter(pk=instance.pk).update(view_count=F("view_count") + 1)
            instance.refresh_from_db(fields=["view_count"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @staticmethod
    def _json_value(value):
        if isinstance(value, dict):
            return {key: ProjectViewSet._json_value(item) for key, item in value.items()}
        if isinstance(value, (list, tuple)):
            return [ProjectViewSet._json_value(item) for item in value]
        if isinstance(value, (date, datetime, Decimal, UUID)):
            return str(value)
        if hasattr(value, "pk"):
            return str(value.pk)
        return value

    @staticmethod
    def _milestone_edit_values(value):
        """Return only entrepreneur-editable milestone fields for diffing.

        The serializer representation also contains server-managed progress fields
        (status, actual completion date, and released funding). Those fields are
        intentionally absent from an edit submission and must not make an
        otherwise unchanged implementation timeline look edited.
        """
        editable_fields = (
            "id",
            "title",
            "description",
            "target_date",
            "deliverables",
            "percentage_of_project",
            "order",
        )
        return [
            {
                field: ProjectViewSet._json_value(milestone.get(field))
                for field in editable_fields
            }
            for milestone in (value or [])
        ]

    @transaction.atomic
    def _stage_approved_project_edit(self, request, partial):
        project = self.get_object()
        serializer = self.get_serializer(project, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        validated = dict(serializer.validated_data)
        staged_files = {
            field: validated.pop(field)
            for field in ("cover_image", "business_plan", "financial_projections", "ownership_proof")
            if field in validated
        }
        pending = ProjectEditRequest.objects.filter(
            project=project,
            status=ProjectEditRequest.Status.PENDING,
        ).first()
        if pending is None:
            pending = ProjectEditRequest(project=project, submitted_by=request.user)
        pending.submitted_by = request.user
        payload = self._json_value(validated)
        current = self.get_serializer(project).data
        changes = {}
        for field, after in payload.items():
            before = self._json_value(current.get(field))
            if field == "category":
                before_id, after_id = str(before), str(after)
                if before_id != after_id:
                    category_names = {
                        str(category.id): category.name
                        for category in ProjectCategory.objects.filter(id__in=[before_id, after_id])
                    }
                    changes[field] = {
                        "before": {"id": before_id, "name": category_names.get(before_id, before_id)},
                        "after": {"id": after_id, "name": category_names.get(after_id, after_id)},
                    }
            elif field == "milestones":
                if self._milestone_edit_values(before) != self._milestone_edit_values(after):
                    changes[field] = {"before": before, "after": after}
            elif before != after:
                changes[field] = {"before": before, "after": after}
        for field in staged_files:
            current_file = getattr(project, field)
            changes[field] = {
                "before": bool(current_file),
                "after": True,
            }
        pending.payload = payload
        pending.changes = changes
        pending.review_notes = ""
        if "cover_image" in staged_files:
            image_reviews = dict(pending.image_reviews or {})
            uploaded_cover = staged_files["cover_image"]
            image_reviews["cover_image"] = {
                "status": "needs_revision",
                "review_notes": "",
                "file_name": uploaded_cover.name,
                "size": uploaded_cover.size,
                "uploaded_at": timezone.now().isoformat(),
            }
            pending.image_reviews = image_reviews
        for field, uploaded_file in staged_files.items():
            setattr(pending, field, uploaded_file)
        pending.save()

        for staff_user in User.objects.filter(is_staff=True, is_active=True):
            notify_on_commit(
                recipient=staff_user,
                notification_type=Notification.NotificationType.PROJECT_SUBMITTED,
                title="Project edits awaiting review",
                body=f"“{project.title}” has edits awaiting administrator approval.",
                actor=request.user,
                target_type="project_edit",
                target_id=str(pending.id),
            )
        return Response(
            {
                **self.get_serializer(project).data,
                "edit_pending": True,
                "message": "Project edits were submitted for administrator approval.",
            },
            status=202,
        )

    def update(self, request, *args, **kwargs):
        project = self.get_object()
        if not request.user.is_staff and project.is_verified:
            return self._stage_approved_project_edit(request, partial=False)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        project = self.get_object()
        if not request.user.is_staff and project.is_verified:
            return self._stage_approved_project_edit(request, partial=True)
        return super().partial_update(request, *args, **kwargs)

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[permissions.AllowAny],
        throttle_classes=[ProjectTranslationRateThrottle],
    )
    def translation(self, request, slug=None):
        project = self.get_object()
        language = request.query_params.get("language", "").lower()
        if language not in {"ar", "en"}:
            return Response({"language": ["Choose either 'ar' or 'en'."]}, status=400)
        try:
            edit_request_id = request.query_params.get("edit_request")
            if edit_request_id:
                if not request.user.is_authenticated or not request.user.is_staff:
                    return Response({"detail": "Administrator access is required."}, status=403)
                edit_request = ProjectEditRequest.objects.filter(
                    id=edit_request_id,
                    project=project,
                    status=ProjectEditRequest.Status.PENDING,
                ).first()
                if edit_request is None:
                    return Response({"detail": "Pending edit request not found."}, status=404)
                return Response(translate_project_edit_content(edit_request, language))
            return Response(translate_project_content(project, language))
        except (OSError, ValueError, TypeError, json.JSONDecodeError):
            return Response(
                {"detail": "Project translation is temporarily unavailable."},
                status=503,
            )

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
        serializer = ProjectVerificationSerializer(data=request.data, context={"project": project})
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
            serializer = ProjectSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)
        serializer = ProjectSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def payments(self, request, slug=None):
        """Authenticated-only: list confirmed investments for the given project.

        ``AllowAny`` was a privacy leak; investor names are PII. Restricted to
        authenticated users; the serializer reveals only confirmed amounts and
        a public investor name (the user's stored ``full_name`` or username).
        """
        project = self.get_object()
        confirmed = project.investments.filter(status__in=["confirmed", "completed"]).select_related("investor").order_by("-investment_date")
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

    @action(detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def repayments(self, request, slug=None):
        """Return the caller's authorized schedule for a completed project."""
        project = self.get_object()
        if project.status != Project.Status.CLOSED:
            return Response([])
        from apps.investments.services import refresh_open_repayment_statuses
        refresh_open_repayment_statuses()
        repayments = project.investments.filter(status="completed").values_list(
            "repayments", flat=True
        )
        from apps.investments.models import Repayment
        records = Repayment.objects.filter(pk__in=repayments)
        if request.user.is_staff:
            pass
        elif request.user.id == project.entrepreneur_id:
            records = records.filter(investment__project__entrepreneur=request.user)
        elif request.user.user_type == "investor":
            if not project.investments.filter(investor=request.user).exists():
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You do not have access to this repayment schedule.")
            records = records.filter(investment__investor=request.user)
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this repayment schedule.")
        return Response([
            {
                "id": str(repayment.id),
                "amount": float(repayment.amount),
                "scheduled_date": repayment.scheduled_date.isoformat(),
                "actual_payment_date": repayment.actual_payment_date.isoformat() if repayment.actual_payment_date else None,
                "status": repayment.status,
                "payment_method": repayment.payment_method,
            }
            for repayment in records.select_related("investment").order_by("scheduled_date")
        ])

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


