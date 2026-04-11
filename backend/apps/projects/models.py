from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from apps.core.models import UUIDTimestampModel


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
        ACTIVE = "active", "Active"
        CLOSED = "closed", "Closed"
        SUCCESSFUL = "successful", "Successful"
        FAILED = "failed", "Failed"
        PAUSED = "paused", "Paused"

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
    minimum_investment = models.DecimalField(max_digits=10, decimal_places=2, default=100)
    expected_roi = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    funding_period_days = models.PositiveIntegerField(default=30)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="verified_projects")
    verified_at = models.DateTimeField(blank=True, null=True)
    verification_notes = models.TextField(blank=True)
    business_plan = models.FileField(upload_to="project-documents/", blank=True, null=True)
    financial_projections = models.FileField(upload_to="project-documents/", blank=True, null=True)
    ownership_proof = models.FileField(upload_to="project-documents/", blank=True, null=True)
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
    file = models.FileField(upload_to="project-documents/")
    title = models.CharField(max_length=120)
