from django.db import transaction
from django.db.models.deletion import ProtectedError
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.notifications.models import Notification
from apps.notifications.services import notify_on_commit
from .admin_serializers import (
    AdminProjectCategorySerializer,
    AdminProjectDocumentSerializer,
    AdminProjectImageSerializer,
    AdminProjectSerializer,
)
from .models import Project, ProjectCategory, ProjectDocument, ProjectEditRequest, ProjectImage
from .serializers import (
    ProjectRejectionSerializer,
    ProjectSerializer,
    ProjectStatusSerializer,
    ProjectVerificationSerializer,
)


class AdminProjectCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProjectCategory.objects.all()
    serializer_class = AdminProjectCategorySerializer
    permission_classes = [permissions.IsAdminUser]
    search_fields = ["name", "slug", "description"]
    ordering_fields = ["name", "slug", "created_at", "updated_at"]
    ordering = ["name"]

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "This category is still used by one or more projects."},
                status=status.HTTP_409_CONFLICT,
            )


class AdminProjectViewSet(viewsets.ModelViewSet):
    queryset = (
        Project.objects.select_related("entrepreneur", "category", "verified_by")
        .prefetch_related("images", "supporting_documents", "milestones", "edit_requests")
        .all()
    )
    serializer_class = AdminProjectSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = {
        "entrepreneur": ["exact"],
        "category": ["exact"],
        "status": ["exact"],
        "is_verified": ["exact"],
        "repayment_status": ["exact"],
        "deleted_at": ["exact", "isnull"],
        "start_date": ["date", "gte", "lte"],
        "end_date": ["date", "gte", "lte"],
    }
    search_fields = [
        "title",
        "slug",
        "short_description",
        "description",
        "location",
        "location_governorate",
        "entrepreneur__email",
        "entrepreneur__full_name",
        "category__name",
    ]
    ordering_fields = [
        "title",
        "created_at",
        "updated_at",
        "start_date",
        "end_date",
        "goal_amount",
        "funded_amount",
        "minimum_investment",
        "expected_roi",
        "status",
        "investor_count",
        "view_count",
        "rating",
    ]
    ordering = ["-created_at"]

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        project = self.get_object()
        serializer = ProjectVerificationSerializer(data=request.data, context={"project": project})
        serializer.is_valid(raise_exception=True)
        project.is_verified = True
        project.status = Project.Status.ACTIVE
        project.verified_by = request.user
        project.verified_at = timezone.now()
        project.verification_notes = serializer.validated_data["verification_notes"]
        project.save(
            update_fields=[
                "is_verified",
                "status",
                "verified_by",
                "verified_at",
                "verification_notes",
                "updated_at",
            ]
        )
        return Response(self.get_serializer(project).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        project = self.get_object()
        serializer = ProjectRejectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project.is_verified = False
        project.status = Project.Status.FAILED
        project.verified_by = request.user
        project.verified_at = timezone.now()
        project.verification_notes = serializer.validated_data["verification_notes"]
        project.save(
            update_fields=[
                "is_verified",
                "status",
                "verified_by",
                "verified_at",
                "verification_notes",
                "updated_at",
            ]
        )
        return Response(self.get_serializer(project).data)

    @action(detail=True, methods=["post"], url_path="set-status")
    def set_status(self, request, pk=None):
        project = self.get_object()
        serializer = ProjectStatusSerializer(
            data=request.data,
            context={"project": project},
        )
        serializer.is_valid(raise_exception=True)
        project.status = serializer.validated_data["status"]
        project.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(project).data)

    def _pending_edit(self, project):
        pending = project.edit_requests.filter(
            status=ProjectEditRequest.Status.PENDING,
        ).first()
        if pending is None:
            from rest_framework.exceptions import NotFound
            raise NotFound("This project has no pending edit request.")
        return pending

    @action(detail=True, methods=["post"], url_path="approve-edit")
    @transaction.atomic
    def approve_edit(self, request, pk=None):
        project = self.get_object()
        pending = self._pending_edit(project)
        serializer = ProjectSerializer(
            project,
            data=pending.payload,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        project = serializer.save()

        file_fields = ("cover_image", "business_plan", "financial_projections", "ownership_proof")
        changed_files = []
        for field in file_fields:
            staged_file = getattr(pending, field)
            if staged_file:
                setattr(project, field, staged_file.name)
                changed_files.append(field)
        if changed_files:
            project.save(update_fields=[*changed_files, "updated_at"])

        pending.status = ProjectEditRequest.Status.APPROVED
        pending.review_notes = str(request.data.get("verification_notes", ""))[:2000]
        pending.reviewed_by = request.user
        pending.reviewed_at = timezone.now()
        pending.save(update_fields=["status", "review_notes", "reviewed_by", "reviewed_at", "updated_at"])
        notify_on_commit(
            recipient=project.entrepreneur,
            notification_type=Notification.NotificationType.PROJECT_VERIFIED,
            title="Project edits approved",
            body=f"Your edits to “{project.title}” were approved and published.",
            actor=request.user,
            target_type="project",
            target_id=str(project.id),
        )
        return Response(self.get_serializer(project).data)

    @action(detail=True, methods=["post"], url_path="reject-edit")
    def reject_edit(self, request, pk=None):
        project = self.get_object()
        pending = self._pending_edit(project)
        notes = str(request.data.get("verification_notes", "")).strip()
        if not notes:
            return Response(
                {"verification_notes": ["Review notes are required when rejecting edits."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        pending.status = ProjectEditRequest.Status.REJECTED
        pending.review_notes = notes[:2000]
        pending.reviewed_by = request.user
        pending.reviewed_at = timezone.now()
        pending.save(update_fields=["status", "review_notes", "reviewed_by", "reviewed_at", "updated_at"])
        notify_on_commit(
            recipient=project.entrepreneur,
            notification_type=Notification.NotificationType.PROJECT_REJECTED,
            title="Project edits need revision",
            body=f"Your proposed edits to “{project.title}” were not approved. Review the administrator notes.",
            actor=request.user,
            target_type="project",
            target_id=str(project.id),
        )
        return Response(self.get_serializer(project).data)


class AdminProjectImageViewSet(viewsets.ModelViewSet):
    queryset = ProjectImage.objects.select_related("project")
    serializer_class = AdminProjectImageSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ["project"]
    search_fields = ["alt_text", "project__title", "project__slug"]
    ordering_fields = ["created_at", "updated_at", "alt_text"]
    ordering = ["-created_at"]


class AdminProjectDocumentViewSet(viewsets.ModelViewSet):
    queryset = ProjectDocument.objects.select_related("project")
    serializer_class = AdminProjectDocumentSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ["project"]
    search_fields = ["title", "project__title", "project__slug"]
    ordering_fields = ["created_at", "updated_at", "title"]
    ordering = ["-created_at"]
