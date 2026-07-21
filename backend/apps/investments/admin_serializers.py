from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.projects.models import Project

from .models import Investment, Milestone, Repayment


User = get_user_model()


class AdminInvestmentUserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "user_type"]


class AdminInvestmentProjectSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "title", "slug", "status", "is_verified"]


class AdminInvestmentSerializer(serializers.ModelSerializer):
    investor_detail = AdminInvestmentUserSummarySerializer(
        source="investor",
        read_only=True,
    )
    project_detail = AdminInvestmentProjectSummarySerializer(
        source="project",
        read_only=True,
    )

    class Meta:
        model = Investment
        fields = [
            "id",
            "investor",
            "investor_detail",
            "project",
            "project_detail",
            "amount",
            "quantity",
            "investment_date",
            "status",
            "transaction_id",
            "payment_method",
            "expected_return",
            "actual_return",
            "return_received_at",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "investor_detail",
            "project_detail",
            "investment_date",
            "created_at",
            "updated_at",
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value


class AdminMilestoneSerializer(serializers.ModelSerializer):
    project_detail = AdminInvestmentProjectSummarySerializer(
        source="project",
        read_only=True,
    )

    class Meta:
        model = Milestone
        fields = [
            "id",
            "project",
            "project_detail",
            "title",
            "description",
            "target_date",
            "actual_completion_date",
            "status",
            "deliverables",
            "percentage_of_project",
            "funding_released",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "project_detail", "created_at", "updated_at"]


class AdminRepaymentSerializer(serializers.ModelSerializer):
    investor_detail = AdminInvestmentUserSummarySerializer(
        source="investment.investor",
        read_only=True,
    )
    project_detail = AdminInvestmentProjectSummarySerializer(
        source="investment.project",
        read_only=True,
    )

    class Meta:
        model = Repayment
        fields = [
            "id",
            "investment",
            "investor_detail",
            "project_detail",
            "amount",
            "scheduled_date",
            "actual_payment_date",
            "status",
            "payment_method",
            "transaction_id",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "investor_detail",
            "project_detail",
            "created_at",
            "updated_at",
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value
