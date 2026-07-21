from django.db.models.deletion import ProtectedError
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .admin_serializers import (
    AdminProjectCategorySerializer,
    AdminProjectDocumentSerializer,
    AdminProjectImageSerializer,
    AdminProjectSerializer,
)
from .models import Project, ProjectCategory, ProjectDocument, ProjectImage
from .serializers import (
    ProjectRejectionSerializer,
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
        .prefetch_related("images", "supporting_documents")
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
        serializer = ProjectVerificationSerializer(data=request.data)
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
