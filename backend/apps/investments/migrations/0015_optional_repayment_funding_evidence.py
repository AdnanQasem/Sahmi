from django.db import migrations, models

import apps.investments.models


class Migration(migrations.Migration):
    dependencies = [
        ("investments", "0014_repaymentplan"),
    ]

    operations = [
        migrations.AlterField(
            model_name="repaymenttransfer",
            name="receipt",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to=apps.investments.models.repayment_receipt_upload_path,
            ),
        ),
        migrations.AlterField(
            model_name="repaymenttransfer",
            name="source_of_funds_declaration",
            field=models.TextField(blank=True),
        ),
    ]
