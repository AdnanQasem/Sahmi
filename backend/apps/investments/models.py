from decimal import Decimal
from pathlib import Path
from uuid import uuid4

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.core.models import UUIDTimestampModel
from apps.projects.models import Project


class Investment(UUIDTimestampModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        CANCELED = "cancelled", "Cancelled"
        REFUNDED = "refunded", "Refunded"

    class PaymentMethod(models.TextChoices):
        CARD = "card", "Card"
        BANK_TRANSFER = "bank_transfer", "Bank transfer"
        PAYPAL = "paypal", "PayPal"

    investor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="investments")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="investments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    investment_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    pending_expires_at = models.DateTimeField(blank=True, null=True)
    transaction_id = models.CharField(max_length=120, blank=True)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.BANK_TRANSFER)
    expected_return = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    actual_return = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    return_received_at = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-investment_date"]
        indexes = [
            models.Index(fields=["investor", "status", "investment_date"]),
            models.Index(fields=["project", "status"]),
        ]

    def save(self, *args, **kwargs):
        if self.investor_id and self.investor.user_type != "investor":
            raise ValidationError(
                {"investor": "Only investor accounts can own investments."}
            )
        if self.status == self.Status.PENDING and not self.pending_expires_at:
            self.pending_expires_at = timezone.now() + timezone.timedelta(hours=24)
        if self.project_id and self.amount and not self.expected_return:
            roi = Decimal(str(self.project.expected_roi or 0))
            self.expected_return = self.amount * (roi / Decimal("100"))
        super().save(*args, **kwargs)


class ProjectFundingAccount(UUIDTimestampModel):
    """Server-owned ledger totals for project funds; never client editable."""

    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name="funding_account",
    )
    secured = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    released = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    refunded = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    @property
    def available(self):
        return self.secured

    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(secured__gte=0), name="funding_account_secured_nonnegative"),
            models.CheckConstraint(condition=models.Q(released__gte=0), name="funding_account_released_nonnegative"),
            models.CheckConstraint(condition=models.Q(refunded__gte=0), name="funding_account_refunded_nonnegative"),
        ]


class WithdrawalRequest(UUIDTimestampModel):
    class Status(models.TextChoices):
        REQUESTED = "requested", "Requested"
        UNDER_REVIEW = "under_review", "Under Review"
        APPROVED = "approved", "Approved"
        RELEASED = "released", "Released"
        REJECTED = "rejected", "Rejected"
        REVISION_REQUIRED = "revision_required", "Revision Required"
        CANCELLED = "cancelled", "Cancelled"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="withdrawal_requests")
    milestone = models.ForeignKey("Milestone", on_delete=models.PROTECT, related_name="withdrawal_requests")
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="withdrawal_requests")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    evidence_description = models.TextField()
    planned_expenses = models.TextField()
    evidence_file = models.FileField(upload_to="withdrawal-evidence/%Y/%m/", blank=True, null=True)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.REQUESTED)
    review_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="reviewed_withdrawals")
    reviewed_at = models.DateTimeField(blank=True, null=True)
    released_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="released_withdrawals")
    released_at = models.DateTimeField(blank=True, null=True)
    payout_reference = models.CharField(max_length=120, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["project", "status", "created_at"])]
        constraints = [
            models.UniqueConstraint(
                fields=["milestone"],
                condition=models.Q(status__in=["requested", "under_review", "approved"]),
                name="one_open_withdrawal_per_milestone",
            ),
            models.CheckConstraint(condition=models.Q(amount__gt=0), name="withdrawal_amount_positive"),
        ]


class Milestone(UUIDTimestampModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"
        DELAYED = "delayed", "Delayed"

    class CompletionStatus(models.TextChoices):
        NOT_SUBMITTED = "not_submitted", "Not Submitted"
        SUBMITTED = "submitted", "Submitted"
        UNDER_REVIEW = "under_review", "Under Review"
        REVISION_REQUIRED = "revision_required", "Revision Required"
        REJECTED = "rejected", "Rejected"
        APPROVED = "approved", "Approved"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="milestones")
    title = models.CharField(max_length=120)
    description = models.TextField()
    target_date = models.DateField()
    actual_completion_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    deliverables = models.TextField(blank=True)
    percentage_of_project = models.DecimalField(max_digits=5, decimal_places=2)
    funding_released = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    order = models.PositiveIntegerField(default=0)
    completion_status = models.CharField(
        max_length=24,
        choices=CompletionStatus.choices,
        default=CompletionStatus.NOT_SUBMITTED,
    )
    completion_summary = models.TextField(blank=True)
    completion_evidence = models.FileField(
        upload_to="milestone-completion-evidence/%Y/%m/",
        blank=True,
        null=True,
    )
    completion_submitted_at = models.DateTimeField(blank=True, null=True)
    completion_review_notes = models.TextField(blank=True)
    completion_reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="reviewed_milestone_completions",
    )
    completion_reviewed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["project", "order"]
        indexes = [models.Index(fields=["project", "status"])]

    def save(self, *args, **kwargs):
        if self.status == self.Status.IN_PROGRESS and self.project_id:
            funding = Project.objects.filter(pk=self.project_id).values(
                "funded_amount", "goal_amount"
            ).first()
            if funding and funding["funded_amount"] < funding["goal_amount"]:
                raise ValidationError({
                    "status": (
                        "A milestone cannot be in progress until the project "
                        "is completely funded."
                    )
                })
        super().save(*args, **kwargs)


class Repayment(UUIDTimestampModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        DUE = "due", "Due"
        PAID = "paid", "Paid"
        OVERDUE = "overdue", "Overdue"
        CANCELLED = "cancelled", "Cancelled"

    investment = models.ForeignKey(Investment, on_delete=models.CASCADE, related_name="repayments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    scheduled_date = models.DateField()
    actual_payment_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField(max_length=20, choices=Investment.PaymentMethod.choices, default=Investment.PaymentMethod.BANK_TRANSFER)
    transaction_id = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["scheduled_date"]
        indexes = [models.Index(fields=["investment", "scheduled_date", "status"])]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=0),
                name="repayment_amount_positive",
            ),
            models.UniqueConstraint(
                fields=["investment", "scheduled_date"],
                name="unique_repayment_installment_date",
            ),
            models.UniqueConstraint(
                fields=["transaction_id"],
                condition=~models.Q(transaction_id=""),
                name="unique_repayment_transaction_id",
            ),
        ]


def repayment_receipt_upload_path(instance, filename):
    extension = Path(filename).suffix.lower()
    return f"repayment-receipts/{instance.repayment_id}/{uuid4().hex}{extension}"


class RepaymentTransfer(UUIDTimestampModel):
    """Evidence and reconciliation state for both legs of a repayment.

    The inbound leg is the entrepreneur's deposit into the designated
    safeguarded account. The outbound leg is the payout from that account to
    the investor. A repayment is not paid until the outbound leg is recorded.
    """

    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        UNDER_REVIEW = "under_review", "Under review"
        VERIFIED = "verified", "Inbound transfer verified"
        REJECTED = "rejected", "Rejected"
        DISBURSED = "disbursed", "Disbursed to investor"

    repayment = models.OneToOneField(
        Repayment,
        on_delete=models.PROTECT,
        related_name="funding_transfer",
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="submitted_repayment_transfers",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    inbound_reference = models.CharField(max_length=120, unique=True)
    inbound_transfer_date = models.DateField()
    receipt = models.FileField(upload_to=repayment_receipt_upload_path)
    source_of_funds_declaration = models.TextField()
    agreement_version = models.CharField(max_length=40, default="repayment-funding-v1")
    agreement_accepted_at = models.DateTimeField()
    status = models.CharField(
        max_length=24,
        choices=Status.choices,
        default=Status.SUBMITTED,
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="reviewed_repayment_transfers",
    )
    reviewed_at = models.DateTimeField(blank=True, null=True)
    review_notes = models.TextField(blank=True)
    outbound_reference = models.CharField(max_length=120, blank=True, unique=True, null=True)
    disbursed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="disbursed_repayment_transfers",
    )
    disbursed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["submitted_by", "created_at"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=0),
                name="repayment_transfer_amount_positive",
            ),
        ]
