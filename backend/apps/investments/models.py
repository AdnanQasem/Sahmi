from django.conf import settings
from django.db import models

from apps.core.models import UUIDTimestampModel
from apps.projects.models import Project


class Investment(UUIDTimestampModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        CANCELED = "canceled", "Canceled"
        COMPLETED = "completed", "Completed"

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
        if self.project_id and self.amount and not self.expected_return:
            self.expected_return = self.amount * (self.project.expected_roi / 100)
        super().save(*args, **kwargs)


class Milestone(UUIDTimestampModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"
        DELAYED = "delayed", "Delayed"

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

    class Meta:
        ordering = ["project", "order"]
        indexes = [models.Index(fields=["project", "status"])]


class Repayment(UUIDTimestampModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        OVERDUE = "overdue", "Overdue"
        CANCELED = "canceled", "Canceled"

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
