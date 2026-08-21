from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("investments", "0017_investment_received_at"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="investment",
            name="quantity",
        ),
    ]
