from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("users", "0004_normalize_user_timezones")]

    operations = [
        migrations.AddField(
            model_name="user",
            name="email_verified_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
