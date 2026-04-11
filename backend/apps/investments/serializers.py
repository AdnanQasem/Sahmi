from rest_framework import serializers

from .models import Investment, Milestone, Repayment


class InvestmentSerializer(serializers.ModelSerializer):
    investor = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Investment
        fields = [
            "id", "investor", "project", "amount", "quantity", "investment_date",
            "status", "transaction_id", "payment_method", "expected_return",
            "actual_return", "return_received_at", "notes", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "investor", "investment_date", "expected_return", "actual_return",
            "return_received_at", "created_at", "updated_at",
        ]

    def validate(self, attrs):
        project = attrs.get("project")
        amount = attrs.get("amount")
        if project and amount and amount < project.minimum_investment:
            raise serializers.ValidationError({"amount": f"Minimum investment is {project.minimum_investment}."})
        return attrs


class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class RepaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Repayment
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]
