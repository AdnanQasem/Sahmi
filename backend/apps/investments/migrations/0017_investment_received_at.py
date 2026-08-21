from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("investments", "0016_repayment_recipient"),
        ("projects", "0011_archive_fully_funded_projects"),
    ]

    operations = [
        migrations.AddField(
            model_name="investment",
            name="received_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
