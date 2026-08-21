import base64
from datetime import date
from decimal import Decimal
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core import mail
from django.test import override_settings
from django.urls import reverse
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.test import APITestCase

from apps.audit.models import AuditLog
from apps.investments.models import Investment, Milestone, Repayment
from apps.projects.models import Project, ProjectCategory


User = get_user_model()


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="Sahmi <no-reply@example.com>",
    CONTACT_EMAIL="ikrayyemala@gmail.com",
)
class ContactMessageTests(APITestCase):
    def test_contact_form_sends_validated_email_to_configured_recipient(self):
        response = self.client.post(
            reverse("contact-message"),
            {
                "name": "Test Sender",
                "email": "sender@example.com",
                "subject": "Partnership question",
                "message": "I would like to learn more about Sahmi.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        self.assertEqual(sent.to, ["ikrayyemala@gmail.com"])
        self.assertEqual(sent.reply_to, ["sender@example.com"])
        self.assertIn("Partnership question", sent.subject)
        self.assertIn("Test Sender", sent.body)

    def test_contact_form_rejects_invalid_input(self):
        response = self.client.post(
            reverse("contact-message"),
            {"name": "", "email": "invalid", "subject": "Hello\nBcc: bad@example.com", "message": ""},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(len(mail.outbox), 0)


class AdminAPIBase(APITestCase):
    @classmethod
    def setUpClass(cls):
        cls.media_directory = TemporaryDirectory()
        cls.media_override = override_settings(MEDIA_ROOT=cls.media_directory.name)
        cls.media_override.enable()
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        cls.media_override.disable()
        cls.media_directory.cleanup()

    def setUp(self):
        self.staff = User.objects.create_user(
            email="root@example.com",
            username="root-admin",
            full_name="Root Admin",
            password="password",
            user_type=User.UserType.ADMIN,
            is_staff=True,
            is_superuser=True,
        )
        self.owner = User.objects.create_user(
            email="owner@example.com",
            username="owner",
            full_name="Project Owner",
            password="password",
            user_type=User.UserType.ENTREPRENEUR,
        )
        self.investor = User.objects.create_user(
            email="investor@example.com",
            username="investor",
            full_name="Investor Person",
            password="password",
            user_type=User.UserType.INVESTOR,
        )
        self.outsider = User.objects.create_user(
            email="outsider@example.com",
            username="outsider",
            full_name="Unrelated User",
            password="password",
            user_type=User.UserType.INVESTOR,
        )
        self.category = ProjectCategory.objects.create(
            name="Agriculture",
            slug="agriculture",
        )
        self.project = Project.objects.create(
            entrepreneur=self.owner,
            title="Green Farm",
            slug="green-farm",
            description="Sustainable agriculture project",
            short_description="Sustainable farm",
            category=self.category,
            location="Hebron",
            goal_amount=Decimal("10000.00"),
            minimum_investment=Decimal("100.00"),
            expected_roi=Decimal("12.00"),
        )
        self.investment = Investment.objects.create(
            investor=self.investor,
            project=self.project,
            amount=Decimal("250.00"),
            status=Investment.Status.PENDING,
        )


class AdminAuthorizationAndUserTests(AdminAPIBase):
    def test_every_admin_collection_is_staff_only(self):
        self.client.force_authenticate(self.outsider)
        for route_name in (
            "admin-user-list",
            "admin-category-list",
            "admin-project-list",
            "admin-project-image-list",
            "admin-project-document-list",
            "admin-investment-list",
            "admin-milestone-list",
            "admin-repayment-list",
        ):
            with self.subTest(route_name=route_name):
                response = self.client.get(reverse(route_name))
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_crud_password_reset_and_safe_output(self):
        self.client.force_authenticate(self.staff)
        raw_password = "Strong-Create-Pass-2026!"
        response = self.client.post(
            reverse("admin-user-list"),
            {
                "email": "Managed@Example.COM",
                "full_name": "Managed User",
                "password": raw_password,
                "user_type": User.UserType.ENTREPRENEUR,
                "is_verified": True,
                "total_funded": "1234.50",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertNotIn("password", response.data)
        self.assertNotIn(raw_password, str(response.data))
        managed = User.objects.get(email="managed@example.com")
        self.assertTrue(managed.check_password(raw_password))

        response = self.client.patch(
            reverse("admin-user-detail", args=[managed.pk]),
            {
                "user_type": User.UserType.ADMIN,
                "is_staff": False,
                "is_kyc_verified": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(response.data["is_staff"])
        self.assertFalse(response.data["is_superuser"])
        self.assertNotIn("password", response.data)

        response = self.client.patch(
            reverse("admin-user-detail", args=[managed.pk]),
            {"is_superuser": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        new_password = "Different-Reset-Pass-2026!"
        response = self.client.post(
            reverse("admin-user-reset-password", args=[managed.pk]),
            {"password": new_password, "confirm_password": new_password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data, {"message": "Password reset successfully."})
        managed.refresh_from_db()
        self.assertTrue(managed.check_password(new_password))

    def test_self_deactivation_demotion_and_deletion_are_rejected(self):
        self.client.force_authenticate(self.staff)
        detail_url = reverse("admin-user-detail", args=[self.staff.pk])
        for payload in (
            {"is_active": False},
            {"is_staff": False},
            {"is_superuser": False},
            {"user_type": User.UserType.INVESTOR},
        ):
            with self.subTest(payload=payload):
                response = self.client.patch(detail_url, payload, format="json")
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.staff.refresh_from_db()
        self.assertTrue(self.staff.is_active)
        self.assertTrue(self.staff.is_staff)
        self.assertTrue(self.staff.is_superuser)
        self.assertEqual(self.staff.user_type, User.UserType.ADMIN)

    def test_last_active_superuser_cannot_be_demoted_or_deleted(self):
        manager = User.objects.create_user(
            email="manager@example.com",
            username="manager",
            full_name="Manager",
            password="password",
            is_staff=True,
        )
        self.client.force_authenticate(manager)
        detail_url = reverse("admin-user-detail", args=[self.staff.pk])

        response = self.client.patch(
            detail_url,
            {"is_superuser": False},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(User.objects.filter(pk=self.staff.pk).exists())

    def test_user_search_filter_and_ordering(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get(
            reverse("admin-user-list"),
            {
                "search": "Project Owner",
                "user_type": User.UserType.ENTREPRENEUR,
                "ordering": "email",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data["results"]], [str(self.owner.pk)])


class ApplicationAdminCreationBoundaryTests(AdminAPIBase):
    def setUp(self):
        super().setUp()
        self.application_admin = User.objects.create_user(
            email="application-admin@example.com",
            username="application-admin",
            full_name="Application Admin",
            password="password",
            user_type=User.UserType.ADMIN,
            is_staff=True,
            is_superuser=False,
        )
        self.client.force_authenticate(self.application_admin)

    def test_application_admin_cannot_create_managed_records(self):
        for route_name in (
            "admin-user-list",
            "admin-project-list",
            "admin-project-image-list",
            "admin-project-document-list",
            "admin-investment-list",
            "admin-milestone-list",
            "admin-repayment-list",
        ):
            with self.subTest(route_name=route_name):
                response = self.client.post(reverse(route_name), {}, format="json")
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

        response = self.client.post(
            reverse("admin-repayment-create-plan"), {}, format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)
        self.assertEqual(
            AuditLog.objects.filter(
                actor=self.application_admin,
                action="admin.create_denied",
                result=AuditLog.Result.DENIED,
            ).count(),
            8,
        )

    def test_application_admin_can_still_create_categories(self):
        response = self.client.post(
            reverse("admin-category-list"),
            {"name": "Healthcare", "slug": "healthcare"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_application_admin_cannot_grant_superuser_access(self):
        response = self.client.patch(
            reverse("admin-user-detail", args=[self.owner.pk]),
            {"is_superuser": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.owner.refresh_from_db()
        self.assertFalse(self.owner.is_superuser)


class AdminProjectAPITests(AdminAPIBase):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.staff)

    def test_project_full_crud_moderation_and_filtering(self):
        response = self.client.post(
            reverse("admin-project-list"),
            {
                "entrepreneur": str(self.owner.pk),
                "title": "Admin Created Project",
                "description": "Full admin description",
                "short_description": "Admin created",
                "category": str(self.category.pk),
                "location": "Ramallah",
                "location_governorate": "Ramallah and Al-Bireh",
                "goal_amount": "50000.00",
                "funded_amount": "7500.00",
                "minimum_investment": "250.00",
                "expected_roi": "16.50",
                "cost_items": [
                    {
                        "name": "Project setup",
                        "description": "Complete setup budget",
                        "quantity": "1",
                        "unit_cost": "50000.00",
                    }
                ],
                "milestones": [
                    {
                        "title": "Complete setup",
                        "description": "Finish the project setup.",
                        "target_date": "2027-02-01",
                        "deliverables": "Operational project",
                        "percentage_of_project": "100.00",
                        "order": 1,
                    }
                ],
                "funding_period_days": 90,
                "status": Project.Status.PAUSED,
                "is_verified": True,
                "verification_notes": "Reviewed by admin",
                "ai_classified_category": "Agriculture",
                "ai_confidence_score": "0.94",
                "ai_generated_summary": "AI summary",
                "milestone_count": 4,
                "repayment_status": Project.RepaymentStatus.DELAYED,
                "total_repaid": "1000.00",
                "view_count": 50,
                "investor_count": 7,
                "rating": "4.75",
                "reviews_count": 10,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        project_id = response.data["id"]
        self.assertEqual(str(response.data["entrepreneur"]), str(self.owner.pk))
        self.assertEqual(response.data["entrepreneur_detail"]["email"], self.owner.email)
        self.assertEqual(str(response.data["verified_by"]), str(self.staff.pk))
        self.assertNotIn("clear_cover_image", response.data)
        created_status = response.data["status"]

        response = self.client.patch(
            reverse("admin-project-detail", args=[project_id]),
            {"location": "Nablus", "funding_account": {"secured": "9000.00"}},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["funded_amount"], "0.00")
        self.assertEqual(response.data["funding_account"]["secured"], "0.00")
        self.assertEqual(response.data["location"], "Nablus")

        response = self.client.get(
            reverse("admin-project-list"),
            {"search": "Admin Created", "status": created_status, "ordering": "title"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data["results"]], [project_id])

        response = self.client.delete(reverse("admin-project-detail", args=[project_id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Project.objects.filter(pk=project_id).exists())

    def test_project_upload_clear_flags_and_child_asset_crud(self):
        project_url = reverse("admin-project-detail", args=[self.project.pk])
        plan = SimpleUploadedFile("plan.pdf", b"%PDF-1.7\nproject plan", content_type="application/pdf")
        response = self.client.patch(project_url, {"business_plan": plan}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.project.refresh_from_db()
        stored_plan_name = self.project.business_plan.name
        storage = self.project.business_plan.storage
        self.assertTrue(storage.exists(stored_plan_name))

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.patch(
                project_url,
                {"clear_business_plan": True},
                format="json",
            )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertNotIn("clear_business_plan", response.data)
        self.project.refresh_from_db()
        self.assertFalse(self.project.business_plan)
        self.assertFalse(storage.exists(stored_plan_name))

        gif = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==")
        image_response = self.client.post(
            reverse("admin-project-image-list"),
            {
                "project": str(self.project.pk),
                "image": SimpleUploadedFile("pixel.gif", gif, content_type="image/gif"),
                "alt_text": "Project preview",
            },
            format="multipart",
        )
        self.assertEqual(image_response.status_code, status.HTTP_201_CREATED, image_response.data)

        document_response = self.client.post(
            reverse("admin-project-document-list"),
            {
                "project": str(self.project.pk),
                "file": SimpleUploadedFile("evidence.pdf", b"%PDF-1.7\nevidence", content_type="application/pdf"),
                "title": "Evidence",
            },
            format="multipart",
        )
        self.assertEqual(document_response.status_code, status.HTTP_201_CREATED, document_response.data)

        response = self.client.get(project_url)
        self.assertEqual(len(response.data["images"]), 1)
        self.assertEqual(len(response.data["supporting_documents"]), 1)

        self.assertEqual(
            self.client.delete(
                reverse("admin-project-image-detail", args=[image_response.data["id"]])
            ).status_code,
            status.HTTP_204_NO_CONTENT,
        )
        self.assertEqual(
            self.client.delete(
                reverse("admin-project-document-detail", args=[document_response.data["id"]])
            ).status_code,
            status.HTTP_204_NO_CONTENT,
        )

    def test_category_crud_and_project_moderation_actions(self):
        self.project.business_plan.name = "project-documents/plan.pdf"
        self.project.financial_projections.name = "project-documents/forecast.pdf"
        self.project.ownership_proof.name = "project-documents/ownership.pdf"
        self.project.save(update_fields=["business_plan", "financial_projections", "ownership_proof", "updated_at"])
        category_response = self.client.post(
            reverse("admin-category-list"),
            {"name": "Technology", "slug": "technology", "description": "Tech"},
            format="json",
        )
        self.assertEqual(category_response.status_code, status.HTTP_201_CREATED)
        category_id = category_response.data["id"]
        self.assertEqual(
            self.client.patch(
                reverse("admin-category-detail", args=[category_id]),
                {"description": "Updated"},
                format="json",
            ).status_code,
            status.HTTP_200_OK,
        )

        response = self.client.post(
            reverse("admin-project-reject", args=[self.project.pk]),
            {"verification_notes": "Insufficient documents"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], Project.Status.FAILED)
        response = self.client.post(
            reverse("admin-project-verify", args=[self.project.pk]),
            {"verification_notes": "Now complete"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], Project.Status.ACTIVE)

        self.assertEqual(
            self.client.delete(reverse("admin-category-detail", args=[category_id])).status_code,
            status.HTTP_204_NO_CONTENT,
        )


class AdminFinanceAPITests(AdminAPIBase):
    def test_investment_milestone_and_repayment_crud(self):
        self.client.force_authenticate(self.staff)
        investment_response = self.client.post(
            reverse("admin-investment-list"),
            {
                "investor": str(self.investor.pk),
                "project": str(self.project.pk),
                "amount": "500.00",
                "status": Investment.Status.PENDING,
                "transaction_id": "ADMIN-TXN-1",
                "payment_method": Investment.PaymentMethod.CARD,
                "expected_return": "70.00",
                "actual_return": "20.00",
                "notes": "Admin entered",
            },
            format="json",
        )
        self.assertEqual(investment_response.status_code, status.HTTP_201_CREATED, investment_response.data)
        investment_id = investment_response.data["id"]
        self.assertEqual(investment_response.data["investor_detail"]["email"], self.investor.email)
        self.assertEqual(investment_response.data["project_detail"]["slug"], self.project.slug)

        other_project = Project.objects.create(
            entrepreneur=self.owner,
            title="Other Project",
            slug="other-project",
            description="Other project",
            short_description="Other",
            category=self.category,
            location="Nablus",
            goal_amount=Decimal("5000.00"),
            minimum_investment=Decimal("100.00"),
            expected_roi=Decimal("8.00"),
        )
        immutable_response = self.client.patch(
            reverse("admin-investment-detail", args=[investment_id]),
            {
                "investor": str(self.outsider.pk),
                "project": str(other_project.pk),
                "amount": "600.00",
                "expected_return": "80.00",
                "actual_return": "30.00",
                "payment_method": Investment.PaymentMethod.PAYPAL,
            },
            format="json",
        )
        self.assertEqual(immutable_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            set(immutable_response.data),
            {"investor", "project", "amount", "expected_return", "actual_return", "payment_method"},
        )

        received_response = self.client.patch(
            reverse("admin-investment-detail", args=[investment_id]),
            {"received_at": "2027-01-15T10:30:00Z"},
            format="json",
        )
        self.assertEqual(received_response.status_code, status.HTTP_200_OK, received_response.data)
        self.assertEqual(
            parse_datetime(received_response.data["received_at"]),
            parse_datetime("2027-01-15T10:30:00Z"),
        )

        Investment.objects.filter(pk=investment_id).update(status=Investment.Status.CONFIRMED)
        Project.objects.filter(pk=self.project.pk).update(
            funded_amount=self.project.goal_amount,
            status=Project.Status.CLOSED,
        )

        milestone_response = self.client.post(
            reverse("admin-milestone-list"),
            {
                "project": str(self.project.pk),
                "title": "First delivery",
                "description": "Deliver first batch",
                "target_date": "2027-02-01",
                "status": Milestone.Status.PENDING,
                "percentage_of_project": "100.00",
                "funding_released": "0.00",
                "order": 1,
            },
            format="json",
        )
        self.assertEqual(milestone_response.status_code, status.HTTP_201_CREATED, milestone_response.data)
        Milestone.objects.filter(pk=milestone_response.data["id"]).update(
            status=Milestone.Status.COMPLETED,
            actual_completion_date=date(2027, 2, 15),
            funding_released=self.project.goal_amount,
        )
        Investment.objects.filter(pk=investment_id).update(status=Investment.Status.COMPLETED)

        repayment_response = self.client.post(
            reverse("admin-repayment-list"),
            {
                "investment": investment_id,
                "amount": "125.00",
                "scheduled_date": "2027-03-01",
                "status": Repayment.Status.PENDING,
                "payment_method": Investment.PaymentMethod.BANK_TRANSFER,
            },
            format="json",
        )
        self.assertEqual(repayment_response.status_code, status.HTTP_201_CREATED, repayment_response.data)
        self.assertEqual(repayment_response.data["investor_detail"]["id"], str(self.investor.pk))

        repayment_response = self.client.post(
            reverse("admin-repayment-mark-paid", args=[repayment_response.data["id"]]),
            {"actual_payment_date": date.today().isoformat(), "transaction_id": "REPAY-1"},
            format="json",
        )
        self.assertEqual(repayment_response.status_code, status.HTTP_200_OK, repayment_response.data)

        filtered = self.client.get(
            reverse("admin-repayment-list"),
            {"status": Repayment.Status.PAID, "search": "REPAY-1", "ordering": "-amount"},
        )
        self.assertEqual(filtered.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in filtered.data["results"]], [repayment_response.data["id"]])

        patch_response = self.client.patch(
            reverse("admin-repayment-detail", args=[repayment_response.data["id"]]),
            {"notes": "Reconciled"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, status.HTTP_400_BAD_REQUEST)

        for route_name, object_id in (
            ("admin-milestone-detail", milestone_response.data["id"]),
            ("admin-investment-detail", investment_id),
        ):
            self.assertEqual(
                self.client.delete(reverse(route_name, args=[object_id])).status_code,
                status.HTTP_204_NO_CONTENT,
            )


class RelatedPartyWritePermissionTests(AdminAPIBase):
    def test_unrelated_user_cannot_create_or_mutate_milestones_and_repayments(self):
        milestone = Milestone.objects.create(
            project=self.project,
            title="Owner milestone",
            description="Owned milestone",
            target_date=date(2027, 1, 1),
            percentage_of_project=Decimal("20.00"),
        )
        repayment = Repayment.objects.create(
            investment=self.investment,
            amount=Decimal("50.00"),
            scheduled_date=date(2027, 1, 1),
        )
        self.client.force_authenticate(self.outsider)

        response = self.client.post(
            reverse("milestone-list"),
            {
                "project": str(self.project.pk),
                "title": "Injected",
                "description": "Not allowed",
                "target_date": "2027-04-01",
                "percentage_of_project": "10.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        response = self.client.post(
            reverse("repayment-list"),
            {
                "investment": str(self.investment.pk),
                "amount": "10.00",
                "scheduled_date": "2027-04-01",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(
            self.client.patch(
                reverse("milestone-detail", args=[milestone.pk]),
                {"title": "Hacked"},
                format="json",
            ).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            self.client.patch(
                reverse("repayment-detail", args=[repayment.pk]),
                {"notes": "Hacked"},
                format="json",
            ).status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def test_related_users_cannot_reassign_records_to_unrelated_objects(self):
        milestone = Milestone.objects.create(
            project=self.project,
            title='Owned milestone',
            description='Owned',
            target_date=date(2027, 1, 1),
            percentage_of_project=Decimal('20.00'),
        )
        repayment = Repayment.objects.create(
            investment=self.investment,
            amount=Decimal('50.00'),
            scheduled_date=date(2027, 1, 1),
        )
        other_owner = User.objects.create_user(
            email='other-owner@example.com',
            username='other-owner',
            full_name='Other Owner',
            password='password',
            user_type=User.UserType.ENTREPRENEUR,
        )
        other_project = Project.objects.create(
            entrepreneur=other_owner,
            title='Other Project',
            slug='other-project',
            description='Other project',
            short_description='Other',
            category=self.category,
            location='Nablus',
            goal_amount=Decimal('1000.00'),
            expected_roi=Decimal('0.00'),
        )
        other_investment = Investment.objects.create(
            investor=self.outsider,
            project=other_project,
            amount=Decimal('100.00'),
        )

        self.client.force_authenticate(self.owner)
        response = self.client.patch(
            reverse('milestone-detail', args=[milestone.pk]),
            {'project': str(other_project.pk)},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        milestone.refresh_from_db()
        self.assertEqual(milestone.project_id, self.project.pk)

        self.client.force_authenticate(self.investor)
        response = self.client.patch(
            reverse('repayment-detail', args=[repayment.pk]),
            {'investment': str(other_investment.pk)},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        repayment.refresh_from_db()
        self.assertEqual(repayment.investment_id, self.investment.pk)

    def test_project_owner_and_investor_can_create_related_records(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post(
            reverse("milestone-list"),
            {
                "project": str(self.project.pk),
                "title": "Owner milestone",
                "description": "Allowed",
                "target_date": "2027-04-01",
                "percentage_of_project": "10.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        self.client.force_authenticate(self.investor)
        response = self.client.post(
            reverse("repayment-list"),
            {
                "investment": str(self.investment.pk),
                "amount": "10.00",
                "scheduled_date": "2027-04-01",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED, response.data)
