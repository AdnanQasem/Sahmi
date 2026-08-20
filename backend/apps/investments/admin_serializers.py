from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Q, Sum
from rest_framework import serializers

from apps.projects.models import Project

from .models import Investment, Milestone, Repayment, RepaymentPlan, RepaymentTransfer


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
    obligation_total = serializers.SerializerMethodField()
    scheduled_repayment_total = serializers.SerializerMethodField()
    remaining_repayment_obligation = serializers.SerializerMethodField()

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
            "pending_expires_at",
            "transaction_id",
            "payment_method",
            "expected_return",
            "actual_return",
            "obligation_total",
            "scheduled_repayment_total",
            "remaining_repayment_obligation",
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
            "pending_expires_at",
            "created_at",
            "updated_at",
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def get_obligation_total(self, obj):
        return obj.amount + obj.expected_return

    def get_scheduled_repayment_total(self, obj):
        return obj.repayments.filter(
            Q(plan__isnull=True) | Q(plan__status=RepaymentPlan.Status.APPROVED),
            recipient=Repayment.Recipient.INVESTOR,
        ).exclude(status=Repayment.Status.CANCELLED).aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0.00")

    def get_remaining_repayment_obligation(self, obj):
        return max(
            self.get_obligation_total(obj) - self.get_scheduled_repayment_total(obj),
            Decimal("0.00"),
        )

    def validate(self, attrs):
        attrs = super().validate(attrs)
        investor = attrs.get("investor", getattr(self.instance, "investor", None))
        if investor and investor.user_type != User.UserType.INVESTOR:
            raise serializers.ValidationError(
                {"investor": "Only investor accounts can own investments."}
            )
        project = attrs.get("project", getattr(self.instance, "project", None))
        amount = attrs.get("amount", getattr(self.instance, "amount", None))
        investment_status = attrs.get("status", getattr(self.instance, "status", Investment.Status.PENDING))
        if self.instance is None and investment_status != Investment.Status.PENDING:
            raise serializers.ValidationError({"status": "Create the investment as pending, then confirm it through review."})
        if self.instance and investment_status != self.instance.status and investment_status in {
            Investment.Status.COMPLETED, Investment.Status.REFUNDED
        }:
            raise serializers.ValidationError({"status": "This status is controlled by the funding release workflow."})
        if self.instance and self.instance.status != Investment.Status.PENDING:
            immutable = {
                field for field in ("investor", "project", "amount", "quantity")
                if field in attrs and attrs[field] != getattr(self.instance, field)
            }
            if immutable:
                raise serializers.ValidationError({field: "Confirmed investment funding fields cannot be edited." for field in immutable})
        if project and amount and investment_status in {
            Investment.Status.PENDING,
            Investment.Status.CONFIRMED,
        }:
            reserved = Investment.objects.filter(
                project=project,
                status__in=[Investment.Status.PENDING, Investment.Status.CONFIRMED],
            )
            if self.instance:
                reserved = reserved.exclude(pk=self.instance.pk)
            reserved_total = reserved.aggregate(total=Sum("amount"))["total"] or 0
            remaining = project.goal_amount - reserved_total
            if amount > remaining:
                raise serializers.ValidationError(
                    {"amount": f"Exceeding value. Remaining funding is {max(remaining, 0)}."}
                )
        return attrs


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
        read_only_fields = ["id", "project_detail", "funding_released", "created_at", "updated_at"]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        requested_release = self.initial_data.get("funding_released")
        if requested_release not in (None, "", "0", "0.0", "0.00", 0):
            raise serializers.ValidationError({
                "funding_released": "Funding cannot be released here; use an approved withdrawal request."
            })
        project = attrs.get("project", getattr(self.instance, "project", None))
        milestone_status = attrs.get(
            "status",
            getattr(self.instance, "status", Milestone.Status.PENDING),
        )
        actual_completion_date = attrs.get(
            "actual_completion_date",
            getattr(self.instance, "actual_completion_date", None),
        )
        funding_released = attrs.get(
            "funding_released",
            getattr(self.instance, "funding_released", 0),
        )

        implementation_statuses = {
            Milestone.Status.IN_PROGRESS,
            Milestone.Status.COMPLETED,
            Milestone.Status.DELAYED,
        }
        if (
            project
            and milestone_status in implementation_statuses
            and project.funded_amount < project.goal_amount
        ):
            raise serializers.ValidationError({
                "status": (
                    "Implementation cannot begin until the project reaches "
                    "100% funding."
                )
            })
        if (
            project
            and funding_released > 0
            and project.funded_amount < project.goal_amount
        ):
            raise serializers.ValidationError({
                "funding_released": (
                    "Project funds cannot be released until the project reaches "
                    "100% funding."
                )
            })
        if project and milestone_status in implementation_statuses:
            order = attrs.get("order", getattr(self.instance, "order", 0))
            earlier = project.milestones.filter(order__lt=order)
            if self.instance:
                earlier = earlier.exclude(pk=self.instance.pk)
            if earlier.exclude(status=Milestone.Status.COMPLETED).exists():
                raise serializers.ValidationError({
                    "status": "Complete earlier milestones before progressing this milestone."
                })
        if milestone_status == Milestone.Status.COMPLETED and not actual_completion_date:
            raise serializers.ValidationError({
                "actual_completion_date": (
                    "Record the completion date before completing this milestone."
                )
            })
        if (
            milestone_status == Milestone.Status.COMPLETED
            and self.instance
            and self.instance.completion_status != Milestone.CompletionStatus.APPROVED
        ):
            raise serializers.ValidationError({
                "status": "The entrepreneur must submit completion evidence and an admin must approve it first."
            })
        if project and milestone_status == Milestone.Status.COMPLETED:
            allocation = (project.funded_amount * attrs.get(
                "percentage_of_project", getattr(self.instance, "percentage_of_project", 0)
            ) / 100).quantize(Decimal("0.01"))
            if funding_released < allocation:
                raise serializers.ValidationError({
                    "status": f"Release the full milestone allocation ({allocation}) before completing it."
                })
        return attrs


def validate_repayment_eligibility(investment, scheduled_date):
    project = investment.project
    if project.status != Project.Status.CLOSED:
        raise serializers.ValidationError({
            "investment": (
                "Return of Investment payments cannot be scheduled until "
                "the project is Completed."
            )
        })
    if investment.status != Investment.Status.COMPLETED:
        raise serializers.ValidationError({
            "investment": "Only completed investments can have a repayment schedule."
        })

    milestones = project.milestones.all()
    if not milestones.exists() or milestones.exclude(
        status=Milestone.Status.COMPLETED,
    ).exists():
        raise serializers.ValidationError({
            "investment": (
                "Return of Investment payments cannot be scheduled until "
                "implementation is complete and the project is operating."
            )
        })

    completion_dates = list(milestones.values_list("actual_completion_date", flat=True))
    if any(date is None for date in completion_dates):
        raise serializers.ValidationError({
            "investment": (
                "Every implementation milestone must have a completion date "
                "before Return of Investment payments can be scheduled."
            )
        })
    operations_start_date = max(completion_dates)
    if scheduled_date and scheduled_date < operations_start_date:
        raise serializers.ValidationError({
            "scheduled_date": (
                "The first Return of Investment payment cannot be scheduled "
                f"before the project became operational on {operations_start_date}."
            )
        })
    return operations_start_date


class AdminRepaymentPlanSerializer(serializers.Serializer):
    investment = serializers.PrimaryKeyRelatedField(queryset=Investment.objects.all())
    installment_count = serializers.IntegerField(min_value=1, max_value=60)
    first_scheduled_date = serializers.DateField()
    interval_months = serializers.IntegerField(min_value=1, max_value=12, default=1)
    payment_method = serializers.ChoiceField(
        choices=Investment.PaymentMethod.choices,
        default=Investment.PaymentMethod.BANK_TRANSFER,
    )
    notes = serializers.CharField(required=False, allow_blank=True, max_length=1000)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        investment = attrs["investment"]
        if hasattr(investment, "repayment_plan"):
            raise serializers.ValidationError({
                "investment": "This investment already has an entrepreneur-submitted repayment plan."
            })
        validate_repayment_eligibility(investment, attrs["first_scheduled_date"])
        scheduled_total = investment.repayments.filter(
            recipient=Repayment.Recipient.INVESTOR,
        ).exclude(
            status=Repayment.Status.CANCELLED
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        remaining = investment.amount + investment.expected_return - scheduled_total
        if remaining <= 0:
            raise serializers.ValidationError({
                "investment": "This investment's full repayment obligation is already scheduled."
            })
        attrs["remaining_obligation"] = remaining
        return attrs


class AdminRepaymentSerializer(serializers.ModelSerializer):
    investor_detail = AdminInvestmentUserSummarySerializer(
        source="investment.investor",
        read_only=True,
    )
    project_detail = AdminInvestmentProjectSummarySerializer(
        source="investment.project",
        read_only=True,
    )
    funding_transfer = serializers.SerializerMethodField()

    def get_funding_transfer(self, obj):
        try:
            transfer = obj.funding_transfer
        except RepaymentTransfer.DoesNotExist:
            return None
        return {
            "id": str(transfer.id),
            "status": transfer.status,
            "inbound_reference": transfer.inbound_reference,
            "outbound_reference": transfer.outbound_reference or "",
        }

    class Meta:
        model = Repayment
        fields = [
            "id",
            "plan",
            "investment",
            "investor_detail",
            "project_detail",
            "amount",
            "recipient",
            "scheduled_date",
            "actual_payment_date",
            "status",
            "payment_method",
            "transaction_id",
            "notes",
            "created_at",
            "updated_at",
            "funding_transfer",
        ]
        read_only_fields = [
            "id",
            "plan",
            "recipient",
            "investor_detail",
            "project_detail",
            "status",
            "actual_payment_date",
            "transaction_id",
            "created_at",
            "updated_at",
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        requested_status = self.initial_data.get("status")
        if self.instance is None and requested_status not in (None, "", Repayment.Status.PENDING):
            raise serializers.ValidationError({
                "status": "Create the schedule as Pending, then use the paid or cancelled action."
            })
        if self.instance and requested_status not in (None, "", self.instance.status):
            raise serializers.ValidationError({
                "status": "Use the paid or cancelled action to change repayment status."
            })
        if self.instance is None and (
            self.initial_data.get("actual_payment_date")
            or self.initial_data.get("transaction_id")
        ):
            raise serializers.ValidationError({
                "status": "Payment details can only be recorded when marking a repayment paid."
            })
        investment = attrs.get("investment", getattr(self.instance, "investment", None))
        amount = attrs.get("amount", getattr(self.instance, "amount", None))
        scheduled_date = attrs.get(
            "scheduled_date",
            getattr(self.instance, "scheduled_date", None),
        )
        if not investment:
            return attrs

        if self.instance is None and hasattr(investment, "repayment_plan"):
            raise serializers.ValidationError({
                "investment": "This investment already has an entrepreneur-submitted repayment plan."
            })

        validate_repayment_eligibility(investment, scheduled_date)
        if self.instance and investment.pk != self.instance.investment_id:
            raise serializers.ValidationError({
                "investment": "A repayment cannot be moved to another investment."
            })
        if self.instance and self.instance.plan_id:
            raise serializers.ValidationError({
                "status": "Installments from an approved entrepreneur plan cannot be edited directly."
            })
        if self.instance and self.instance.status in {
            Repayment.Status.PAID,
            Repayment.Status.CANCELLED,
        }:
            raise serializers.ValidationError({
                "status": "Paid and cancelled repayment records are final."
            })
        duplicate = Repayment.objects.filter(
            investment=investment,
            scheduled_date=scheduled_date,
            recipient=getattr(self.instance, "recipient", Repayment.Recipient.INVESTOR),
        )
        if self.instance:
            duplicate = duplicate.exclude(pk=self.instance.pk)
        if scheduled_date and duplicate.exists():
            raise serializers.ValidationError({
                "scheduled_date": "A repayment already exists for this investment and date."
            })
        scheduled = Repayment.objects.filter(
            investment=investment,
            recipient=Repayment.Recipient.INVESTOR,
        ).exclude(
            status=Repayment.Status.CANCELLED
        )
        if self.instance:
            scheduled = scheduled.exclude(pk=self.instance.pk)
        scheduled_total = scheduled.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        obligation_total = investment.amount + investment.expected_return
        if amount and scheduled_total + amount > obligation_total:
            raise serializers.ValidationError({
                "amount": (
                    "Scheduled repayments cannot exceed the investment obligation "
                    f"of {obligation_total}."
                )
            })
        return attrs
