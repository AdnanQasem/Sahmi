from django.db import migrations


def demote_application_admins(apps, schema_editor):
    User = apps.get_model("users", "User")
    User.objects.filter(user_type="admin", is_superuser=True).update(
        is_superuser=False,
        is_staff=True,
    )


class Migration(migrations.Migration):
    dependencies = [("users", "0006_pendingregistration")]

    operations = [
        migrations.RunPython(demote_application_admins, migrations.RunPython.noop),
    ]
