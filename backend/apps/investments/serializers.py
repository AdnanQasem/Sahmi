from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.projects.serializers import ProjectListSerializer
from apps.projects.models import SAHMI_PLATFORM_FEE_RATE

from .models import (
    Investment,
    Milestone,
    ProjectFundingAccount,
    Repayment,
    RepaymentPlan,
    RepaymentTransfer,
    WithdrawalRequest,
)


class InvestmentSerializer(serializers.ModelSerializer):
    investor = serializers.StringRelatedField(read_only=True)
    project_detail = ProjectListSerializer(source="project", read_only=True)
    status = serializers.ChoiceField(
        choices=Investment.Status.choices,
        read_only=True,
        help_text=(
            "Investment status is server-controlled. Clients cannot directly "
            "confirm an investment. Use POST /api/v1/investments/{id}/cancel/ "
            "to withdraw a pending investment."
        ),
    )

    class Meta:
        model = Investment
        fields = [
            "id", "investor", "project", "project_detail", "amount", "quantity",
            "investment_date", "status", "transaction_id", "payment_method",
            "pending_expires_at",
            "expected_return", "actual_return", "return_received_at", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "investor", "investment_date", "status", "expected_return",
            "actual_return", "return_received_at", "pending_expires_at",
            "created_at", "updated_at",
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        if (
            self.instance is None
            and request
            and (request.user.user_type != "investor" or request.user.is_staff)
        ):
            raise serializers.ValidationError(
                "Only investor accounts can create investments."
            )
        project = attrs.get("project")
        amount = attrs.get("amount")
        if project and amount and amount < project.minimum_investment:
            raise serializers.ValidationError(
                {"amount": f"Minimum investment is {project.minimum_investment}."}
            )
        if project and not project.is_verified:
            raise serializers.ValidationError(
                {"project": "Project is not verified; it cannot accept investments."}
            )
        if (
            project
            and project.status
            not in (Project.Status.ACTIVE,)
        ):
            raise serializers.ValidationError(
                {"project": "Project is not currently accepting investments."}
            )
        return attrs


class MilestoneSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(
        choices=Milestone.Status.choices,
        read_only=True,
        help_text="Milestone status is server-controlled.",
    )
    funding_released = serializers.DecimalField(
        max_digits=12, decimal_places=2,
        read_only=True,
        help_text="Funding release is server-controlled.",
    )
    actual_completion_date = serializers.DateField(
        read_only=True,
        help_text="Completion date is set by an authorized server-controlled workflow.",
    )

    class Meta:
        model = Milestone
        fields = "__all__"
        read_only_fields = [
            "id", "status", "funding_released", "actual_completion_date",
            "completion_status", "completion_summary", "completion_evidence",
            "completion_submitted_at", "completion_review_notes",
            "completion_reviewed_by", "completion_reviewed_at",
            "created_at", "updated_at",
        ]


class RepaymentTransferSerializer(serializers.ModelSerializer):
    agreement_accepted = serializers.BooleanField(write_only=True)
    receipt = serializers.FileField(write_only=True, required=False, allow_null=True)
    source_of_funds_declaration = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )
    receipt_url = serializers.SerializerMethodField()
    submitted_by_name = serializers.CharField(source="submitted_by.full_name", read_only=True)

    class Meta:
        model = RepaymentTransfer
        fields = [
            "id", "repayment", "submitted_by", "submitted_by_name", "amount",
            "currency", "inbound_reference", "inbound_transfer_date", "receipt",
            "receipt_url", "source_of_funds_declaration", "agreement_version",
            "agreement_accepted", "agreement_accepted_at", "status", "reviewed_by",
            "reviewed_at", "review_notes", "outbound_reference", "disbursed_by",
            "disbursed_at", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "submitted_by", "amount", "currency", "agreement_version",
            "agreement_accepted_at", "status", "reviewed_by", "reviewed_at",
            "review_notes", "outbound_reference", "disbursed_by", "disbursed_at",
            "created_at", "updated_at",
        ]

    def get_receipt_url(self, obj):
        request = self.context.get("request")
        if not request or not obj.receipt:
            return None
        if not (request.user.is_staff or request.user.pk == obj.submitted_by_id):
            return None
        return request.build_absolute_uri(obj.receipt.url)

    def validate_receipt(self, value):
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Transfer receipts may not exceed 10 MB.")
        extension = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        if extension not in {"pdf", "png", "jpg", "jpeg", "webp"}:
            raise serializers.ValidationError("The receipt must be a PDF or image file.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context["request"]
        repayment = attrs.get("repayment")
        if request.user.user_type != "entrepreneur" or request.user.is_staff:
            raise serializers.ValidationError(
                "Only the project entrepreneur can submit repayment funding."
            )
        if repayment.investment.project.entrepreneur_id != request.user.id:
            raise serializers.ValidationError({
                "repayment": "You can only fund repayments for your own project."
            })
        if repayment.status in {Repayment.Status.PAID, Repayment.Status.CANCELLED}:
            raise serializers.ValidationError({
                "repayment": "This repayment is already final."
            })
        if repayment.plan_id and repayment.plan.status != RepaymentPlan.Status.APPROVED:
            raise serializers.ValidationError({
                "repayment": "The repayment plan must be approved before it can be funded."
            })
        if hasattr(repayment, "funding_transfer"):
            raise serializers.ValidationError({
                "repayment": "A funding transfer already exists for this repayment."
            })
        if attrs["inbound_transfer_date"] > timezone.localdate():
            raise serializers.ValidationError({
                "inbound_transfer_date": "The transfer date cannot be in the future."
            })
        attrs["source_of_funds_declaration"] = attrs.get(
            "source_of_funds_declaration", ""
        ).strip()
        if not attrs.pop("agreement_accepted", False):
            raise serializers.ValidationError({
                "agreement_accepted": "You must accept the repayment funding agreement."
            })
        return attrs

    def create(self, validated_data):
        repayment = validated_data["repayment"]
        return RepaymentTransfer.objects.create(
            **validated_data,
            submitted_by=self.context["request"].user,
            amount=repayment.amount,
            currency="USD",
            agreement_version="repayment-funding-v1",
            agreement_accepted_at=timezone.now(),
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request and not (request.user.is_staff or request.user.pk == instance.submitted_by_id):
            data.pop("source_of_funds_declaration", None)
            data.pop("review_notes", None)
        return data


class RepaymentTransferSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = RepaymentTransfer
        fields = ["id", "status", "inbound_reference", "outbound_reference", "review_notes", "reviewed_at"]


class RepaymentSerializer(serializers.ModelSerializer):
    investor_name = serializers.CharField(source="investment.investor.full_name", read_only=True)
    project_id = serializers.UUIDField(source="investment.project_id", read_only=True)
    project_title = serializers.CharField(source="investment.project.title", read_only=True)
    status = serializers.ChoiceField(
        choices=Repayment.Status.choices,
        read_only=True,
        help_text="Repayment status is server-controlled.",
    )
    actual_payment_date = serializers.DateField(
        read_only=True,
        help_text="Payment date is set by an authorized server-controlled workflow.",
    )
    transaction_id = serializers.CharField(
        read_only=True,
        help_text="Transaction id is set by an authorized server-controlled workflow.",
    )
    funding_transfer = RepaymentTransferSummarySerializer(read_only=True)

    class Meta:
        model = Repayment
        fields = [
            "id", "investment", "investor_name", "project_id", "project_title",
            "amount", "recipient", "scheduled_date", "actual_payment_date", "status",
            "payment_method", "transaction_id", "notes", "created_at", "updated_at",
            "funding_transfer",
        ]
        read_only_fields = [
            "id", "investment", "amount", "scheduled_date", "status",
            "actual_payment_date", "payment_method", "transaction_id", "notes",
            "created_at", "updated_at",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        is_project_owner = (
            request and request.user.is_authenticated
            and instance.investment.project.entrepreneur_id == request.user.pk
        )
        if data.get("funding_transfer") and not (request and request.user.is_staff) and not is_project_owner:
            data["funding_transfer"].pop("review_notes", None)
            data["funding_transfer"].pop("reviewed_at", None)
        return data


class RepaymentPlanInstallmentSerializer(serializers.ModelSerializer):
    recipient = serializers.ChoiceField(
        choices=Repayment.Recipient.choices,
        default=Repayment.Recipient.INVESTOR,
    )

    class Meta:
        model = Repayment
        fields = ["id", "amount", "recipient", "scheduled_date", "payment_method", "notes", "status"]
        read_only_fields = ["id", "status"]


class RepaymentPlanSerializer(serializers.ModelSerializer):
    installments = RepaymentPlanInstallmentSerializer(many=True)
    investor_id = serializers.UUIDField(source="investment.investor_id", read_only=True)
    investor_name = serializers.CharField(source="investment.investor.full_name", read_only=True)
    project_id = serializers.UUIDField(source="investment.project_id", read_only=True)
    project_title = serializers.CharField(source="investment.project.title", read_only=True)
    principal = serializers.DecimalField(source="investment.amount", max_digits=12, decimal_places=2, read_only=True)
    expected_return = serializers.DecimalField(source="investment.expected_return", max_digits=12, decimal_places=2, read_only=True)
    obligation_total = serializers.SerializerMethodField()
    platform_fee = serializers.SerializerMethodField()
    total_with_platform_fee = serializers.SerializerMethodField()
    reviewed_by_name = serializers.CharField(source="reviewed_by.full_name", read_only=True)

    class Meta:
        model = RepaymentPlan
        fields = [
            "id", "investment", "investor_id", "investor_name", "project_id",
            "project_title", "principal", "expected_return", "obligation_total",
            "platform_fee", "total_with_platform_fee",
            "status", "notes", "review_notes", "submitted_by", "submitted_at",
            "reviewed_by", "reviewed_by_name", "reviewed_at", "installments",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "status", "review_notes", "submitted_by", "submitted_at",
            "reviewed_by", "reviewed_at", "created_at", "updated_at",
        ]

    def get_obligation_total(self, obj):
        return f"{obj.investment.amount + obj.investment.expected_return:.2f}"

    def get_platform_fee(self, obj):
        fee = (obj.investment.amount * SAHMI_PLATFORM_FEE_RATE).quantize(Decimal("0.01"))
        return f"{fee:.2f}"

    def get_total_with_platform_fee(self, obj):
        fee = (obj.investment.amount * SAHMI_PLATFORM_FEE_RATE).quantize(Decimal("0.01"))
        return f"{obj.investment.amount + obj.investment.expected_return + fee:.2f}"

    def validate(self, attrs):
        request = self.context["request"]
        if request.user.is_staff or request.user.user_type != "entrepreneur":
            raise serializers.ValidationError(
                "Only the project entrepreneur can submit a repayment plan."
            )
        investment = attrs.get("investment", getattr(self.instance, "investment", None))
        if not investment or investment.project.entrepreneur_id != request.user.id:
            raise serializers.ValidationError({
                "investment": "Choose an investment belonging to one of your projects."
            })
        if self.instance and self.instance.status not in {
            RepaymentPlan.Status.REVISION_REQUIRED,
            RepaymentPlan.Status.REJECTED,
        }:
            raise serializers.ValidationError({
                "status": "Only a plan returned for correction or rejected can be resubmitted."
            })
        if self.instance and investment.pk != self.instance.investment_id:
            raise serializers.ValidationError({
                "investment": "A repayment plan cannot be moved to another investor account."
            })
        installments = attrs.get("installments", [])
        investor_installments = [
            item for item in installments
            if item.get("recipient", Repayment.Recipient.INVESTOR) == Repayment.Recipient.INVESTOR
        ]
        platform_installments = [
            item for item in installments
            if item.get("recipient") == Repayment.Recipient.PLATFORM
        ]
        if not investor_installments:
            raise serializers.ValidationError({"installments": "Add at least one investor repayment."})
        if len(platform_installments) != 1:
            raise serializers.ValidationError({
                "installments": "Add exactly one dated Sahmi platform repayment."
            })
        recipient_dates = [
            (item.get("recipient", Repayment.Recipient.INVESTOR), item["scheduled_date"])
            for item in installments
        ]
        if len(recipient_dates) != len(set(recipient_dates)):
            raise serializers.ValidationError({
                "installments": "Each repayment for the same recipient must have a different date."
            })
        from .admin_serializers import validate_repayment_eligibility
        for item in installments:
            validate_repayment_eligibility(investment, item["scheduled_date"])
        proposed = sum((item["amount"] for item in investor_installments), Decimal("0.00"))
        obligation = investment.amount + investment.expected_return
        if proposed != obligation:
            raise serializers.ValidationError({
                "installments": (
                    f"The repayments must total exactly {obligation:.2f} for this investor; "
                    f"the submitted total is {proposed:.2f}."
                )
            })
        required_platform_fee = (
            investment.amount * SAHMI_PLATFORM_FEE_RATE
        ).quantize(Decimal("0.01"))
        if platform_installments[0]["amount"] != required_platform_fee:
            raise serializers.ValidationError({
                "installments": (
                    f"The Sahmi platform repayment must be exactly {required_platform_fee:.2f} "
                    "(3% of this investment)."
                )
            })
        attrs["notes"] = str(attrs.get("notes", "")).strip()
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        installments = validated_data.pop("installments")
        plan = RepaymentPlan.objects.create(
            **validated_data,
            submitted_by=self.context["request"].user,
            status=RepaymentPlan.Status.SUBMITTED,
        )
        Repayment.objects.bulk_create([
            Repayment(investment=plan.investment, plan=plan, **item)
            for item in installments
        ])
        return plan

    @transaction.atomic
    def update(self, instance, validated_data):
        installments = validated_data.pop("installments")
        if instance.installments.filter(funding_transfer__isnull=False).exists():
            raise serializers.ValidationError({
                "installments": "A funded repayment plan can no longer be replaced."
            })
        instance.installments.all().delete()
        instance.notes = validated_data.get("notes", instance.notes)
        instance.status = RepaymentPlan.Status.SUBMITTED
        instance.review_notes = ""
        instance.reviewed_by = None
        instance.reviewed_at = None
        instance.submitted_at = timezone.now()
        instance.save(update_fields=[
            "notes", "status", "review_notes", "reviewed_by", "reviewed_at",
            "submitted_at", "updated_at",
        ])
        Repayment.objects.bulk_create([
            Repayment(investment=instance.investment, plan=instance, **item)
            for item in installments
        ])
        return instance


class WithdrawalRequestSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(read_only=True)
    requested_by = serializers.StringRelatedField(read_only=True)
    reviewed_by = serializers.StringRelatedField(read_only=True)
    released_by = serializers.StringRelatedField(read_only=True)
    milestone_title = serializers.CharField(source="milestone.title", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)
    project_status = serializers.CharField(source="project.status", read_only=True)
    status = serializers.ChoiceField(choices=WithdrawalRequest.Status.choices, read_only=True)

    class Meta:
        model = WithdrawalRequest
        fields = [
            "id", "project", "project_title", "project_status", "milestone", "milestone_title", "requested_by",
            "amount", "evidence_description", "planned_expenses", "evidence_file", "status",
            "review_notes", "reviewed_by", "reviewed_at", "released_by", "released_at",
            "payout_reference", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "project", "requested_by", "status", "review_notes", "reviewed_by", "reviewed_at",
            "released_by", "released_at", "payout_reference", "created_at", "updated_at",
        ]

    def validate_evidence_file(self, value):
        if not value:
            return value
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Evidence files may not exceed 10 MB.")
        extension = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        if extension not in {"pdf", "png", "jpg", "jpeg", "webp"}:
            raise serializers.ValidationError("Evidence must be a PDF or image file.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context["request"]
        milestone = attrs.get("milestone")
        if not milestone:
            return attrs
        project = milestone.project
        if project.entrepreneur_id != request.user.id:
            raise serializers.ValidationError({"milestone": "You can only request funds for your own project."})
        if project.status != Project.Status.IMPLEMENTATION:
            raise serializers.ValidationError({"milestone": "Funding must be finalized before requesting a release."})
        if milestone.status == Milestone.Status.COMPLETED:
            raise serializers.ValidationError({"milestone": "This milestone is already complete."})
        earlier = project.milestones.filter(order__lt=milestone.order)
        if earlier.exclude(status=Milestone.Status.COMPLETED).exists():
            raise serializers.ValidationError({"milestone": "Complete earlier milestones before requesting this release."})
        allocation = (project.funded_amount * milestone.percentage_of_project / 100).quantize(Decimal("0.01"))
        amount = attrs.get("amount", Decimal("0"))
        if amount <= 0:
            raise serializers.ValidationError({"amount": "Amount must be greater than zero."})
        remaining_allocation = max(allocation - milestone.funding_released, Decimal("0"))
        if amount > remaining_allocation:
            raise serializers.ValidationError({"amount": f"This milestone has {remaining_allocation} remaining in its allocation."})
        account = ProjectFundingAccount.objects.filter(project=project).first()
        available = account.available if account else Decimal("0")
        if amount > available:
            raise serializers.ValidationError({"amount": f"Only {available} remains available."})
        if len(attrs.get("evidence_description", "").strip()) < 10:
            raise serializers.ValidationError({"evidence_description": "Describe the milestone evidence in at least 10 characters."})
        if len(attrs.get("planned_expenses", "").strip()) < 10:
            raise serializers.ValidationError({"planned_expenses": "Describe the planned expenses in at least 10 characters."})
        return attrs


# Must import Project after the serializers above to avoid a circular import at
# module load (projects.serializers knows about investments indirectly).
from apps.projects.models import Project  # noqa: E402
