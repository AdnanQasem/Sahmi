from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from pathlib import Path
from uuid import uuid4

from apps.core.models import UUIDTimestampModel
from .validators import validate_project_pdf


def project_document_upload_path(instance, filename):
    extension = Path(filename).suffix.lower()
    return f"project-documents/{instance.id}/{uuid4().hex}{extension}"


class ProjectCategory(UUIDTimestampModel):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Project(UUIDTimestampModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "fundraising", "Fundraising"
        SUCCESSFUL = "fully_funded", "Fully Funded"
        IMPLEMENTATION = "implementation", "Implementation"
        CLOSED = "completed", "Completed"
        FAILED = "failed", "Failed"
        PAUSED = "paused", "Paused"
        CANCELLED = "cancelled", "Cancelled"

    class RepaymentStatus(models.TextChoices):
        ON_TRACK = "on_track", "On track"
        DELAYED = "delayed", "Delayed"
        COMPLETED = "completed", "Completed"

    entrepreneur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="projects")
    title = models.CharField(max_length=100)
    slug = models.SlugField(max_length=140, unique=True)
    description = models.TextField()
    short_description = models.CharField(max_length=200)
    category = models.ForeignKey(ProjectCategory, on_delete=models.PROTECT, related_name="projects")
    location = models.CharField(max_length=120)
    location_governorate = models.CharField(max_length=120, blank=True)
    goal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    funded_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    funding_reached_at = models.DateTimeField(blank=True, null=True)
    pending_payment_deadline = models.DateTimeField(blank=True, null=True)
    funding_finalized_at = models.DateTimeField(blank=True, null=True)
    funding_finalized_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True,
        related_name="finalized_project_funding",
    )
    quality_hold_started_at = models.DateTimeField(blank=True, null=True)
    quality_hold_until = models.DateTimeField(blank=True, null=True)
    completion_handover_approved_at = models.DateTimeField(blank=True, null=True)
    completion_handover_approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True,
        related_name="approved_project_handovers",
    )
    completion_handover_notes = models.TextField(blank=True)
    minimum_investment = models.DecimalField(max_digits=10, decimal_places=2, default=100)
    expected_roi = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    cost_items = models.JSONField(default=list, blank=True)
    faqs = models.JSONField(default=list, blank=True)
    funding_period_days = models.PositiveIntegerField(default=30)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="verified_projects")
    verified_at = models.DateTimeField(blank=True, null=True)
    verification_notes = models.TextField(blank=True)
    business_plan = models.FileField(upload_to=project_document_upload_path, validators=[validate_project_pdf], blank=True, null=True)
    financial_projections = models.FileField(upload_to=project_document_upload_path, validators=[validate_project_pdf], blank=True, null=True)
    ownership_proof = models.FileField(upload_to=project_document_upload_path, validators=[validate_project_pdf], blank=True, null=True)
    cover_image = models.ImageField(upload_to="project-images/", blank=True, null=True)
    video_url = models.URLField(blank=True)
    ai_classified_category = models.CharField(max_length=100, blank=True)
    ai_confidence_score = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    ai_classification_at = models.DateTimeField(blank=True, null=True)
    ai_generated_summary = models.TextField(blank=True)
    milestone_count = models.PositiveIntegerField(default=0)
    repayment_status = models.CharField(max_length=20, choices=RepaymentStatus.choices, default=RepaymentStatus.ON_TRACK)
    total_repaid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    next_repayment_date = models.DateField(blank=True, null=True)
    view_count = models.PositiveIntegerField(default=0)
    investor_count = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    reviews_count = models.PositiveIntegerField(default=0)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "category", "created_at"]),
            models.Index(fields=["funded_amount"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["entrepreneur", "slug"], name="unique_project_slug_per_entrepreneur")
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class ProjectImage(UUIDTimestampModel):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="project-images/")
    alt_text = models.CharField(max_length=160, blank=True)


class ProjectDocument(UUIDTimestampModel):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="supporting_documents")
    file = models.FileField(upload_to=project_document_upload_path, validators=[validate_project_pdf])
    title = models.CharField(max_length=120)


class ProjectEditRequest(UUIDTimestampModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="edit_requests",
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_edit_requests",
    )
    payload = models.JSONField(default=dict)
    changes = models.JSONField(default=dict, blank=True)
    image_reviews = models.JSONField(default=dict, blank=True)
    cover_image = models.ImageField(upload_to="project-edit-images/", blank=True, null=True)
    business_plan = models.FileField(
        upload_to=project_document_upload_path,
        validators=[validate_project_pdf],
        blank=True,
        null=True,
    )
    financial_projections = models.FileField(
        upload_to=project_document_upload_path,
        validators=[validate_project_pdf],
        blank=True,
        null=True,
    )
    ownership_proof = models.FileField(
        upload_to=project_document_upload_path,
        validators=[validate_project_pdf],
        blank=True,
        null=True,
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    review_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="reviewed_project_edits",
        blank=True,
        null=True,
    )
    reviewed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project"],
                condition=models.Q(status="pending"),
                name="one_pending_edit_per_project",
            )
        ]
