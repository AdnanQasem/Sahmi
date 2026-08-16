from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("notifications", "0005_alter_notification_notification_type"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notification",
            name="notification_type",
            field=models.CharField(
                choices=[
                    ("message_received", "Message received"),
                    ("project_submitted", "Project submitted"),
                    ("project_verified", "Project verified"),
                    ("project_rejected", "Project rejected"),
                    ("investment_created", "Investment created"),
                    ("investment_status_changed", "Investment status changed"),
                    ("milestone_updated", "Milestone updated"),
                    ("repayment_updated", "Repayment updated"),
                    ("funding_goal_reached", "Funding goal reached"),
                    ("withdrawal_updated", "Withdrawal updated"),
                    ("funds_released", "Funds released"),
                    ("project_completion_hold", "Project completion hold"),
                    ("system", "System"),
                ],
                default="system",
                max_length=40,
            ),
        ),
    ]
