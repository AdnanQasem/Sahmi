from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import Project, ProjectCategory, ProjectDocument, ProjectEditRequest, ProjectImage
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
    pending_edit_request = serializers.SerializerMethodField()
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
            "cost_items",
            "faqs",
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
            "milestones",
            "days_left",
            "funding_percent",
            "pending_edit_request",
            "implementation_complete",
            "updates",
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
            "pending_edit_request",
            "implementation_complete",
            "updates",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {"slug": {"required": False, "allow_blank": True}}

    def get_pending_edit_request(self, obj):
        pending = obj.edit_requests.filter(status=ProjectEditRequest.Status.PENDING).first()
        if pending is None:
            return None
        request = self.context.get("request")
        file_urls = {}
        for field in ("cover_image", "business_plan", "financial_projections", "ownership_proof"):
            file = getattr(pending, field)
            if file:
                url = file.url
                file_urls[field] = request.build_absolute_uri(url) if request else url
        changes = pending.changes
        if not changes:
            current = ProjectSerializer(obj, context=self.context).data
            changes = {
                field: {"before": current.get(field), "after": after}
                for field, after in pending.payload.items()
                if current.get(field) != after
            }
        return {
            "id": str(pending.id),
            "payload": pending.payload,
            "changes": changes,
            "files": file_urls,
            "submitted_by": str(pending.submitted_by_id),
            "created_at": pending.created_at,
        }

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

        next_return_date = attrs.get(
            "next_repayment_date",
            getattr(self.instance, "next_repayment_date", None),
        )
        if next_return_date:
            funded_amount = attrs.get(
                "funded_amount",
                getattr(self.instance, "funded_amount", 0),
            )
            goal_amount = attrs.get(
                "goal_amount",
                getattr(self.instance, "goal_amount", 0),
            )
            if funded_amount < goal_amount:
                raise serializers.ValidationError({
                    "next_repayment_date": (
                        "Return of Investment payments cannot be scheduled until "
                        "the project reaches 100% funding."
                    )
                })

            milestone_data = attrs.get("milestones")
            if milestone_data is not None:
                completion_dates = [
                    milestone.get("actual_completion_date")
                    for milestone in milestone_data
                    if milestone.get("status") == "completed"
                ]
                implementation_complete = bool(milestone_data) and all(
                    milestone.get("status") == "completed"
                    and milestone.get("actual_completion_date")
                    for milestone in milestone_data
                )
            elif self.instance:
                milestones = self.instance.milestones.all()
                implementation_complete = milestones.exists() and not milestones.exclude(
                    status="completed",
                ).exists()
                completion_dates = list(
                    milestones.values_list("actual_completion_date", flat=True)
                )
                implementation_complete = implementation_complete and all(completion_dates)
            else:
                implementation_complete = False
                completion_dates = []

            if not implementation_complete:
                raise serializers.ValidationError({
                    "next_repayment_date": (
                        "Return of Investment payments cannot be scheduled until "
                        "implementation is complete and the project is operating."
                    )
                })
            operations_start_date = max(completion_dates)
            if next_return_date < operations_start_date:
                raise serializers.ValidationError({
                    "next_repayment_date": (
                        "The first Return of Investment payment cannot be scheduled "
                        f"before the project became operational on {operations_start_date}."
                    )
                })
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
