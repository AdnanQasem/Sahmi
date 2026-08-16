from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone

from apps.notifications.models import Notification
from apps.projects.models import Project, ProjectCategory

from .models import Investment, Milestone, ProjectFundingAccount, Repayment, WithdrawalRequest


class RepaymentWorkflowTests(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient

        User = get_user_model()
        self.owner = User.objects.create_user(
            username="repayment-owner", email="repayment-owner@example.com",
            full_name="Repayment Owner", password="password",
            user_type=User.UserType.ENTREPRENEUR,
        )
        self.investor = User.objects.create_user(
            username="repayment-investor", email="repayment-investor@example.com",
            full_name="Repayment Investor", password="password",
        )
        self.other_investor = User.objects.create_user(
            username="other-repayment-investor", email="other-repayment@example.com",
            full_name="Other Investor", password="password",
        )
        self.admin = User.objects.create_user(
            username="repayment-admin", email="repayment-admin@example.com",
            full_name="Repayment Admin", password="password", is_staff=True,
            is_superuser=True,
        )
        category = ProjectCategory.objects.create(name="Repayments", slug="repayments")
        self.project = Project.objects.create(
            entrepreneur=self.owner, title="Completed venture", slug="completed-venture",
            description="Completed project", short_description="Completed",
            category=category, location="Hebron", goal_amount=Decimal("100.00"),
            funded_amount=Decimal("100.00"), expected_roi=Decimal("10.00"),
            status=Project.Status.CLOSED, is_verified=True,
        )
        Milestone.objects.create(
            project=self.project, title="Complete", description="Complete",
            target_date="2029-01-01", actual_completion_date="2029-01-01",
            status=Milestone.Status.COMPLETED, percentage_of_project=Decimal("100"),
        )
        self.investment = Investment.objects.create(
            investor=self.investor, project=self.project, amount=Decimal("100.00"),
            expected_return=Decimal("10.00"), status=Investment.Status.COMPLETED,
        )
        self.client = APIClient()

    def _schedule(self, amount="60.00", scheduled_date="2030-01-01"):
        return self.client.post("/api/v1/admin/repayments/", {
            "investment": str(self.investment.id), "amount": amount,
            "scheduled_date": scheduled_date, "payment_method": "bank_transfer",
        }, format="json")

    def test_admin_schedule_settlement_and_server_totals(self):
        from rest_framework import status

        self.client.force_authenticate(self.admin)
        initial_summary = self.client.get("/api/v1/repayments/summary/")
        self.assertEqual(Decimal(initial_summary.data["obligation_total"]), Decimal("110.00"))
        self.assertEqual(Decimal(initial_summary.data["scheduled_total"]), Decimal("0.00"))
        self.assertEqual(Decimal(initial_summary.data["remaining_total"]), Decimal("110.00"))
        self.assertEqual(len(initial_summary.data["obligations"]), 1)
        obligation = initial_summary.data["obligations"][0]
        self.assertEqual(Decimal(obligation["invested_total"]), Decimal("100.00"))
        self.assertEqual(Decimal(obligation["expected_return"]), Decimal("10.00"))
        self.assertEqual(Decimal(obligation["expected_roi_percent"]), Decimal("10.00"))
        self.assertEqual(Decimal(obligation["expected_repayment_total"]), Decimal("110.00"))
        self.assertEqual(obligation["status"], "pending_schedule")
        first = self._schedule()
        self.assertEqual(first.status_code, status.HTTP_201_CREATED, first.data)
        duplicate = self._schedule("10.00")
        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)
        excessive = self._schedule("51.00", "2030-02-01")
        self.assertEqual(excessive.status_code, status.HTTP_400_BAD_REQUEST)
        second = self._schedule("50.00", "2030-02-01")
        self.assertEqual(second.status_code, status.HTTP_201_CREATED, second.data)

        paid = self.client.post(
            f"/api/v1/admin/repayments/{first.data['id']}/mark-paid/",
            {"actual_payment_date": timezone.localdate().isoformat(), "transaction_id": "REPAY-001"},
            format="json",
        )
        self.assertEqual(paid.status_code, status.HTTP_200_OK, paid.data)
        self.project.refresh_from_db()
        self.investment.refresh_from_db()
        self.assertEqual(self.project.total_repaid, Decimal("60.00"))
        self.assertEqual(self.project.repayment_status, Project.RepaymentStatus.ON_TRACK)
        self.assertEqual(self.investment.actual_return, Decimal("60.00"))
        partial_summary = self.client.get("/api/v1/repayments/summary/")
        self.assertEqual(Decimal(partial_summary.data["remaining_total"]), Decimal("50.00"))
        self.assertEqual(Decimal(partial_summary.data["unscheduled_total"]), Decimal("0.00"))
        self.assertEqual(
            self.client.post(f"/api/v1/admin/repayments/{first.data['id']}/cancel/").status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            self.client.post(
                f"/api/v1/admin/repayments/{second.data['id']}/mark-paid/",
                {"actual_payment_date": timezone.localdate().isoformat(), "transaction_id": "REPAY-002"},
                format="json",
            ).status_code,
            status.HTTP_200_OK,
        )
        self.project.refresh_from_db()
        self.assertEqual(self.project.total_repaid, Decimal("110.00"))
        self.assertEqual(self.project.repayment_status, Project.RepaymentStatus.COMPLETED)
        self.assertIsNone(self.project.next_repayment_date)

    def test_admin_creates_a_complete_repayment_plan_atomically(self):
        from rest_framework import status

        self.client.force_authenticate(self.admin)
        response = self.client.post(
            "/api/v1/admin/repayments/create-plan/",
            {
                "investment": str(self.investment.id),
                "installment_count": 3,
                "first_scheduled_date": "2030-01-31",
                "interval_months": 1,
                "payment_method": "bank_transfer",
                "notes": "Quarterly repayment setup",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(len(response.data), 3)
        self.assertEqual(
            [record["scheduled_date"] for record in response.data],
            ["2030-01-31", "2030-02-28", "2030-03-31"],
        )
        self.assertEqual(
            sum(Decimal(str(record["amount"])) for record in response.data),
            Decimal("110.00"),
        )
        self.project.refresh_from_db()
        self.assertEqual(self.project.next_repayment_date.isoformat(), "2030-01-31")

        duplicate = self.client.post(
            "/api/v1/admin/repayments/create-plan/",
            {
                "investment": str(self.investment.id),
                "installment_count": 2,
                "first_scheduled_date": "2031-01-31",
            },
            format="json",
        )
        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Repayment.objects.filter(investment=self.investment).count(), 3)

    def test_roles_are_read_only_and_object_scoped(self):
        from rest_framework import status

        self.client.force_authenticate(self.admin)
        repayment = self._schedule()
        self.assertEqual(repayment.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(self.investor)
        own = self.client.get("/api/v1/repayments/")
        self.assertEqual(own.status_code, status.HTTP_200_OK)
        self.assertEqual(own.data["count"], 1)
        self.assertEqual(self.client.post("/api/v1/repayments/", {}).status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        self.client.force_authenticate(self.owner)
        obligations = self.client.get("/api/v1/repayments/")
        self.assertEqual(obligations.data["count"], 1)
        project_schedule = self.client.get(f"/api/v1/projects/{self.project.slug}/repayments/")
        self.assertEqual(project_schedule.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(self.other_investor)
        self.assertEqual(self.client.get("/api/v1/repayments/").data["count"], 0)
        self.assertEqual(self.client.get("/api/v1/repayments/summary/").data["obligations"], [])
        self.assertEqual(
            self.client.get(f"/api/v1/projects/{self.project.slug}/repayments/").status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_incomplete_projects_and_invalid_create_status_are_blocked(self):
        from rest_framework import status

        self.client.force_authenticate(self.admin)
        Project.objects.filter(pk=self.project.pk).update(status=Project.Status.IMPLEMENTATION)
        blocked = self._schedule()
        self.assertEqual(blocked.status_code, status.HTTP_400_BAD_REQUEST)
        Project.objects.filter(pk=self.project.pk).update(status=Project.Status.CLOSED)
        invalid = self.client.post("/api/v1/admin/repayments/", {
            "investment": str(self.investment.id), "amount": "10.00",
            "scheduled_date": "2030-01-01", "status": Repayment.Status.PAID,
        }, format="json")
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)

    def test_repayment_requires_verified_inbound_funding_before_admin_disbursement(self):
        from rest_framework import status

        self.client.force_authenticate(self.admin)
        repayment_response = self._schedule("110.00")
        self.assertEqual(repayment_response.status_code, status.HTTP_201_CREATED)
        repayment_id = repayment_response.data["id"]

        self.owner.is_kyc_verified = True
        self.owner.kyc_verified_at = timezone.now()
        self.owner.save(update_fields=["is_kyc_verified", "kyc_verified_at"])
        self.client.force_authenticate(self.owner)
        submitted = self.client.post(
            "/api/v1/repayment-transfers/",
            {
                "repayment": repayment_id,
                "inbound_reference": "BANK-IN-0001",
                "inbound_transfer_date": timezone.localdate().isoformat(),
                "receipt": SimpleUploadedFile(
                    "bank-receipt.pdf",
                    b"%PDF-1.7\nsynthetic bank receipt",
                    content_type="application/pdf",
                ),
                "source_of_funds_declaration": "Operating revenue from the completed project.",
                "agreement_accepted": True,
            },
            format="multipart",
        )
        self.assertEqual(submitted.status_code, status.HTTP_201_CREATED, submitted.data)
        self.assertEqual(Decimal(submitted.data["amount"]), Decimal("110.00"))
        transfer_id = submitted.data["id"]

        application_admin = get_user_model().objects.create_user(
            username="transfer-reviewer",
            email="transfer-reviewer@example.com",
            full_name="Transfer Reviewer",
            password="password",
            user_type="admin",
            is_staff=True,
            is_superuser=False,
        )
        self.client.force_authenticate(application_admin)
        direct = self.client.post(
            f"/api/v1/admin/repayments/{repayment_id}/mark-paid/",
            {"transaction_id": "UNVERIFIED"},
            format="json",
        )
        self.assertEqual(direct.status_code, status.HTTP_403_FORBIDDEN)

        reviewed = self.client.post(
            f"/api/v1/repayment-transfers/{transfer_id}/review/",
            {},
            format="json",
        )
        self.assertEqual(reviewed.status_code, status.HTTP_200_OK, reviewed.data)
        verified = self.client.post(
            f"/api/v1/repayment-transfers/{transfer_id}/verify/",
            {"review_notes": "Matched amount and reference against the safeguarded account statement."},
            format="json",
        )
        self.assertEqual(verified.status_code, status.HTTP_200_OK, verified.data)
        disbursed = self.client.post(
            f"/api/v1/repayment-transfers/{transfer_id}/disburse/",
            {
                "outbound_reference": "BANK-OUT-0001",
                "actual_payment_date": timezone.localdate().isoformat(),
            },
            format="json",
        )
        self.assertEqual(disbursed.status_code, status.HTTP_200_OK, disbursed.data)
        repayment = Repayment.objects.get(pk=repayment_id)
        self.assertEqual(repayment.status, Repayment.Status.PAID)
        self.assertEqual(repayment.transaction_id, "BANK-OUT-0001")
        self.assertEqual(repayment.investment.actual_return, Decimal("110.00"))

    def test_non_kyc_entrepreneur_cannot_submit_repayment_funding(self):
        from rest_framework import status

        self.client.force_authenticate(self.admin)
        repayment = self._schedule("110.00")
        self.client.force_authenticate(self.owner)
        response = self.client.post(
            "/api/v1/repayment-transfers/",
            {
                "repayment": repayment.data["id"],
                "inbound_reference": "BANK-IN-NO-KYC",
                "inbound_transfer_date": timezone.localdate().isoformat(),
                "receipt": SimpleUploadedFile("receipt.pdf", b"%PDF-1.7\nreceipt", content_type="application/pdf"),
                "source_of_funds_declaration": "Operating revenue from the completed project.",
                "agreement_accepted": True,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("KYC verification", str(response.data))


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
        self.staff = User.objects.create_user(username="totals-staff", email="totals-staff@example.com", full_name="Staff", password="password", is_staff=True, is_superuser=True)
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

    def test_admin_summary_counts_only_confirmed_and_completed_as_invested(self):
        from rest_framework import status

        Investment.objects.create(
            investor=self.investor,
            project=self.first,
            amount=Decimal("250.00"),
            status=Investment.Status.CANCELED,
        )
        Investment.objects.create(
            investor=self.investor,
            project=self.second,
            amount=Decimal("50.00"),
            status=Investment.Status.COMPLETED,
        )
        self.client.force_authenticate(self.staff)

        response = self.client.get("/api/v1/admin/investments/summary/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(response.data["recorded_total"]), Decimal("400.00"))
        self.assertEqual(Decimal(response.data["funded_total"]), Decimal("150.00"))
        self.assertEqual(response.data["total_count"], 3)
        self.assertEqual(response.data["funded_count"], 2)
        self.assertEqual(response.data["pending_count"], 0)

        cancelled = self.client.get(
            "/api/v1/admin/investments/summary/",
            {"status": Investment.Status.CANCELED},
        )
        self.assertEqual(Decimal(cancelled.data["recorded_total"]), Decimal("250.00"))
        self.assertEqual(Decimal(cancelled.data["funded_total"]), Decimal("0.00"))
        self.assertEqual(cancelled.data["total_count"], 1)

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

    def test_entrepreneur_can_browse_projects_but_cannot_invest_in_any_project(self):
        from rest_framework import status

        User = get_user_model()
        other_owner = User.objects.create_user(
            username="other-project-owner",
            email="other-project-owner@example.com",
            full_name="Other Project Owner",
            password="password",
            user_type=User.UserType.ENTREPRENEUR,
        )
        other_project = Project.objects.create(
            entrepreneur=other_owner,
            title="Other Owner Project",
            slug="other-owner-project",
            description="Another verified project.",
            short_description="Another project",
            category=self.category,
            location="Ramallah",
            goal_amount=Decimal("1000.00"),
            minimum_investment=Decimal("10.00"),
            expected_roi=Decimal("10.00"),
            is_verified=True,
            status=Project.Status.ACTIVE,
        )
        self.client.force_authenticate(self.owner)

        for project in (self.second, other_project):
            with self.subTest(project=project.slug):
                detail = self.client.get(f"/api/v1/projects/{project.slug}/")
                self.assertEqual(detail.status_code, status.HTTP_200_OK)

                response = self.client.post(
                    "/api/v1/investments/",
                    {
                        "project": str(project.id),
                        "amount": "100.00",
                        "quantity": 1,
                        "payment_method": Investment.PaymentMethod.BANK_TRANSFER,
                    },
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.assertFalse(Investment.objects.filter(investor=self.owner).exists())

    def test_admin_cannot_assign_an_investment_to_an_entrepreneur(self):
        from rest_framework import status

        self.client.force_authenticate(self.staff)
        response = self.client.post(
            "/api/v1/admin/investments/",
            {
                "investor": str(self.owner.id),
                "project": str(self.second.id),
                "amount": "100.00",
                "quantity": 1,
                "status": Investment.Status.PENDING,
                "payment_method": Investment.PaymentMethod.BANK_TRANSFER,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("investor", response.data)

    def test_model_rejects_an_entrepreneur_as_investor(self):
        from django.core.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            Investment.objects.create(
                investor=self.owner,
                project=self.second,
                amount=Decimal("100.00"),
            )

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
        self.assertIn("project is Completed", str(blocked.data))

        milestone.status = Milestone.Status.COMPLETED
        milestone.actual_completion_date = "2027-05-15"
        milestone.save(update_fields=["status", "actual_completion_date"])

        Project.objects.filter(pk=self.first.pk).update(status=Project.Status.CLOSED)
        Investment.objects.filter(pk=self.investment.pk).update(status=Investment.Status.COMPLETED)

        too_early = self.client.post(
            "/api/v1/admin/repayments/",
            {**payload, "scheduled_date": "2027-05-14"},
            format="json",
        )
        self.assertEqual(too_early.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("became operational", str(too_early.data))

        accepted = self.client.post("/api/v1/admin/repayments/", payload, format="json")
        self.assertEqual(accepted.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(self.investor)
        public_schedule = self.client.get(f"/api/v1/projects/{self.first.slug}/repayments/")
        self.assertEqual(public_schedule.status_code, status.HTTP_200_OK)
        self.assertEqual(public_schedule.data[0]["amount"], 10.0)
        self.assertNotIn("investor", public_schedule.data[0])


class FundingIntegrityTests(TestCase):
    def test_model_rejects_in_progress_milestone_until_full_funding(self):
        from django.core.exceptions import ValidationError

        User = get_user_model()
        owner = User.objects.create_user(
            username="milestone-funding-owner",
            email="milestone-funding-owner@example.com",
            full_name="Milestone Funding Owner",
            password="password",
            user_type=User.UserType.ENTREPRENEUR,
        )
        category = ProjectCategory.objects.create(
            name="Milestone Funding", slug="milestone-funding"
        )
        project = Project.objects.create(
            entrepreneur=owner,
            title="Funding Gate Project",
            slug="funding-gate-project",
            description="Milestone funding gate test",
            short_description="Funding gate",
            category=category,
            location="Jenin",
            goal_amount=Decimal("1000"),
            funded_amount=Decimal("999.99"),
            status=Project.Status.ACTIVE,
        )
        milestone = Milestone(
            project=project,
            title="Blocked milestone",
            description="Must wait for complete funding",
            target_date=timezone.localdate(),
            percentage_of_project=Decimal("100"),
            order=1,
            status=Milestone.Status.IN_PROGRESS,
        )

        with self.assertRaisesMessage(ValidationError, "completely funded"):
            milestone.save()

        Project.objects.filter(pk=project.pk).update(funded_amount=Decimal("1000"))
        milestone.save()
        self.assertEqual(milestone.status, Milestone.Status.IN_PROGRESS)

    @patch("redis.Redis.from_url")
    def test_reconciliation_rebuilds_financial_caches_from_transactions(self, _redis):
        from apps.investments.integrity import (
            audit_funding_integrity,
            reconcile_all_project_finances,
        )

        User = get_user_model()
        owner = User.objects.create_user(
            username="integrity-owner",
            email="integrity-owner@example.com",
            full_name="Integrity Owner",
            password="password",
            user_type=User.UserType.ENTREPRENEUR,
        )
        investor = User.objects.create_user(
            username="integrity-investor",
            email="integrity-investor@example.com",
            full_name="Integrity Investor",
            password="password",
        )
        category = ProjectCategory.objects.create(name="Integrity", slug="integrity")
        project = Project.objects.create(
            entrepreneur=owner,
            title="Integrity Project",
            slug="integrity-project",
            description="Financial integrity test",
            short_description="Integrity test",
            category=category,
            location="Nablus",
            goal_amount=Decimal("1000"),
            is_verified=True,
            status=Project.Status.ACTIVE,
        )
        Milestone.objects.create(
            project=project,
            title="Only milestone",
            description="Complete all implementation work",
            target_date=timezone.localdate(),
            percentage_of_project=Decimal("100"),
            order=1,
        )
        with self.captureOnCommitCallbacks(execute=True):
            Investment.objects.create(
                investor=investor,
                project=project,
                amount=Decimal("1000"),
                status=Investment.Status.CONFIRMED,
            )
        ProjectFundingAccount.objects.create(project=project, secured=Decimal("1000"))
        Project.objects.filter(pk=project.pk).update(
            funded_amount=Decimal("0"), investor_count=0, status=Project.Status.ACTIVE,
        )
        ProjectFundingAccount.objects.filter(project=project).update(secured=Decimal("50"))

        self.assertTrue(audit_funding_integrity())
        self.assertEqual(reconcile_all_project_finances(), [])

        project.refresh_from_db()
        account = ProjectFundingAccount.objects.get(project=project)
        self.assertEqual(project.funded_amount, Decimal("1000"))
        self.assertEqual(project.investor_count, 1)
        self.assertEqual(project.status, Project.Status.SUCCESSFUL)
        self.assertEqual(account.secured, Decimal("1000"))


class ScheduledImplementationTransitionTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.owner = User.objects.create_user(
            username="scheduled-owner",
            email="scheduled-owner@example.com",
            full_name="Scheduled Owner",
            password="password",
            user_type=User.UserType.ENTREPRENEUR,
        )
        self.investor = User.objects.create_user(
            username="scheduled-investor",
            email="scheduled-investor@example.com",
            full_name="Scheduled Investor",
            password="password",
        )
        self.category = ProjectCategory.objects.create(
            name="Scheduled Projects", slug="scheduled-projects"
        )

    def _project(self, slug, status=Project.Status.ACTIVE):
        funded_amount = Decimal("1000") if status == Project.Status.IMPLEMENTATION else Decimal("0")
        return Project.objects.create(
            entrepreneur=self.owner,
            title=f"Project {slug}",
            slug=slug,
            description="Scheduled implementation project",
            short_description="Scheduled project",
            category=self.category,
            location="Ramallah",
            goal_amount=Decimal("1000"),
            funded_amount=funded_amount,
            minimum_investment=Decimal("100"),
            expected_roi=Decimal("5"),
            is_verified=True,
            status=status,
        )

    def _milestone(self, project, title, target_date, order, status=Milestone.Status.PENDING):
        return Milestone.objects.create(
            project=project,
            title=title,
            description=f"Work for {title}",
            target_date=target_date,
            percentage_of_project=Decimal("25"),
            order=order,
            status=status,
        )

    @patch("redis.Redis.from_url")
    def test_first_milestone_date_starts_fully_funded_project_once(self, _redis):
        from apps.investments.services import sync_scheduled_implementation

        today = timezone.localdate()
        project = self._project("automatic-first")
        first = self._milestone(project, "First", today, 1)
        self._milestone(project, "Second", today + timezone.timedelta(days=1), 2)
        with self.captureOnCommitCallbacks(execute=True):
            Investment.objects.create(
                investor=self.investor,
                project=project,
                amount=Decimal("1000"),
                status=Investment.Status.CONFIRMED,
            )
        project.refresh_from_db()
        self.assertEqual(project.status, Project.Status.SUCCESSFUL)

        with self.captureOnCommitCallbacks(execute=True):
            result = sync_scheduled_implementation(today=today)

        project.refresh_from_db()
        first.refresh_from_db()
        self.assertEqual(project.status, Project.Status.IMPLEMENTATION)
        self.assertEqual(first.status, Milestone.Status.IN_PROGRESS)
        self.assertEqual(result["projects_started"], 1)
        self.assertEqual(
            ProjectFundingAccount.objects.get(project=project).secured,
            Decimal("1000"),
        )

        second_run = sync_scheduled_implementation(today=today)
        self.assertEqual(second_run, {
            "projects_started": 0,
            "milestones_started": 0,
            "milestones_delayed": 0,
        })

    @patch("redis.Redis.from_url")
    def test_later_date_advances_current_milestone_without_changing_completed_one(self, _redis):
        from apps.investments.services import sync_scheduled_implementation

        today = timezone.localdate()
        project = self._project("automatic-next", status=Project.Status.IMPLEMENTATION)
        completed = self._milestone(
            project,
            "Completed",
            today - timezone.timedelta(days=2),
            1,
            status=Milestone.Status.COMPLETED,
        )
        current = self._milestone(
            project,
            "Current",
            today - timezone.timedelta(days=1),
            2,
            status=Milestone.Status.IN_PROGRESS,
        )
        next_milestone = self._milestone(project, "Next", today, 3)

        with self.captureOnCommitCallbacks(execute=True):
            result = sync_scheduled_implementation(today=today)

        completed.refresh_from_db()
        current.refresh_from_db()
        next_milestone.refresh_from_db()
        self.assertEqual(completed.status, Milestone.Status.COMPLETED)
        self.assertEqual(current.status, Milestone.Status.DELAYED)
        self.assertEqual(next_milestone.status, Milestone.Status.IN_PROGRESS)
        self.assertEqual(result["milestones_delayed"], 1)
        self.assertEqual(result["milestones_started"], 1)


class SecuredFundingWorkflowTests(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient
        User = get_user_model()
        self.owner = User.objects.create_user(username="fund-owner", email="fund-owner@example.com", full_name="Owner", password="password", user_type=User.UserType.ENTREPRENEUR)
        self.investor = User.objects.create_user(username="fund-investor", email="fund-investor@example.com", full_name="Investor", password="password")
        self.admin = User.objects.create_user(username="fund-admin", email="fund-admin@example.com", full_name="Admin", password="password", is_staff=True)
        category = ProjectCategory.objects.create(name="Secured", slug="secured")
        self.project = Project.objects.create(
            entrepreneur=self.owner, title="Secured Project", slug="secured-project", description="d",
            short_description="s", category=category, location="Gaza", goal_amount=Decimal("10000"),
            minimum_investment=Decimal("100"), expected_roi=Decimal("5"), is_verified=True,
            status=Project.Status.ACTIVE,
        )
        self.first = Milestone.objects.create(
            project=self.project, title="Materials", description="Buy materials", target_date="2027-01-01",
            percentage_of_project=Decimal("30"), order=1,
        )
        self.second = Milestone.objects.create(
            project=self.project, title="Build", description="Build premises", target_date="2027-02-01",
            percentage_of_project=Decimal("40"), order=2,
        )
        self.third = Milestone.objects.create(
            project=self.project, title="Open", description="Open business", target_date="2027-03-01",
            percentage_of_project=Decimal("30"), order=3,
        )
        with patch("redis.Redis.from_url"):
            with self.captureOnCommitCallbacks(execute=True):
                self.investment = Investment.objects.create(
                    investor=self.investor, project=self.project, amount=Decimal("10000"),
                    status=Investment.Status.CONFIRMED,
                )
        self.project.refresh_from_db()
        self.client = APIClient()

    def test_goal_finalization_and_first_milestone_release(self):
        from rest_framework import status
        self.assertEqual(self.project.status, Project.Status.SUCCESSFUL)
        self.assertEqual(self.project.funded_amount, Decimal("10000"))
        self.assertIsNotNone(self.project.funding_reached_at)

        self.client.force_authenticate(self.investor)
        blocked = self.client.post("/api/v1/investments/", {
            "project": str(self.project.id), "amount": "100", "payment_method": "bank_transfer",
        }, format="json")
        self.assertEqual(blocked.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.admin)
        with self.captureOnCommitCallbacks(execute=True):
            finalized = self.client.post(f"/api/v1/admin/projects/{self.project.id}/finalize-funding/", {}, format="json")
        self.assertEqual(finalized.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.investment.refresh_from_db()
        self.first.refresh_from_db()
        self.assertEqual(self.project.status, Project.Status.IMPLEMENTATION)
        self.assertEqual(self.first.status, Milestone.Status.IN_PROGRESS)
        account = ProjectFundingAccount.objects.get(project=self.project)
        self.assertEqual(account.secured, Decimal("10000"))
        self.assertEqual(account.available, Decimal("10000"))
        self.assertEqual(account.released, Decimal("0"))
        self.assertEqual(account.refunded, Decimal("0"))
        self.assertEqual(self.investment.status, Investment.Status.CONFIRMED)

        tamper = self.client.patch(
            f"/api/v1/admin/projects/{self.project.id}/",
            {"funding_account": {"secured": "0.00", "released": "10000.00"}},
            format="json",
        )
        self.assertEqual(tamper.status_code, status.HTTP_200_OK)
        account.refresh_from_db()
        self.assertEqual(account.secured, Decimal("10000"))
        self.assertEqual(account.released, Decimal("0"))

        self.client.force_authenticate(self.owner)
        requested = self.client.post("/api/v1/withdrawals/", {
            "milestone": str(self.first.id), "amount": "3000.00",
            "evidence_description": "Supplier quotations and material list",
            "planned_expenses": "Purchase solar panels and mounting materials",
        }, format="json")
        self.assertEqual(requested.status_code, status.HTTP_201_CREATED)
        withdrawal_id = requested.data["id"]

        blocked_second = self.client.post("/api/v1/withdrawals/", {
            "milestone": str(self.second.id), "amount": "4000.00",
            "evidence_description": "Construction evidence package",
            "planned_expenses": "Pay contractors and construction invoices",
        }, format="json")
        self.assertEqual(blocked_second.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.admin)
        premature_approval = self.client.post(f"/api/v1/withdrawals/{withdrawal_id}/approve/")
        self.assertEqual(premature_approval.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.client.post(f"/api/v1/withdrawals/{withdrawal_id}/review/").status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.post(f"/api/v1/withdrawals/{withdrawal_id}/approve/").status_code, status.HTTP_200_OK)
        with self.captureOnCommitCallbacks(execute=True):
            released = self.client.post(f"/api/v1/withdrawals/{withdrawal_id}/release/")
        self.assertEqual(released.status_code, status.HTTP_200_OK)
        account.refresh_from_db()
        self.first.refresh_from_db()
        self.assertEqual(account.secured, Decimal("7000"))
        self.assertEqual(account.available, Decimal("7000"))
        self.assertEqual(account.released, Decimal("3000"))
        self.assertEqual(self.first.funding_released, Decimal("3000"))
        self.assertTrue(released.data["payout_reference"].startswith("PAY-"))

        duplicate = self.client.post(f"/api/v1/withdrawals/{withdrawal_id}/release/")
        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)
        account.refresh_from_db()
        self.assertEqual(account.secured, Decimal("7000"))
        self.assertEqual(account.released, Decimal("3000"))

    def test_milestones_unlock_in_order_and_final_completion_closes_project(self):
        from rest_framework import status

        self.client.force_authenticate(self.admin)
        finalized = self.client.post(
            f"/api/v1/admin/projects/{self.project.id}/finalize-funding/", {}, format="json"
        )
        self.assertEqual(finalized.status_code, status.HTTP_200_OK)
        self.first.refresh_from_db()
        self.assertEqual(self.first.status, Milestone.Status.IN_PROGRESS)

        locked = self.client.patch(
            f"/api/v1/admin/milestones/{self.second.id}/",
            {"status": Milestone.Status.IN_PROGRESS},
            format="json",
        )
        self.assertEqual(locked.status_code, status.HTTP_400_BAD_REQUEST)

        Milestone.objects.filter(pk=self.first.pk).update(funding_released=Decimal("3000"))
        blocked_completion = self.client.patch(
            f"/api/v1/admin/milestones/{self.first.id}/",
            {"status": Milestone.Status.COMPLETED, "actual_completion_date": "2027-01-01"},
            format="json",
        )
        self.assertEqual(blocked_completion.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.owner)
        submitted = self.client.post(
            f"/api/v1/milestones/{self.first.id}/submit-completion/",
            {
                "completion_summary": "Materials were purchased, delivered, and inspected.",
                "completion_evidence": SimpleUploadedFile(
                    "materials.pdf", b"completed milestone evidence", content_type="application/pdf"
                ),
            },
            format="multipart",
        )
        self.assertEqual(submitted.status_code, status.HTTP_200_OK, submitted.data)
        self.assertEqual(submitted.data["completion_status"], Milestone.CompletionStatus.SUBMITTED)

        self.client.force_authenticate(self.admin)
        premature = self.client.post(f"/api/v1/milestones/{self.first.id}/approve-completion/", {}, format="json")
        self.assertEqual(premature.status_code, status.HTTP_400_BAD_REQUEST)
        reviewed = self.client.post(f"/api/v1/milestones/{self.first.id}/review-completion/", {}, format="json")
        self.assertEqual(reviewed.status_code, status.HTTP_200_OK, reviewed.data)
        completed_first = self.client.post(
            f"/api/v1/milestones/{self.first.id}/approve-completion/",
            {"review_notes": "Evidence verified."},
            format="json",
        )
        self.assertEqual(completed_first.status_code, status.HTTP_200_OK, completed_first.data)
        self.assertEqual(completed_first.data["status"], Milestone.Status.COMPLETED)
        self.second.refresh_from_db()
        self.assertEqual(self.second.status, Milestone.Status.IN_PROGRESS)

        self.client.force_authenticate(self.owner)
        next_request = self.client.post("/api/v1/withdrawals/", {
            "milestone": str(self.second.id), "amount": "4000.00",
            "evidence_description": "Verified plans for the second milestone",
            "planned_expenses": "Construction labor and installation materials",
        }, format="json")
        self.assertEqual(next_request.status_code, status.HTTP_201_CREATED, next_request.data)
        self.assertEqual(
            self.client.post(f"/api/v1/withdrawals/{next_request.data['id']}/cancel/").status_code,
            status.HTTP_200_OK,
        )
        self.client.force_authenticate(self.admin)

        Milestone.objects.filter(pk=self.second.pk).update(
            status=Milestone.Status.COMPLETED,
            completion_status=Milestone.CompletionStatus.APPROVED,
            actual_completion_date="2027-02-01",
            funding_released=Decimal("4000"),
        )
        Milestone.objects.filter(pk=self.third.pk).update(
            status=Milestone.Status.IN_PROGRESS,
            completion_status=Milestone.CompletionStatus.APPROVED,
            funding_released=Decimal("3000"),
        )
        account = ProjectFundingAccount.objects.get(project=self.project)
        account.secured = Decimal("0")
        account.released = Decimal("10000")
        account.save(update_fields=["secured", "released", "updated_at"])

        completed_final = self.client.patch(
            f"/api/v1/admin/milestones/{self.third.id}/",
            {"status": Milestone.Status.COMPLETED, "actual_completion_date": "2027-03-01"},
            format="json",
        )
        self.assertEqual(completed_final.status_code, status.HTTP_200_OK, completed_final.data)
        self.project.refresh_from_db()
        self.investment.refresh_from_db()
        self.assertEqual(self.project.status, Project.Status.IMPLEMENTATION)
        self.assertEqual(self.investment.status, Investment.Status.CONFIRMED)

    def test_final_acceptance_enforces_three_day_quality_hold_and_handover(self):
        from rest_framework import status

        today = timezone.localdate()
        Project.objects.filter(pk=self.project.pk).update(
            status=Project.Status.IMPLEMENTATION,
            funding_finalized_at=timezone.now(),
        )
        Milestone.objects.filter(pk__in=[self.first.pk, self.second.pk]).update(
            status=Milestone.Status.COMPLETED,
            completion_status=Milestone.CompletionStatus.APPROVED,
            actual_completion_date=today,
        )
        Milestone.objects.filter(pk=self.first.pk).update(funding_released=Decimal("3000"))
        Milestone.objects.filter(pk=self.second.pk).update(funding_released=Decimal("4000"))
        Milestone.objects.filter(pk=self.third.pk).update(
            status=Milestone.Status.IN_PROGRESS,
            completion_status=Milestone.CompletionStatus.UNDER_REVIEW,
            funding_released=Decimal("3000"),
        )
        account, _ = ProjectFundingAccount.objects.get_or_create(project=self.project)
        account.secured = Decimal("0")
        account.released = Decimal("10000")
        account.save(update_fields=["secured", "released", "updated_at"])
        self.client.force_authenticate(self.admin)

        with self.captureOnCommitCallbacks(execute=True):
            accepted = self.client.post(
                f"/api/v1/milestones/{self.third.id}/approve-completion/",
                {"review_notes": "Final deliverables accepted."},
                format="json",
            )
        self.assertEqual(accepted.status_code, status.HTTP_200_OK, accepted.data)
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, Project.Status.IMPLEMENTATION)
        self.assertIsNotNone(self.project.quality_hold_started_at)
        self.assertEqual(
            self.project.quality_hold_until - self.project.quality_hold_started_at,
            timezone.timedelta(days=3),
        )

        blocked = self.client.post(
            f"/api/v1/admin/projects/{self.project.id}/finalize-completion/",
            {"handover_notes": "Quality checks and handover accepted."},
            format="json",
        )
        self.assertEqual(blocked.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("3-day", str(blocked.data))

        Project.objects.filter(pk=self.project.pk).update(
            quality_hold_until=timezone.now() - timezone.timedelta(seconds=1),
        )
        with self.captureOnCommitCallbacks(execute=True):
            completed = self.client.post(
                f"/api/v1/admin/projects/{self.project.id}/finalize-completion/",
                {"handover_notes": "Quality checks and handover accepted."},
                format="json",
            )
        self.assertEqual(completed.status_code, status.HTTP_200_OK, completed.data)
        self.project.refresh_from_db()
        self.investment.refresh_from_db()
        account.refresh_from_db()
        self.assertEqual(self.project.status, Project.Status.CLOSED)
        self.assertIsNotNone(self.project.completion_handover_approved_at)
        self.assertEqual(self.investment.status, Investment.Status.COMPLETED)
        self.assertEqual(account.secured, Decimal("0"))
        self.assertEqual(account.released, Decimal("10000"))

    def test_real_percentage_is_not_capped_while_balance_uses_funded_statuses(self):
        from apps.investments.services import sync_project_totals
        Investment.objects.create(
            investor=self.investor, project=self.project, amount=Decimal("3100"),
            status=Investment.Status.CONFIRMED,
        )
        snapshot = sync_project_totals(self.project.id)
        self.assertEqual(snapshot["funding_percent"], 131.0)

    def test_failed_project_preserves_unreleased_funds(self):
        from rest_framework import status

        self.client.force_authenticate(self.admin)
        finalized = self.client.post(
            f"/api/v1/admin/projects/{self.project.id}/finalize-funding/", {}, format="json"
        )
        self.assertEqual(finalized.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(self.owner)
        requested = self.client.post("/api/v1/withdrawals/", {
            "milestone": str(self.first.id), "amount": "1000.00",
            "evidence_description": "Supplier invoices for the first milestone",
            "planned_expenses": "Purchase the approved milestone materials",
        }, format="json")
        self.assertEqual(requested.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(self.admin)
        withdrawal_id = requested.data["id"]
        self.assertEqual(
            self.client.post(f"/api/v1/withdrawals/{withdrawal_id}/review/").status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            self.client.post(f"/api/v1/withdrawals/{withdrawal_id}/approve/").status_code,
            status.HTTP_200_OK,
        )
        Project.objects.filter(pk=self.project.pk).update(status=Project.Status.FAILED)
        blocked = self.client.post(f"/api/v1/withdrawals/{withdrawal_id}/release/")
        self.assertEqual(blocked.status_code, status.HTTP_400_BAD_REQUEST)
        account = ProjectFundingAccount.objects.get(project=self.project)
        self.assertEqual(account.secured, Decimal("10000"))
        self.assertEqual(account.released, Decimal("0"))

    def test_entrepreneur_can_cancel_a_requested_withdrawal(self):
        from apps.audit.models import AuditLog
        from rest_framework import status

        self.client.force_authenticate(self.admin)
        self.assertEqual(
            self.client.post(f"/api/v1/admin/projects/{self.project.id}/finalize-funding/", {}).status_code,
            status.HTTP_200_OK,
        )
        self.client.force_authenticate(self.owner)
        requested = self.client.post("/api/v1/withdrawals/", {
            "milestone": str(self.first.id), "amount": "1000.00",
            "evidence_description": "Supplier invoices for the first milestone",
            "planned_expenses": "Purchase the approved milestone materials",
        }, format="json")
        cancelled = self.client.post(f"/api/v1/withdrawals/{requested.data['id']}/cancel/")
        self.assertEqual(cancelled.status_code, status.HTTP_200_OK)
        self.assertEqual(cancelled.data["status"], WithdrawalRequest.Status.CANCELLED)
        self.assertTrue(AuditLog.objects.filter(action="withdrawal.cancelled", target_id=requested.data["id"]).exists())

    def test_configured_payment_provider_returns_payout_reference(self):
        from .payments import ConfiguredPaymentProvider, get_payment_provider

        provider = get_payment_provider()
        self.assertIsInstance(provider, ConfiguredPaymentProvider)
        payout = provider.release(
            withdrawal_id="withdrawal-id",
            amount=Decimal("25.00"),
            recipient_id=str(self.owner.id),
        )
        self.assertEqual(payout.status, "released")
        self.assertTrue(payout.transaction_id.startswith("PAY-"))
