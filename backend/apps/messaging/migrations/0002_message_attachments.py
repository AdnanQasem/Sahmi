import django.core.validators
from django.db import migrations, models

import apps.messaging.models


class Migration(migrations.Migration):
    dependencies = [("messaging", "0001_messaging_notifications_security")]

    operations = [
        migrations.AlterField(
            model_name="message",
            name="body",
            field=models.TextField(blank=True, help_text="Plain-text only. Never rendered as HTML.", validators=[django.core.validators.MaxLengthValidator(5000)]),
        ),
        migrations.AddField(
            model_name="message",
            name="attachment",
            field=models.FileField(blank=True, null=True, upload_to=apps.messaging.models.message_attachment_upload_path),
        ),
        migrations.AddField(
            model_name="message",
            name="attachment_content_type",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="message",
            name="attachment_name",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="message",
            name="attachment_size",
            field=models.PositiveBigIntegerField(default=0),
        ),
    ]
