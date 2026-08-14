from rest_framework import serializers

from apps.projects.serializers import ProjectListSerializer

from .models import Investment, Milestone, Repayment


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
            "expected_return", "actual_return", "return_received_at", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "investor", "investment_date", "status", "expected_return",
            "actual_return", "return_received_at", "created_at", "updated_at",
        ]

    def validate(self, attrs):
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
            "created_at", "updated_at",
        ]


class RepaymentSerializer(serializers.ModelSerializer):
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

    class Meta:
        model = Repayment
        fields = "__all__"
        read_only_fields = [
            "id", "status", "actual_payment_date", "transaction_id",
            "created_at", "updated_at",
        ]


# Must import Project after the serializers above to avoid a circular import at
# module load (projects.serializers knows about investments indirectly).
from apps.projects.models import Project  # noqa: E402
