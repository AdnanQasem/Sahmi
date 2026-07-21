from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import Project, ProjectCategory, ProjectDocument, ProjectImage
from .serializers import ProjectSerializer


User = get_user_model()


class AdminRelatedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "user_type", "business_name"]


class AdminProjectCategorySerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(
        required=False,
        allow_blank=True,
        max_length=100,
        validators=[UniqueValidator(queryset=ProjectCategory.objects.all())],
    )
    class Meta:
        model = ProjectCategory
        fields = ["id", "name", "slug", "description", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {"slug": {"required": False, "allow_blank": True}}


    def validate(self, attrs):
        attrs = super().validate(attrs)
        slug_was_supplied = 'slug' in attrs
        if not self.instance or slug_was_supplied:
            name = attrs.get('name', getattr(self.instance, 'name', ''))
            candidate_slug = attrs.get('slug') or slugify(name)
            queryset = ProjectCategory.objects.filter(slug=candidate_slug)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError(
                    {'slug': 'A category with this slug already exists.'}
                )
            attrs['slug'] = candidate_slug
        return attrs


class AdminProjectImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = ["id", "project", "image", "alt_text", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class AdminProjectDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectDocument
        fields = ["id", "project", "file", "title", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class AdminProjectSerializer(ProjectSerializer):
    slug = serializers.SlugField(
        required=False,
        allow_blank=True,
        max_length=140,
        validators=[UniqueValidator(queryset=Project.objects.all())],
    )
    clear_business_plan = serializers.BooleanField(write_only=True, required=False, default=False)
    clear_financial_projections = serializers.BooleanField(write_only=True, required=False, default=False)
    clear_ownership_proof = serializers.BooleanField(write_only=True, required=False, default=False)
    clear_cover_image = serializers.BooleanField(write_only=True, required=False, default=False)
    entrepreneur = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    entrepreneur_detail = AdminRelatedUserSerializer(
        source="entrepreneur",
        read_only=True,
    )
    category = serializers.PrimaryKeyRelatedField(queryset=ProjectCategory.objects.all())
    category_detail = AdminProjectCategorySerializer(source="category", read_only=True)
    verified_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        allow_null=True,
        required=False,
    )
    verified_by_detail = AdminRelatedUserSerializer(source="verified_by", read_only=True)
    images = AdminProjectImageSerializer(many=True, read_only=True)
    supporting_documents = AdminProjectDocumentSerializer(many=True, read_only=True)

    class Meta(ProjectSerializer.Meta):
        validators = []
        fields = [
            'clear_business_plan',
            'clear_financial_projections',
            'clear_ownership_proof',
            'clear_cover_image',
            "id",
            "entrepreneur",
            "entrepreneur_detail",
            "title",
            "slug",
            "description",
            "short_description",
            "category",
            "category_detail",
            "location",
            "location_governorate",
            "goal_amount",
            "funded_amount",
            "minimum_investment",
            "expected_roi",
            "funding_period_days",
            "start_date",
            "end_date",
            "status",
            "is_verified",
            "verified_by",
            "verified_by_detail",
            "verified_at",
            "verification_notes",
            "business_plan",
            "financial_projections",
            "ownership_proof",
            "cover_image",
            "images",
            "video_url",
            "ai_classified_category",
            "ai_confidence_score",
            "ai_classification_at",
            "ai_generated_summary",
            "milestone_count",
            "repayment_status",
            "total_repaid",
            "next_repayment_date",
            "view_count",
            "investor_count",
            "rating",
            "reviews_count",
            "supporting_documents",
            "days_left",
            "funding_percent",
            "deleted_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "entrepreneur_detail",
            "category_detail",
            "verified_by_detail",
            "images",
            "supporting_documents",
            "days_left",
            "funding_percent",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {"slug": {"required": False, "allow_blank": True}}

    def validate(self, attrs):
        attrs = super().validate(attrs)
        slug_was_supplied = 'slug' in attrs
        if not self.instance or slug_was_supplied:
            title = attrs.get('title', getattr(self.instance, 'title', ''))
            candidate_slug = attrs.get('slug') or slugify(title)
            queryset = Project.objects.filter(slug=candidate_slug)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError(
                    {'slug': 'A project with this slug already exists.'}
                )
            attrs['slug'] = candidate_slug
        if attrs.get("is_verified"):
            request = self.context.get("request")
            instance = self.instance
            if "verified_by" not in attrs and not getattr(instance, "verified_by_id", None):
                attrs["verified_by"] = request.user if request else None
            if "verified_at" not in attrs and not getattr(instance, "verified_at", None):
                attrs["verified_at"] = timezone.now()
        return attrs

    @staticmethod
    def _pop_clear_flags(validated_data):
        return {
            field_name: validated_data.pop(f'clear_{field_name}', False)
            for field_name in (
                'business_plan',
                'financial_projections',
                'ownership_proof',
                'cover_image',
            )
        }

    def create(self, validated_data):
        clear_flags = self._pop_clear_flags(validated_data)
        for field_name, should_clear in clear_flags.items():
            if should_clear:
                validated_data[field_name] = None
        return super().create(validated_data)

    def update(self, instance, validated_data):
        clear_flags = self._pop_clear_flags(validated_data)
        files_to_delete = []
        for field_name, should_clear in clear_flags.items():
            if not should_clear:
                continue
            old_file = getattr(instance, field_name)
            if old_file and old_file.name:
                files_to_delete.append((old_file.storage, old_file.name))
            validated_data[field_name] = None

        instance = super().update(instance, validated_data)
        for storage, name in files_to_delete:
            transaction.on_commit(
                lambda storage=storage, name=name: storage.delete(name),
                robust=True,
            )
        return instance
