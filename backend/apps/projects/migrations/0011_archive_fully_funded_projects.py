from django.db import migrations
from django.db.models import F
from django.utils import timezone


def archive_fully_funded_projects(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    archived_at = timezone.now()
    Project.objects.filter(
        funded_amount__gte=F("goal_amount"),
        deleted_at__isnull=True,
    ).update(deleted_at=archived_at, updated_at=archived_at)


class Migration(migrations.Migration):
    dependencies = [
        ("investments", "0016_repayment_recipient"),
        ("projects", "0010_project_completion_quality_hold"),
    ]

    operations = [
        migrations.RunPython(
            archive_fully_funded_projects,
            migrations.RunPython.noop,
        ),
    ]
