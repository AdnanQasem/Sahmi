from datetime import timedelta
from decimal import Decimal, DecimalException

from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone
from rest_framework import serializers

from apps.users.serializers import UserSerializer

from .models import Project, ProjectCategory, ProjectDocument, ProjectEditRequest, ProjectImage


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


class PublicProjectImageSerializer(serializers.ModelSerializer):
    """Public-facing image serializer: only public ``image`` and ``alt_text``."""
    class Meta:
        model = ProjectImage
        fields = ["id", "image", "alt_text"]
        read_only_fields = fields


class ProjectVerificationSerializer(serializers.Serializer):
    verification_notes = serializers.CharField(
        required=False,
        allow_blank=True,
        trim_whitespace=True,
        default="",
    )

    def validate(self, attrs):
        project = self.context["project"]
        missing = [
            field_name
            for field_name in ("business_plan", "financial_projections", "ownership_proof")
            if not getattr(project, field_name)
        ]
        if missing:
            raise serializers.ValidationError(
                {field_name: "This document is required before verification." for field_name in missing}
            )
        return attrs


class ProjectRejectionSerializer(serializers.Serializer):
    verification_notes = serializers.CharField(
        allow_blank=False,
        trim_whitespace=True,
    )


class ProjectStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            Project.Status.PAUSED,
            Project.Status.ACTIVE,
            Project.Status.FAILED,
            Project.Status.CANCELLED,
        ]
    )

    def validate_status(self, value):
        project = self.context["project"]
        if value == Project.Status.ACTIVE and not project.is_verified:
            raise serializers.ValidationError(
                "An unverified project cannot be activated."
            )
        return value


class ProjectOwnerSummarySerializer(serializers.ModelSerializer):
    """Public-safe entrepreneur summary used in the project detail endpoint."""

    class Meta:
        from apps.users.models import User

        model = User
        fields = ["id", "full_name", "business_name", "country", "city"]
        read_only_fields = fields


class ProjectCategoryRelatedField(serializers.PrimaryKeyRelatedField):
    def get_queryset(self):
        return ProjectCategory.objects.all()

    def to_internal_value(self, data):
        try:
            return super().to_internal_value(data)
        except serializers.ValidationError as exc:
            if isinstance(data, str):
                try:
                    return self.get_queryset().get(slug=data)
                except ProjectCategory.DoesNotExist:
                    pass
            raise exc


class ProjectMilestonesField(serializers.JSONField):
    def to_representation(self, value):
        milestones = value.all().order_by("order", "target_date", "created_at")
        request = self.context.get("request")
        return [
            {
                "id": str(milestone.id),
                "title": milestone.title,
                "description": milestone.description,
                "target_date": milestone.target_date.isoformat(),
                "actual_completion_date": (
                    milestone.actual_completion_date.isoformat()
                    if milestone.actual_completion_date
                    else None
                ),
                "status": milestone.status,
                "deliverables": milestone.deliverables,
                "percentage_of_project": f"{milestone.percentage_of_project:.2f}",
                "funding_released": f"{milestone.funding_released:.2f}",
                "order": milestone.order,
                "completion_status": milestone.completion_status,
                "completion_summary": milestone.completion_summary,
                "completion_submitted_at": (
                    milestone.completion_submitted_at.isoformat()
                    if milestone.completion_submitted_at
                    else None
                ),
                "completion_evidence": (
                    request.build_absolute_uri(milestone.completion_evidence.url)
                    if milestone.completion_evidence
                    and request
                    and (
                        request.user.is_staff
                        or request.user.id == milestone.project.entrepreneur_id
                        or milestone.completion_status == milestone.CompletionStatus.APPROVED
                    )
                    else None
                ),
                "completion_review_notes": (
                    milestone.completion_review_notes
                    if request
                    and request.user.is_authenticated
                    and (request.user.is_staff or request.user.id == milestone.project.entrepreneur_id)
                    else ""
                ),
            }
            for milestone in milestones
        ]


class ProjectSerializer(serializers.ModelSerializer):
    """
    Full serializer used by the owner (``entrepreneur``) and staff for create /
    retrieve / update / destroy of their own project. ``entrepreneur`` is read-only.
    """

    entrepreneur = UserSerializer(read_only=True)
    category = ProjectCategoryRelatedField(queryset=ProjectCategory.objects.all())
    category_detail = ProjectCategorySerializer(source="category", read_only=True)
    images = ProjectImageSerializer(many=True, read_only=True)
    supporting_documents = ProjectDocumentSerializer(many=True, read_only=True)
    cost_items = serializers.JSONField(required=False)
    faqs = serializers.JSONField(required=False)
    milestones = ProjectMilestonesField(required=False)
    days_left = serializers.SerializerMethodField()
    funding_percent = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    implementation_complete = serializers.SerializerMethodField()
    updates = serializers.SerializerMethodField()
    funding_account = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "entrepreneur", "title", "slug", "description", "short_description",
            "category", "category_detail", "location", "location_governorate",
            "goal_amount", "funded_amount", "funding_account", "funding_reached_at",
            "pending_payment_deadline", "funding_finalized_at", "funding_finalized_by",
            "minimum_investment", "expected_roi", "cost_items", "faqs",
            "funding_period_days", "start_date", "end_date", "status", "is_verified",
            "verified_at", "verification_notes", "business_plan", "financial_projections",
            "ownership_proof", "cover_image", "images", "video_url",
            "ai_classified_category", "ai_confidence_score", "ai_classification_at",
            "ai_generated_summary", "milestone_count", "repayment_status",
            "total_repaid", "next_repayment_date", "view_count", "investor_count",
            "rating", "reviews_count", "supporting_documents", "milestones", "days_left",
            "funding_percent", "implementation_complete", "updates", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "entrepreneur", "slug", "funded_amount", "funding_account",
            "funding_reached_at", "pending_payment_deadline", "funding_finalized_at", "funding_finalized_by",
            "status", "is_verified",
            "verified_at", "verification_notes", "ai_classified_category",
            "ai_confidence_score", "ai_classification_at", "ai_generated_summary",
            "milestone_count", "total_repaid", "view_count", "investor_count",
            "rating", "reviews_count", "implementation_complete", "updates", "created_at", "updated_at",
        ]

    def get_funding_account(self, obj):
        try:
            account = obj.funding_account
        except ObjectDoesNotExist:
            account = None
        if account is None:
            zero = "0.00"
            return {"secured": zero, "released": zero, "refunded": zero, "available": zero}
        return {
            "secured": f"{account.secured:.2f}",
            "released": f"{account.released:.2f}",
            "refunded": f"{account.refunded:.2f}",
            "available": f"{account.available:.2f}",
        }

    def get_implementation_complete(self, obj):
        milestones = list(obj.milestones.all())
        return bool(milestones) and all(
            milestone.status == "completed" and milestone.actual_completion_date
            for milestone in milestones
        )

    def get_updates(self, obj):
        approved = obj.edit_requests.filter(
            status=ProjectEditRequest.Status.APPROVED,
        ).order_by("-reviewed_at", "-created_at")
        return [
            {
                "id": str(edit.id),
                "published_at": edit.reviewed_at or edit.updated_at,
                "changes": edit.changes,
            }
            for edit in approved
            if edit.changes
        ]

    def validate_faqs(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("FAQs must be a list.")
        if len(value) > 20:
            raise serializers.ValidationError("A project may contain at most 20 FAQs.")
        normalized = []
        for index, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError({index: "Each FAQ must be an object."})
            question = str(item.get("question", "")).strip()
            answer = str(item.get("answer", "")).strip()
            if not question or not answer:
                raise serializers.ValidationError({index: "Both question and answer are required."})
            if len(question) > 240 or len(answer) > 3000:
                raise serializers.ValidationError({index: "FAQ question or answer is too long."})
            normalized.append({"question": question, "answer": answer})
        return normalized

    def get_days_left(self, obj):
        if not obj.end_date:
            return None
        return max((obj.end_date.date() - timezone.localdate()).days, 0)

    def get_status(self, obj):
        if obj.status == Project.Status.ACTIVE and obj.goal_amount and obj.funded_amount >= obj.goal_amount:
            return Project.Status.SUCCESSFUL
        return obj.status

    def get_funding_percent(self, obj):
        if not obj.goal_amount:
            return 0
        return round((obj.funded_amount / obj.goal_amount) * 100, 2)

    def validate_cost_items(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Cost items must be a list.")
        if not value:
            raise serializers.ValidationError("Add at least one project cost item.")
        if len(value) > 50:
            raise serializers.ValidationError("A project cost table may contain at most 50 items.")

        normalized = []
        item_errors = {}
        for index, item in enumerate(value):
            errors = {}
            if not isinstance(item, dict):
                item_errors[index] = {"non_field_errors": ["Each cost item must be an object."]}
                continue

            raw_description = item.get("description", "")
            description = raw_description.strip() if isinstance(raw_description, str) else ""
            if not description:
                errors["description"] = ["Cost description is required."]
            elif len(description) > 500:
                errors["description"] = ["Description may contain at most 500 characters."]

            decimals = {}
            for field_name, max_digits in (("quantity", 10), ("unit_cost", 12)):
                raw_value = item.get(field_name)
                try:
                    decimal_value = Decimal(str(raw_value))
                except (DecimalException, TypeError, ValueError):
                    errors[field_name] = ["Enter a valid number."]
                    continue
                if not decimal_value.is_finite():
                    errors[field_name] = ["Enter a valid number."]
                    continue
                if decimal_value <= 0:
                    errors[field_name] = ["Value must be greater than zero."]
                    continue
                if field_name == "quantity" and decimal_value != decimal_value.to_integral_value():
                    errors[field_name] = ["Quantity must be a whole number."]
                    continue
                try:
                    normalized_value = decimal_value.quantize(Decimal("0.01"))
                except DecimalException:
                    errors[field_name] = ["Enter a valid number."]
                    continue
                whole_digits = len(str(abs(normalized_value)).split(".")[0])
                if whole_digits > max_digits - 2:
                    errors[field_name] = [
                        f"Ensure there are no more than {max_digits - 2} digits before the decimal point."
                    ]
                    continue
                decimals[field_name] = normalized_value

            if errors:
                item_errors[index] = errors
                continue

            normalized.append(
                {
                    "name": str(index + 1),
                    "description": description,
                    "quantity": str(int(decimals["quantity"])),
                    "unit_cost": f'{decimals["unit_cost"]:.2f}',
                }
            )

        if item_errors:
            raise serializers.ValidationError(item_errors)
        return normalized

    def validate_milestones(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Milestones must be a list.")
        if not value:
            raise serializers.ValidationError("Add at least one project milestone.")
        if len(value) > 20:
            raise serializers.ValidationError("A project timeline may contain at most 20 milestones.")

        date_field = serializers.DateField()
        percentage_field = serializers.DecimalField(
            max_digits=5,
            decimal_places=2,
            min_value=Decimal("0.01"),
            max_value=Decimal("100.00"),
        )
        id_field = serializers.UUIDField()
        normalized = []
        item_errors = {}
        previous_target_date = None

        for index, item in enumerate(value):
            errors = {}
            if not isinstance(item, dict):
                item_errors[index] = {"non_field_errors": ["Each milestone must be an object."]}
                continue

            title = item.get("title", "")
            description = item.get("description", "")
            deliverables = item.get("deliverables", "")
            title = title.strip() if isinstance(title, str) else ""
            description = description.strip() if isinstance(description, str) else ""
            deliverables = deliverables.strip() if isinstance(deliverables, str) else ""
            if not title:
                errors["title"] = ["Milestone title is required."]
            elif len(title) > 120:
                errors["title"] = ["Milestone title may contain at most 120 characters."]
            if not description:
                errors["description"] = ["Milestone description is required."]
            elif len(description) > 2000:
                errors["description"] = ["Milestone description may contain at most 2000 characters."]
            if len(deliverables) > 2000:
                errors["deliverables"] = ["Deliverables may contain at most 2000 characters."]

            milestone_id = None
            if item.get("id"):
                try:
                    milestone_id = id_field.run_validation(item["id"])
                except serializers.ValidationError as exc:
                    errors["id"] = exc.detail
            try:
                target_date = date_field.run_validation(item.get("target_date"))
            except serializers.ValidationError as exc:
                errors["target_date"] = exc.detail
                target_date = None
            try:
                percentage = percentage_field.run_validation(item.get("percentage_of_project"))
            except serializers.ValidationError as exc:
                errors["percentage_of_project"] = exc.detail
                percentage = None

            if target_date:
                if self.instance is None and target_date < timezone.localdate():
                    errors["target_date"] = ["Target date cannot be in the past."]
                if previous_target_date and target_date < previous_target_date:
                    errors["target_date"] = ["Milestones must be ordered by target date."]
                previous_target_date = target_date

            if errors:
                item_errors[index] = errors
                continue
            normalized.append(
                {
                    "id": milestone_id,
                    "title": title,
                    "description": description,
                    "target_date": target_date,
                    "deliverables": deliverables,
                    "percentage_of_project": percentage,
                    "order": index + 1,
                }
            )

        if item_errors:
            raise serializers.ValidationError(item_errors)
        percentage_total = sum(
            (item["percentage_of_project"] for item in normalized),
            Decimal("0.00"),
        ).quantize(Decimal("0.01"))
        if percentage_total != Decimal("100.00"):
            raise serializers.ValidationError(
                f"Milestone percentages must total 100.00; current total is {percentage_total:.2f}."
            )
        return normalized

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if attrs.get("goal_amount") is not None and attrs["goal_amount"] <= 0:
            raise serializers.ValidationError({"goal_amount": "Funding goal must be greater than zero."})
        if attrs.get("minimum_investment") is not None and attrs["minimum_investment"] <= 0:
            raise serializers.ValidationError({"minimum_investment": "Minimum investment must be greater than zero."})
        if attrs.get("funding_period_days") is not None and attrs["funding_period_days"] <= 0:
            raise serializers.ValidationError({"funding_period_days": "Campaign duration must be greater than zero."})

        supplied_cost_items = attrs.get("cost_items")
        if self.instance is None and not supplied_cost_items:
            raise serializers.ValidationError({"cost_items": "Add at least one project cost item."})
        if self.instance is None and not attrs.get("milestones"):
            raise serializers.ValidationError({"milestones": "Add at least one project milestone."})

        goal_amount = attrs.get("goal_amount", getattr(self.instance, "goal_amount", None))
        effective_cost_items = supplied_cost_items
        if effective_cost_items is None and self.instance is not None:
            effective_cost_items = self.instance.cost_items
        if goal_amount is not None and effective_cost_items:
            cost_total = sum(
                Decimal(item["quantity"]) * Decimal(item["unit_cost"])
                for item in effective_cost_items
            ).quantize(Decimal("0.01"))
            if cost_total != goal_amount.quantize(Decimal("0.01")):
                raise serializers.ValidationError(
                    {
                        "cost_items": (
                            f"Cost table total ({cost_total:.2f}) must equal "
                            f"the funding goal ({goal_amount:.2f})."
                        )
                    }
                )
        elif "goal_amount" in attrs and self.instance is not None:
            raise serializers.ValidationError(
                {"cost_items": "Add a project cost table before changing the funding goal."}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        milestones = validated_data.pop("milestones")
        if not validated_data.get("end_date"):
            start_date = validated_data.get("start_date") or timezone.now()
            validated_data["end_date"] = start_date + timedelta(days=validated_data.get("funding_period_days", 30))
        project = super().create(validated_data)
        self._sync_milestones(project, milestones)
        return project

    @transaction.atomic
    def update(self, instance, validated_data):
        milestones = validated_data.pop("milestones", serializers.empty)
        replaced_files = []
        for field_name in ("business_plan", "financial_projections", "ownership_proof"):
            if field_name not in validated_data:
                continue
            old_file = getattr(instance, field_name)
            if old_file and old_file.name:
                replaced_files.append((old_file.storage, old_file.name))
        if "funding_period_days" in validated_data and "end_date" not in validated_data:
            start_date = validated_data.get("start_date") or instance.start_date or timezone.now()
            validated_data["end_date"] = start_date + timedelta(days=validated_data["funding_period_days"])
        project = super().update(instance, validated_data)
        if milestones is not serializers.empty:
            self._sync_milestones(project, milestones)
        for storage, name in replaced_files:
            transaction.on_commit(
                lambda storage=storage, name=name: storage.delete(name),
                robust=True,
            )
        return project

    @staticmethod
    def _sync_milestones(project, milestone_data):
        from apps.investments.models import Milestone

        existing = {milestone.id: milestone for milestone in project.milestones.all()}
        seen_ids = set()
        new_milestones = []
        for item in milestone_data:
            item = dict(item)
            milestone_id = item.pop("id", None)
            if milestone_id:
                if milestone_id in seen_ids or milestone_id not in existing:
                    raise serializers.ValidationError(
                        {"milestones": "A milestone id was duplicated or does not belong to this project."}
                    )
                seen_ids.add(milestone_id)
                milestone = existing.pop(milestone_id)
                for field_name, value in item.items():
                    setattr(milestone, field_name, value)
                milestone.save(
                    update_fields=[
                        "title", "description", "target_date", "deliverables",
                        "percentage_of_project", "order", "updated_at",
                    ]
                )
            else:
                new_milestones.append(Milestone(project=project, **item))

        protected = [
            milestone
            for milestone in existing.values()
            if milestone.status != Milestone.Status.PENDING or milestone.funding_released != 0
        ]
        if protected:
            raise serializers.ValidationError(
                {"milestones": "Started, completed, delayed, or funded milestones cannot be removed from the project editor."}
            )
        if existing:
            Milestone.objects.filter(pk__in=existing).delete()
        if new_milestones:
            Milestone.objects.bulk_create(new_milestones)
        getattr(project, "_prefetched_objects_cache", {}).pop("milestones", None)
        project.milestone_count = project.milestones.count()
        project.save(update_fields=["milestone_count", "updated_at"])


class PublicProjectSerializer(serializers.ModelSerializer):
    """
    Public-facing project serializer. Strips:
    - document URLs (``business_plan``, ``financial_projections``, ``ownership_proof``)
    - supporting document files and titles
    - ``verification_notes`` (administrative)
    - ``view_count`` and other internal telemetry
    - direct ``entrepreneur`` user email / phone / kyc fields
    """

    entrepreneur = ProjectOwnerSummarySerializer(read_only=True)
    category_detail = ProjectCategorySerializer(source="category", read_only=True)
    images = PublicProjectImageSerializer(many=True, read_only=True)
    milestones = ProjectMilestonesField(read_only=True)
    days_left = serializers.SerializerMethodField()
    funding_percent = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    implementation_complete = serializers.SerializerMethodField()
    updates = serializers.SerializerMethodField()
    funding_account = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "entrepreneur", "title", "slug", "description", "short_description",
            "category_detail", "location", "location_governorate",
            "goal_amount", "funded_amount", "funding_account", "funding_reached_at",
            "pending_payment_deadline", "funding_finalized_at", "minimum_investment", "expected_roi", "cost_items", "faqs",
            "funding_period_days", "start_date", "end_date", "status", "is_verified",
            "verified_at", "cover_image", "images", "video_url",
            "milestone_count", "milestones", "repayment_status",
            "next_repayment_date", "investor_count",
            "days_left", "funding_percent", "implementation_complete", "updates", "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_days_left(self, obj):
        if not obj.end_date:
            return None
        return max((obj.end_date.date() - timezone.localdate()).days, 0)

    def get_status(self, obj):
        if obj.status == Project.Status.ACTIVE and obj.goal_amount and obj.funded_amount >= obj.goal_amount:
            return Project.Status.SUCCESSFUL
        return obj.status

    def get_funding_percent(self, obj):
        if not obj.goal_amount:
            return 0
        return round((obj.funded_amount / obj.goal_amount) * 100, 2)

    def get_implementation_complete(self, obj):
        return ProjectSerializer.get_implementation_complete(self, obj)

    def get_updates(self, obj):
        return ProjectSerializer.get_updates(self, obj)

    def get_funding_account(self, obj):
        return ProjectSerializer.get_funding_account(self, obj)


class ProjectListSerializer(ProjectSerializer):
    class Meta(ProjectSerializer.Meta):
        fields = [
            "id", "title", "slug", "short_description", "category", "category_detail",
            "location", "goal_amount", "funded_amount", "minimum_investment",
            "expected_roi", "status", "is_verified", "cover_image", "investor_count",
            "repayment_status", "funding_account", "days_left", "funding_percent", "created_at", "updated_at",
        ]


class AdminProjectOwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSerializer.Meta.model
        fields = ["id", "email", "full_name", "business_name"]


class AdminProjectListSerializer(ProjectListSerializer):
    entrepreneur = AdminProjectOwnerSerializer(read_only=True)

    class Meta(ProjectListSerializer.Meta):
        fields = ["entrepreneur", *ProjectListSerializer.Meta.fields]
