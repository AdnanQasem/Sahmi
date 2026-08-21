from django.db import migrations, models


def consolidate_platform_plans(apps, schema_editor):
    RepaymentPlan = apps.get_model("investments", "RepaymentPlan")
    project_ids = RepaymentPlan.objects.filter(
        recipient="platform",
        project_id__isnull=False,
    ).values_list("project_id", flat=True).distinct()

    for project_id in project_ids.iterator():
        plans = list(RepaymentPlan.objects.filter(
            recipient="platform",
            project_id=project_id,
        ).order_by("submitted_at", "created_at"))
        if len(plans) < 2:
            continue
        keeper, duplicates = plans[0], plans[1:]
        statuses = {plan.status for plan in plans}
        for duplicate in duplicates:
            duplicate.installments.update(plan_id=keeper.id)
            duplicate.delete()
        if len(statuses) > 1:
            keeper.status = "submitted"
            keeper.review_notes = ""
            keeper.reviewed_by_id = None
            keeper.reviewed_at = None
            keeper.save(update_fields=[
                "status", "review_notes", "reviewed_by", "reviewed_at", "updated_at",
            ])


class Migration(migrations.Migration):
    dependencies = [
        ("investments", "0019_separate_platform_repayment_plans"),
    ]

    operations = [
        migrations.RunPython(consolidate_platform_plans, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="repaymentplan",
            constraint=models.UniqueConstraint(
                condition=models.Q(("recipient", "platform")),
                fields=("project",),
                name="one_platform_repayment_plan_per_project",
            ),
        ),
    ]
