from django.db import migrations


def normalize_payout_references(apps, schema_editor):
    WithdrawalRequest = apps.get_model("investments", "WithdrawalRequest")
    for withdrawal in WithdrawalRequest.objects.exclude(payout_reference="").iterator():
        reference = withdrawal.payout_reference
        if reference.startswith("PAY-"):
            continue
        suffix = reference.split("-", 1)[-1]
        WithdrawalRequest.objects.filter(pk=withdrawal.pk).update(
            payout_reference=f"PAY-{suffix}"
        )


class Migration(migrations.Migration):
    dependencies = [
        ("investments", "0010_align_payout_reference_column"),
    ]

    operations = [
        migrations.RunPython(normalize_payout_references, migrations.RunPython.noop),
    ]
