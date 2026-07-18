from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.projects.models import Project, ProjectCategory

from .models import Investment


class InvestmentConfirmationSignalTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.entrepreneur = User.objects.create_user(
            email="owner@example.com",
            username="owner",
            full_name="Project Owner",
            password="password",
            user_type=User.UserType.ENTREPRENEUR,
        )
        self.investor = User.objects.create_user(
            email="investor@example.com",
            username="investor",
            full_name="Test Investor",
            password="password",
        )
        self.category = ProjectCategory.objects.create(name="Agriculture", slug="agriculture")
        self.project = Project.objects.create(
            entrepreneur=self.entrepreneur,
            title="Green Farm",
            slug="green-farm",
            description="A verified farming project.",
            short_description="Farming project",
            category=self.category,
            location="Hebron",
            goal_amount=Decimal("1000.00"),
            minimum_investment=Decimal("100.00"),
            expected_roi=Decimal("10.00"),
        )

    def test_confirming_investment_syncs_project_totals_and_publishes_event(self):
        investment = Investment.objects.create(
            investor=self.investor,
            project=self.project,
            amount=Decimal("250.00"),
        )

        with patch("apps.investments.signals.publish_investment_confirmed_event") as publish_event:
            with self.captureOnCommitCallbacks(execute=True):
                investment.status = Investment.Status.CONFIRMED
                investment.save()

        self.project.refresh_from_db()
        self.assertEqual(self.project.funded_amount, Decimal("250.00"))
        self.assertEqual(self.project.investor_count, 1)
        publish_event.assert_called_once_with(investment.pk)
