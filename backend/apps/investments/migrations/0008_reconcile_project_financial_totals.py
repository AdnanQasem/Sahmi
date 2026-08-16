from decimal import Decimal

from django.db import migrations
from django.db.models import Sum


def reconcile_project_financial_totals(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    Investment = apps.get_model("investments", "Investment")
    Milestone = apps.get_model("investments", "Milestone")
    ProjectFundingAccount = apps.get_model("investments", "ProjectFundingAccount")
    WithdrawalRequest = apps.get_model("investments", "WithdrawalRequest")
    funded_statuses = ["confirmed", "completed"]
    zero = Decimal("0.00")

    for project in Project.objects.all().iterator():
        investments = Investment.objects.filter(
            project_id=project.pk,
            status__in=funded_statuses,
        )
        funded = investments.aggregate(total=Sum("amount"))["total"] or zero
        investor_count = investments.values("investor_id").distinct().count()
        next_status = project.status
        if project.status == "fundraising" and funded >= project.goal_amount:
            next_status = "fully_funded"
        elif project.status == "fully_funded" and not project.funding_finalized_at and funded < project.goal_amount:
            next_status = "fundraising"
        Project.objects.filter(pk=project.pk).update(
            funded_amount=funded,
            investor_count=investor_count,
            status=next_status,
        )

        for milestone in Milestone.objects.filter(project_id=project.pk).iterator():
            released = WithdrawalRequest.objects.filter(
                milestone_id=milestone.pk,
                status="released",
            ).aggregate(total=Sum("amount"))["total"] or zero
            Milestone.objects.filter(pk=milestone.pk).update(funding_released=released)

        account = ProjectFundingAccount.objects.filter(project_id=project.pk).first()
        if account:
            released = WithdrawalRequest.objects.filter(
                project_id=project.pk,
                status="released",
            ).aggregate(total=Sum("amount"))["total"] or zero
            available = max(funded - released - account.refunded, zero)
            ProjectFundingAccount.objects.filter(pk=account.pk).update(
                secured=available,
                released=released,
            )


class Migration(migrations.Migration):
    dependencies = [
        ("investments", "0007_reconcile_funding_ledgers"),
    ]

    operations = [
        migrations.RunPython(reconcile_project_financial_totals, migrations.RunPython.noop),
    ]
