from decimal import Decimal

from django.db import migrations, models
from django.utils import timezone


def add_existing_platform_repayments(apps, schema_editor):
    Investment = apps.get_model("investments", "Investment")
    Repayment = apps.get_model("investments", "Repayment")
    Project = apps.get_model("projects", "Project")
    affected_projects = set()
    for investment in Investment.objects.filter(status="completed").iterator():
        investor_repayments = Repayment.objects.filter(
            investment_id=investment.id,
            recipient="investor",
        ).exclude(status="cancelled")
        if not investor_repayments.exists() or Repayment.objects.filter(
            investment_id=investment.id,
            recipient="platform",
        ).exists():
            continue
        last_date = investor_repayments.order_by("-scheduled_date").values_list(
            "scheduled_date", flat=True
        ).first()
        fee = (investment.amount * Decimal("0.03")).quantize(Decimal("0.01"))
        status = "overdue" if last_date < timezone.localdate() else "due" if last_date == timezone.localdate() else "pending"
        Repayment.objects.create(
            investment_id=investment.id,
            plan_id=investor_repayments.filter(plan_id__isnull=False).values_list("plan_id", flat=True).first(),
            amount=fee,
            recipient="platform",
            scheduled_date=last_date,
            status=status,
            payment_method="bank_transfer",
            notes="Fixed 3% Sahmi platform repayment.",
        )
        affected_projects.add(investment.project_id)
    Project.objects.filter(
        id__in=affected_projects,
        status="completed",
        repayment_status="completed",
    ).update(repayment_status="on_track", deleted_at=None)


class Migration(migrations.Migration):
    dependencies = [
        ("investments", "0015_optional_repayment_funding_evidence"),
    ]

    operations = [
        migrations.AddField(
            model_name="repayment",
            name="recipient",
            field=models.CharField(
                choices=[("investor", "Investor"), ("platform", "Sahmi platform")],
                default="investor",
                max_length=20,
            ),
        ),
        migrations.RemoveConstraint(
            model_name="repayment",
            name="unique_repayment_installment_date",
        ),
        migrations.AddConstraint(
            model_name="repayment",
            constraint=models.UniqueConstraint(
                fields=("investment", "scheduled_date", "recipient"),
                name="unique_repayment_recipient_installment_date",
            ),
        ),
        migrations.RunPython(add_existing_platform_repayments, migrations.RunPython.noop),
    ]
