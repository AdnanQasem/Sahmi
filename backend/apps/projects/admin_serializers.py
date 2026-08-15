from copy import deepcopy
from pathlib import Path
from uuid import UUID

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import Project, ProjectCategory, ProjectDocument, ProjectEditRequest, ProjectImage
from .serializers import ProjectSerializer


User = get_user_model()


def _milestone_edit_values(value):
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
        {field: milestone.get(field) for field in editable_fields}
        for milestone in (value or [])
    ]


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
            "funding_account",
            "funding_reached_at",
            "pending_payment_deadline",
            "funding_finalized_at",
            "funding_finalized_by",
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
            "funded_amount",
            "funding_account",
            "funding_reached_at",
            "pending_payment_deadline",
            "funding_finalized_at",
            "funding_finalized_by",
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
        changes = deepcopy(pending.changes)
        if not changes:
            current = ProjectSerializer(obj, context=self.context).data
            changes = {
                field: {"before": current.get(field), "after": after}
                for field, after in pending.payload.items()
                if current.get(field) != after
            }
        category_change = changes.get("category")
        if category_change:
            def category_value(value):
                if isinstance(value, dict):
                    return str(value.get("id", "")), str(value.get("name", ""))
                return str(value), ""

            before_id, before_label = category_value(category_change.get("before"))
            after_id, after_label = category_value(category_change.get("after"))
            if before_id == after_id:
                changes.pop("category", None)
            else:
                valid_ids = []
                for category_pk in (before_id, after_id):
                    try:
                        valid_ids.append(UUID(category_pk))
                    except (TypeError, ValueError):
                        pass
                names = {
                    str(item.id): item.name
                    for item in ProjectCategory.objects.filter(id__in=valid_ids)
                }
                changes["category"] = {
                    "before": names.get(before_id, before_label or before_id),
                    "after": names.get(after_id, after_label or after_id),
                }

        milestone_change = changes.get("milestones")
        if milestone_change and _milestone_edit_values(
            milestone_change.get("before")
        ) == _milestone_edit_values(milestone_change.get("after")):
            changes.pop("milestones", None)

        image_reviews = pending.image_reviews or {}
        images = []

        def append_image(key, kind, file, uploaded_at):
            if not file:
                return
            try:
                size = file.size
            except (OSError, ValueError):
                size = None
            url = file.url
            review = image_reviews.get(key, {})
            images.append({
                "key": key,
                "kind": kind,
                "url": request.build_absolute_uri(url) if request else url,
                "file_name": review.get("file_name") or Path(file.name).name,
                "upload_date": review.get("uploaded_at") or uploaded_at,
                "size": review.get("size", size),
                "review_notes": review.get("review_notes", ""),
                "status": review.get("status", "needs_revision"),
                "reviewed_by": review.get("reviewed_by"),
                "reviewed_at": review.get("reviewed_at"),
            })

        if pending.cover_image:
            append_image("cover_image", "proposed_cover", pending.cover_image, pending.updated_at)
        else:
            append_image("project_cover", "current_cover", obj.cover_image, obj.updated_at)
        for project_image in obj.images.all():
            append_image(
                f"project_image:{project_image.id}", "gallery", project_image.image, project_image.created_at,
            )
        return {
            "id": str(pending.id),
            "payload": pending.payload,
            "changes": changes,
            "files": file_urls,
            "images": images,
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
