from django.db.models import F
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import ProjectFilter
from .models import Project, ProjectCategory
from .permissions import IsEntrepreneur, ProjectPermission
from .serializers import ProjectCategorySerializer, ProjectListSerializer, ProjectSerializer


class ProjectCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProjectCategory.objects.all()
    serializer_class = ProjectCategorySerializer
    permission_classes = [permissions.IsAdminUser | permissions.IsAuthenticatedOrReadOnly]
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.select_related("entrepreneur", "category").prefetch_related("images", "supporting_documents")
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
            return ProjectListSerializer
        return ProjectSerializer

    def get_queryset(self):
        queryset = super().get_queryset().filter(deleted_at__isnull=True)
        if self.request.user.is_staff:
            return queryset
        if self.action == "list":
            return queryset.filter(status=Project.Status.ACTIVE, is_verified=True)
        return queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Project.objects.filter(pk=instance.pk).update(view_count=F("view_count") + 1)
        instance.refresh_from_db(fields=["view_count"])
        return Response(self.get_serializer(instance).data)

    def perform_create(self, serializer):
        serializer.save(entrepreneur=self.request.user)

    def perform_destroy(self, instance):
        instance.deleted_at = timezone.now()
        instance.save(update_fields=["deleted_at", "updated_at"])

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def verify(self, request, slug=None):
        project = self.get_object()
        project.is_verified = True
        project.status = Project.Status.ACTIVE
        project.verified_by = request.user
        project.verified_at = timezone.now()
        project.verification_notes = request.data.get("verification_notes", "")
        project.save(update_fields=["is_verified", "status", "verified_by", "verified_at", "verification_notes", "updated_at"])
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
