import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class UserType(models.TextChoices):
        INVESTOR = "investor", "Investor"
        ENTREPRENEUR = "entrepreneur", "Entrepreneur"
        ADMIN = "admin", "Admin"

    class InvestorTier(models.TextChoices):
        BRONZE = "bronze", "Bronze"
        SILVER = "silver", "Silver"
        GOLD = "gold", "Gold"
        PLATINUM = "platinum", "Platinum"

    class RiskPreference(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=32, blank=True)
    user_type = models.CharField(max_length=20, choices=UserType.choices, default=UserType.INVESTOR)
    profile_picture = models.ImageField(upload_to="profiles/", blank=True, null=True)
    bio = models.TextField(blank=True)
    country = models.CharField(max_length=80, blank=True)
    city = models.CharField(max_length=80, blank=True)
    is_verified = models.BooleanField(default=False)
    is_kyc_verified = models.BooleanField(default=False)
    kyc_document = models.FileField(upload_to="kyc/", blank=True, null=True)
    kyc_verified_at = models.DateTimeField(blank=True, null=True)
    investor_tier = models.CharField(max_length=20, choices=InvestorTier.choices, default=InvestorTier.BRONZE)
    total_invested = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_returned = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    average_roi = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    risk_preference = models.CharField(max_length=20, choices=RiskPreference.choices, default=RiskPreference.MEDIUM)
    business_name = models.CharField(max_length=150, blank=True)
    business_registration_number = models.CharField(max_length=100, blank=True)
    business_established_date = models.DateField(blank=True, null=True)
    business_address = models.TextField(blank=True)
    total_funded = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_repaid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reputation_score = models.DecimalField(max_digits=3, decimal_places=2, default=0)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "full_name"]

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        if self.user_type == self.UserType.ADMIN:
            self.is_staff = True
        super().save(*args, **kwargs)
