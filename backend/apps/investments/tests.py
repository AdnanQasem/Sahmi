from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.notifications.models import Notification
from apps.projects.models import Project, ProjectCategory

from .models import Investment, Milestone


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

    def test_admin_status_update_notifies_investor_and_project_owner(self):
        from rest_framework import status

        Investment.objects.filter(pk=self.investment.pk).update(
            status=Investment.Status.PENDING,
        )
        self.investment.refresh_from_db()
        self.client.force_authenticate(self.staff)

        with patch("apps.investments.signals.publish_investment_confirmed_event"):
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.patch(
                    f"/api/v1/admin/investments/{self.investment.id}/",
                    {"status": Investment.Status.CONFIRMED},
                    format="json",
                )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        recipients = set(
            Notification.objects.filter(
                notification_type=Notification.NotificationType.INVESTMENT_STATUS_CHANGED,
                target_id=str(self.investment.id),
            ).values_list("recipient_id", flat=True)
        )
        self.assertEqual(recipients, {self.investor.id, self.owner.id})

    def test_status_and_project_assignment_are_authorized(self):
        from rest_framework import status
        self.client.force_authenticate(self.investor)
        response = self.client.patch(f"/api/v1/investments/{self.investment.id}/", {"status": Investment.Status.CANCELED, "project": str(self.second.id)}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.investment.refresh_from_db()
        self.assertEqual(self.investment.status, Investment.Status.CONFIRMED)
        self.assertEqual(self.investment.project_id, self.first.id)
        self.assertEqual(self.client.post(f"/api/v1/investments/{self.investment.id}/confirm/").status_code, status.HTTP_403_FORBIDDEN)

    def test_contribution_cannot_exceed_remaining_funding(self):
        from rest_framework import status

        self.client.force_authenticate(self.investor)
        response = self.client.post(
            "/api/v1/investments/",
            {
                "project": str(self.first.id),
                "amount": "901.00",
                "quantity": 1,
                "payment_method": Investment.PaymentMethod.BANK_TRANSFER,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Exceeding value", str(response.data))

    def test_pending_contributions_reserve_remaining_funding(self):
        from rest_framework import status

        Investment.objects.filter(pk=self.investment.pk).update(amount=Decimal("700"))
        Investment.objects.create(
            investor=self.investor,
            project=self.first,
            amount=Decimal("250"),
            status=Investment.Status.PENDING,
        )
        self.client.force_authenticate(self.investor)

        response = self.client.post(
            "/api/v1/investments/",
            {
                "project": str(self.first.id),
                "amount": "51.00",
                "quantity": 1,
                "payment_method": Investment.PaymentMethod.BANK_TRANSFER,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Exceeding value", str(response.data))

    def test_exact_goal_marks_project_completed_and_keeps_it_public(self):
        from rest_framework import status

        Investment.objects.filter(pk=self.investment.pk).update(amount=Decimal("900"))
        final = Investment.objects.create(
            investor=self.investor,
            project=self.first,
            amount=Decimal("100"),
            status=Investment.Status.PENDING,
        )
        self.client.force_authenticate(self.staff)

        with patch("apps.investments.signals.publish_investment_confirmed_event"):
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.post(
                    f"/api/v1/investments/{final.id}/confirm/",
                    format="json",
                )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.first.refresh_from_db()
        self.assertEqual(self.first.funded_amount, Decimal("1000"))
        self.assertEqual(self.first.status, Project.Status.SUCCESSFUL)

        self.client.force_authenticate(user=None)
        detail = self.client.get(f"/api/v1/projects/{self.first.slug}/")
        listing = self.client.get("/api/v1/projects/")
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertIn(str(self.first.id), {str(item["id"]) for item in listing.data["results"]})

    def test_implementation_cannot_progress_before_full_funding(self):
        from rest_framework import status

        self.client.force_authenticate(self.staff)
        response = self.client.post(
            "/api/v1/admin/milestones/",
            {
                "project": str(self.first.id),
                "title": "Fit out the shop",
                "description": "Complete the physical shop fit-out.",
                "target_date": "2027-05-01",
                "status": Milestone.Status.IN_PROGRESS,
                "deliverables": "Completed shop",
                "percentage_of_project": "100.00",
                "funding_released": "0.00",
                "order": 1,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("100% funding", str(response.data))

        funding_release = self.client.post(
            "/api/v1/admin/milestones/",
            {
                "project": str(self.first.id),
                "title": "Fit out the shop",
                "description": "Complete the physical shop fit-out.",
                "target_date": "2027-05-01",
                "status": Milestone.Status.PENDING,
                "deliverables": "Completed shop",
                "percentage_of_project": "100.00",
                "funding_released": "100.00",
                "order": 1,
            },
            format="json",
        )
        self.assertEqual(funding_release.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cannot be released", str(funding_release.data))

    def test_roi_payments_require_completed_implementation(self):
        from rest_framework import status

        Project.objects.filter(pk=self.first.pk).update(
            funded_amount=self.first.goal_amount,
            status=Project.Status.SUCCESSFUL,
        )
        self.first.refresh_from_db()
        milestone = Milestone.objects.create(
            project=self.first,
            title="Open the shop",
            description="Finish implementation and open for business.",
            target_date="2027-05-01",
            percentage_of_project=Decimal("100.00"),
            order=1,
        )
        payload = {
            "investment": str(self.investment.id),
            "amount": "10.00",
            "scheduled_date": "2027-06-01",
            "status": "pending",
            "payment_method": Investment.PaymentMethod.BANK_TRANSFER,
        }
        self.client.force_authenticate(self.staff)

        blocked = self.client.post("/api/v1/admin/repayments/", payload, format="json")
        self.assertEqual(blocked.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("implementation is complete", str(blocked.data))

        milestone.status = Milestone.Status.COMPLETED
        milestone.actual_completion_date = "2027-05-15"
        milestone.save(update_fields=["status", "actual_completion_date"])

        too_early = self.client.post(
            "/api/v1/admin/repayments/",
            {**payload, "scheduled_date": "2027-05-14"},
            format="json",
        )
        self.assertEqual(too_early.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("became operational", str(too_early.data))

        accepted = self.client.post("/api/v1/admin/repayments/", payload, format="json")
        self.assertEqual(accepted.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(user=None)
        public_schedule = self.client.get(f"/api/v1/projects/{self.first.slug}/repayments/")
        self.assertEqual(public_schedule.status_code, status.HTTP_200_OK)
        self.assertEqual(public_schedule.data[0]["amount"], 10.0)
        self.assertNotIn("investor", public_schedule.data[0])
