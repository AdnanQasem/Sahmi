from django.db import migrations, models


def normalize_cancelled_status(apps, schema_editor):
    Repayment = apps.get_model("investments", "Repayment")
    Repayment.objects.filter(status__in=["canceled", "cancelled"]).update(
        status="cancelled"
    )


class Migration(migrations.Migration):
    dependencies = [("investments", "0011_normalize_payout_references")]

    operations = [
        migrations.RunPython(normalize_cancelled_status, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="repayment",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("due", "Due"),
                    ("paid", "Paid"),
                    ("overdue", "Overdue"),
                    ("cancelled", "Cancelled"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AddConstraint(
            model_name="repayment",
            constraint=models.CheckConstraint(
                condition=models.Q(("amount__gt", 0)),
                name="repayment_amount_positive",
            ),
        ),
        migrations.AddConstraint(
            model_name="repayment",
            constraint=models.UniqueConstraint(
                fields=("investment", "scheduled_date"),
                name="unique_repayment_installment_date",
            ),
        ),
        migrations.AddConstraint(
            model_name="repayment",
            constraint=models.UniqueConstraint(
                condition=models.Q(("transaction_id", ""), _negated=True),
                fields=("transaction_id",),
                name="unique_repayment_transaction_id",
            ),
        ),
    ]
