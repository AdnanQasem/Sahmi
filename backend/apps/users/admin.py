from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class SahmiUserAdmin(UserAdmin):
    model = User
    list_display = ("email", "full_name", "user_type", "is_active", "is_verified", "is_staff")
    list_filter = ("user_type", "is_active", "is_verified", "is_staff")
    ordering = ("email",)
    fieldsets = UserAdmin.fieldsets + (
        ("Sahmi Profile", {"fields": ("full_name", "phone_number", "user_type", "bio", "country", "city")}),
        ("Verification", {"fields": ("is_verified", "is_kyc_verified", "kyc_document", "kyc_verified_at")}),
        ("Investor", {"fields": ("investor_tier", "total_invested", "total_returned", "average_roi", "risk_preference")}),
        ("Entrepreneur", {"fields": ("business_name", "business_registration_number", "business_established_date", "business_address", "total_funded", "total_repaid", "reputation_score")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Sahmi Profile", {"fields": ("email", "full_name", "user_type")}),
    )
