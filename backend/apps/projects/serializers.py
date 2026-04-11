from django.utils import timezone
from rest_framework import serializers

from apps.users.serializers import UserSerializer

from .models import Project, ProjectCategory, ProjectDocument, ProjectImage


class ProjectCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectCategory
        fields = ["id", "name", "slug", "description"]
        read_only_fields = ["id", "slug"]


class ProjectImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = ["id", "image", "alt_text", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProjectDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectDocument
        fields = ["id", "file", "title", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProjectSerializer(serializers.ModelSerializer):
    entrepreneur = UserSerializer(read_only=True)
    category_detail = ProjectCategorySerializer(source="category", read_only=True)
    images = ProjectImageSerializer(many=True, read_only=True)
    supporting_documents = ProjectDocumentSerializer(many=True, read_only=True)
    days_left = serializers.SerializerMethodField()
    funding_percent = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "entrepreneur", "title", "slug", "description", "short_description",
            "category", "category_detail", "location", "location_governorate",
            "goal_amount", "funded_amount", "minimum_investment", "expected_roi",
            "funding_period_days", "start_date", "end_date", "status", "is_verified",
            "verified_at", "verification_notes", "business_plan", "financial_projections",
            "ownership_proof", "cover_image", "images", "video_url",
            "ai_classified_category", "ai_confidence_score", "ai_classification_at",
            "ai_generated_summary", "milestone_count", "repayment_status",
            "total_repaid", "next_repayment_date", "view_count", "investor_count",
            "rating", "reviews_count", "supporting_documents", "days_left",
            "funding_percent", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "entrepreneur", "slug", "funded_amount", "is_verified", "verified_at",
            "ai_classified_category", "ai_confidence_score", "ai_classification_at",
            "ai_generated_summary", "milestone_count", "total_repaid", "view_count",
            "investor_count", "rating", "reviews_count", "created_at", "updated_at",
        ]

    def get_days_left(self, obj):
        if not obj.end_date:
            return None
        return max((obj.end_date.date() - timezone.localdate()).days, 0)

    def get_funding_percent(self, obj):
        if not obj.goal_amount:
            return 0
        return round((obj.funded_amount / obj.goal_amount) * 100, 2)


class ProjectListSerializer(ProjectSerializer):
    class Meta(ProjectSerializer.Meta):
        fields = [
            "id", "title", "slug", "short_description", "category", "category_detail",
            "location", "goal_amount", "funded_amount", "minimum_investment",
            "expected_roi", "status", "is_verified", "cover_image", "investor_count",
            "days_left", "funding_percent", "created_at",
        ]
