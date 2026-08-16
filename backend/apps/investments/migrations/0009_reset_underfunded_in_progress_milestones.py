from django.db import migrations, models


def reset_underfunded_in_progress_milestones(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    Milestone = apps.get_model("investments", "Milestone")
    for project in Project.objects.filter(funded_amount__lt=models.F("goal_amount")).iterator():
        Milestone.objects.filter(
            project_id=project.pk,
            status="in_progress",
        ).update(status="pending")


class Migration(migrations.Migration):
    dependencies = [
        ("investments", "0008_reconcile_project_financial_totals"),
    ]

    operations = [
        migrations.RunPython(
            reset_underfunded_in_progress_milestones,
            migrations.RunPython.noop,
        ),
    ]
