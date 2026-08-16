from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from apps.projects.serializers import ProjectListSerializer

from .models import (
    Investment,
    Milestone,
    ProjectFundingAccount,
    Repayment,
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
    receipt = serializers.FileField(write_only=True)
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
        if not request.user.is_kyc_verified:
            raise serializers.ValidationError(
                "KYC verification is required before submitting repayment funding."
            )
        if repayment.investment.project.entrepreneur_id != request.user.id:
            raise serializers.ValidationError({
                "repayment": "You can only fund repayments for your own project."
            })
        if repayment.status in {Repayment.Status.PAID, Repayment.Status.CANCELLED}:
            raise serializers.ValidationError({
                "repayment": "This repayment is already final."
            })
        if hasattr(repayment, "funding_transfer"):
            raise serializers.ValidationError({
                "repayment": "A funding transfer already exists for this repayment."
            })
        if attrs["inbound_transfer_date"] > timezone.localdate():
            raise serializers.ValidationError({
                "inbound_transfer_date": "The transfer date cannot be in the future."
            })
        if len(attrs.get("source_of_funds_declaration", "").strip()) < 20:
            raise serializers.ValidationError({
                "source_of_funds_declaration": "Provide a source-of-funds declaration of at least 20 characters."
            })
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
        fields = ["id", "status", "inbound_reference", "outbound_reference"]


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
            "amount", "scheduled_date", "actual_payment_date", "status",
            "payment_method", "transaction_id", "notes", "created_at", "updated_at",
            "funding_transfer",
        ]
        read_only_fields = [
            "id", "investment", "amount", "scheduled_date", "status",
            "actual_payment_date", "payment_method", "transaction_id", "notes",
            "created_at", "updated_at",
        ]


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
