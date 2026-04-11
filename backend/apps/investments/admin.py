from django.contrib import admin

from .models import Investment, Milestone, Repayment


@admin.register(Investment)
class InvestmentAdmin(admin.ModelAdmin):
    list_display = ("investor", "project", "amount", "status", "investment_date")
    list_filter = ("status", "payment_method")
    search_fields = ("investor__email", "project__title", "transaction_id")


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ("project", "title", "status", "target_date", "order")
    list_filter = ("status",)


@admin.register(Repayment)
class RepaymentAdmin(admin.ModelAdmin):
    list_display = ("investment", "amount", "scheduled_date", "status")
    list_filter = ("status", "payment_method")
