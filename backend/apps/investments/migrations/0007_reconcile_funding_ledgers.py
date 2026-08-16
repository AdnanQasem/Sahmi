from decimal import Decimal

from django.db import migrations
from django.db.models import Sum


def reconcile_funding_ledgers(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    Milestone = apps.get_model("investments", "Milestone")
    ProjectFundingAccount = apps.get_model("investments", "ProjectFundingAccount")
    WithdrawalRequest = apps.get_model("investments", "WithdrawalRequest")

    released_status = "released"
    zero = Decimal("0.00")

    for milestone in Milestone.objects.all().iterator():
        released = (
            WithdrawalRequest.objects.filter(
                milestone_id=milestone.pk,
                status=released_status,
            ).aggregate(total=Sum("amount"))["total"]
            or zero
        )
        if milestone.funding_released != released:
            Milestone.objects.filter(pk=milestone.pk).update(funding_released=released)

    for account in ProjectFundingAccount.objects.all().iterator():
        project = Project.objects.get(pk=account.project_id)
        released = (
            WithdrawalRequest.objects.filter(
                project_id=project.pk,
                status=released_status,
            ).aggregate(total=Sum("amount"))["total"]
            or zero
        )
        available = max(project.funded_amount - released - account.refunded, zero)
        ProjectFundingAccount.objects.filter(pk=account.pk).update(
            secured=available,
            released=released,
        )


class Migration(migrations.Migration):
    dependencies = [
        ("investments", "0006_milestone_completion_evidence_and_more"),
        ("projects", "0010_project_completion_quality_hold"),
    ]

    operations = [
        migrations.RunPython(reconcile_funding_ledgers, migrations.RunPython.noop),
    ]
