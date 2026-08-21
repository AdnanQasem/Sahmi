from django.db import migrations, models
import django.db.models.deletion


def split_platform_repayment_plans(apps, schema_editor):
    RepaymentPlan = apps.get_model("investments", "RepaymentPlan")

    for plan in RepaymentPlan.objects.select_related("investment").all().iterator():
        plan.project_id = plan.investment.project_id
        plan.recipient = "investor"
        plan.save(update_fields=["project", "recipient"])

        platform_installments = plan.installments.filter(recipient="platform")
        if not platform_installments.exists():
            continue
        platform_plan = RepaymentPlan.objects.create(
            project_id=plan.project_id,
            investment=None,
            recipient="platform",
            submitted_by_id=plan.submitted_by_id,
            status=plan.status,
            notes=plan.notes,
            review_notes=plan.review_notes,
            submitted_at=plan.submitted_at,
            reviewed_by_id=plan.reviewed_by_id,
            reviewed_at=plan.reviewed_at,
        )
        platform_installments.update(plan_id=platform_plan.id)


class Migration(migrations.Migration):
    dependencies = [
        ("investments", "0018_remove_investment_quantity"),
    ]

    operations = [
        migrations.AddField(
            model_name="repaymentplan",
            name="project",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="repayment_plans",
                to="projects.project",
            ),
        ),
        migrations.AddField(
            model_name="repaymentplan",
            name="recipient",
            field=models.CharField(
                choices=[("investor", "Investor"), ("platform", "Sahmi platform")],
                default="investor",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="repaymentplan",
            name="investment",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="repayment_plan",
                to="investments.investment",
            ),
        ),
        migrations.RunPython(split_platform_repayment_plans, migrations.RunPython.noop),
    ]
