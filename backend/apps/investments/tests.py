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

class InvestmentSecurityAndTotalsTests(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient
        User = get_user_model()
        self.owner = User.objects.create_user(username="totals-owner", email="totals-owner@example.com", full_name="Owner", password="password", user_type=User.UserType.ENTREPRENEUR)
        self.investor = User.objects.create_user(username="totals-investor", email="totals-investor@example.com", full_name="Investor", password="password")
        self.staff = User.objects.create_user(username="totals-staff", email="totals-staff@example.com", full_name="Staff", password="password", is_staff=True)
        self.category = ProjectCategory.objects.create(name="Totals", slug="totals")
        project_args = dict(entrepreneur=self.owner, description="d", short_description="s", category=self.category, location="Hebron", goal_amount=Decimal("1000"), minimum_investment=Decimal("10"), expected_roi=Decimal("10"), is_verified=True, status=Project.Status.ACTIVE)
        self.first = Project.objects.create(title="First", slug="totals-first", **project_args)
        self.second = Project.objects.create(title="Second", slug="totals-second", **project_args)
        self.investment = Investment.objects.create(investor=self.investor, project=self.first, amount=Decimal("100"), status=Investment.Status.CONFIRMED)
        self.client = APIClient()

    def test_update_reassignment_and_deletion_recalculate_all_totals(self):
        with self.captureOnCommitCallbacks(execute=True):
            self.investment.amount = Decimal("175")
            self.investment.save()
        self.first.refresh_from_db()
        self.assertEqual(self.first.funded_amount, Decimal("175"))

        with self.captureOnCommitCallbacks(execute=True):
            self.investment.project = self.second
            self.investment.save()
        self.first.refresh_from_db()
        self.second.refresh_from_db()
        self.assertEqual(self.first.funded_amount, Decimal("0"))
        self.assertEqual(self.second.funded_amount, Decimal("175"))

        with self.captureOnCommitCallbacks(execute=True):
            self.investment.delete()
        self.second.refresh_from_db()
        self.assertEqual(self.second.funded_amount, Decimal("0"))
        self.assertEqual(self.second.investor_count, 0)

    def test_status_and_project_assignment_are_authorized(self):
        from rest_framework import status
        self.client.force_authenticate(self.investor)
        response = self.client.patch(f"/api/v1/investments/{self.investment.id}/", {"status": Investment.Status.CANCELED, "project": str(self.second.id)}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.investment.refresh_from_db()
        self.assertEqual(self.investment.status, Investment.Status.CONFIRMED)
        self.assertEqual(self.investment.project_id, self.first.id)
        self.assertEqual(self.client.post(f"/api/v1/investments/{self.investment.id}/confirm/").status_code, status.HTTP_403_FORBIDDEN)