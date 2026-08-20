import django.db.models.deletion
import django.utils.timezone
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("investments", "0013_repaymenttransfer"),
    ]

    operations = [
        migrations.CreateModel(
            name="RepaymentPlan",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("status", models.CharField(choices=[("submitted", "Submitted"), ("under_review", "Under review"), ("revision_required", "Revision required"), ("approved", "Approved"), ("rejected", "Rejected")], default="submitted", max_length=24)),
                ("notes", models.TextField(blank=True)),
                ("review_notes", models.TextField(blank=True)),
                ("submitted_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("investment", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="repayment_plan", to="investments.investment")),
                ("reviewed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reviewed_repayment_plans", to=settings.AUTH_USER_MODEL)),
                ("submitted_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="submitted_repayment_plans", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-submitted_at"]},
        ),
        migrations.AddIndex(
            model_name="repaymentplan",
            index=models.Index(fields=["status", "submitted_at"], name="investments_status_d199f7_idx"),
        ),
        migrations.AddField(
            model_name="repayment",
            name="plan",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="installments", to="investments.repaymentplan"),
        ),
    ]
