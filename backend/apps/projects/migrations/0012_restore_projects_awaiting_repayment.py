from django.db import migrations


def restore_projects_awaiting_repayment(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    Project.objects.filter(
        deleted_at__isnull=False,
        repayment_status__in=["on_track", "delayed"],
        investments__status__in=["confirmed", "completed"],
    ).distinct().update(deleted_at=None)


class Migration(migrations.Migration):
    dependencies = [
        ("investments", "0018_remove_investment_quantity"),
        ("projects", "0011_archive_fully_funded_projects"),
    ]

    operations = [
        migrations.RunPython(
            restore_projects_awaiting_repayment,
            migrations.RunPython.noop,
        ),
    ]
