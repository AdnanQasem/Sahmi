from django.db import migrations, models


def normalize_timezones(apps, schema_editor):
    User = apps.get_model("users", "User")
    replacements = {
        "Asia/Riyadh (UTC+3)": "Asia/Riyadh",
        "Asia/Dubai (UTC+4)": "Asia/Dubai",
        "Europe/London (GMT)": "Europe/London",
        "America/New_York (EST)": "America/New_York",
    }
    for old, new in replacements.items():
        User.objects.filter(timezone=old).update(timezone=new)


class Migration(migrations.Migration):
    dependencies = [("users", "0003_user_timezone_user_website")]
    operations = [
        migrations.AlterField(
            model_name="user",
            name="timezone",
            field=models.CharField(default="Asia/Hebron", max_length=64),
        ),
        migrations.RunPython(normalize_timezones, migrations.RunPython.noop),
    ]
