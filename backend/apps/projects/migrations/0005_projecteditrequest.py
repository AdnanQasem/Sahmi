import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
import apps.projects.models
import apps.projects.validators
import uuid


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("projects", "0004_alter_project_business_plan_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProjectEditRequest",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("payload", models.JSONField(default=dict)),
                ("cover_image", models.ImageField(blank=True, null=True, upload_to="project-edit-images/")),
                ("business_plan", models.FileField(blank=True, null=True, upload_to=apps.projects.models.project_document_upload_path, validators=[apps.projects.validators.validate_project_pdf])),
                ("financial_projections", models.FileField(blank=True, null=True, upload_to=apps.projects.models.project_document_upload_path, validators=[apps.projects.validators.validate_project_pdf])),
                ("ownership_proof", models.FileField(blank=True, null=True, upload_to=apps.projects.models.project_document_upload_path, validators=[apps.projects.validators.validate_project_pdf])),
                ("status", models.CharField(choices=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")], default="pending", max_length=20)),
                ("review_notes", models.TextField(blank=True)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="edit_requests", to="projects.project")),
                ("reviewed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reviewed_project_edits", to=settings.AUTH_USER_MODEL)),
                ("submitted_by", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="project_edit_requests", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddConstraint(
            model_name="projecteditrequest",
            constraint=models.UniqueConstraint(condition=models.Q(("status", "pending")), fields=("project",), name="one_pending_edit_per_project"),
        ),
    ]
