import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("users", "0005_user_email_verified_at")]

    operations = [
        migrations.CreateModel(
            name="PendingRegistration",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("full_name", models.CharField(max_length=150)),
                ("password", models.CharField(max_length=128)),
                ("user_type", models.CharField(choices=[("investor", "Investor"), ("entrepreneur", "Entrepreneur"), ("admin", "Admin")], max_length=20)),
                ("phone_number", models.CharField(blank=True, max_length=32)),
                ("country", models.CharField(blank=True, max_length=80)),
                ("city", models.CharField(blank=True, max_length=80)),
                ("business_name", models.CharField(blank=True, max_length=150)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
