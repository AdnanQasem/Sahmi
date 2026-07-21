from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Project, ProjectCategory


User = get_user_model()


class ProjectAPITestCase(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            email="staff@example.com",
            username="staff",
            full_name="Staff User",
            password="password",
            is_staff=True,
        )
        self.entrepreneur = User.objects.create_user(
            email="owner@example.com",
            username="owner",
            full_name="Project Owner",
            password="password",
            user_type=User.UserType.ENTREPRENEUR,
        )
        self.category = ProjectCategory.objects.create(
            name="Agriculture",
            slug="agriculture",
        )
        self.project = Project.objects.create(
            entrepreneur=self.entrepreneur,
            title="Green Farm",
            slug="green-farm",
            description="A sustainable farming project.",
            short_description="Sustainable farming",
            category=self.category,
            location="Hebron",
            goal_amount=Decimal("10000.00"),
            minimum_investment=Decimal("100.00"),
            expected_roi=Decimal("12.00"),
        )


class ProjectCategoryPermissionTests(ProjectAPITestCase):
    def test_category_reads_are_public(self):
        list_response = self.client.get(reverse("category-list"))
        detail_response = self.client.get(
            reverse("category-detail", args=[self.category.pk])
        )

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)

    def test_non_staff_user_cannot_mutate_categories(self):
        self.client.force_authenticate(self.entrepreneur)

        create_response = self.client.post(
            reverse("category-list"),
            {"name": "Technology", "description": "Technology projects"},
            format="json",
        )
        update_response = self.client.patch(
            reverse("category-detail", args=[self.category.pk]),
            {"name": "Changed"},
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(update_response.status_code, status.HTTP_403_FORBIDDEN)
        self.category.refresh_from_db()
        self.assertEqual(self.category.name, "Agriculture")

    def test_staff_user_can_mutate_categories(self):
        self.client.force_authenticate(self.staff)

        response = self.client.post(
            reverse("category-list"),
            {"name": "Technology", "description": "Technology projects"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ProjectCategory.objects.filter(name="Technology").exists())


class ProjectModerationTests(ProjectAPITestCase):
    def test_staff_list_gets_owner_context_without_expanding_the_public_list(self):
        self.project.status = Project.Status.ACTIVE
        self.project.is_verified = True
        self.project.save(update_fields=["status", "is_verified", "updated_at"])

        public_response = self.client.get(reverse("project-list"))
        self.assertEqual(public_response.status_code, status.HTTP_200_OK)
        self.assertNotIn("entrepreneur", public_response.data["results"][0])

        self.client.force_authenticate(self.staff)
        staff_response = self.client.get(reverse("project-list"))
        self.assertEqual(staff_response.status_code, status.HTTP_200_OK)
        owner = staff_response.data["results"][0]["entrepreneur"]
        self.assertEqual(
            set(owner),
            {"id", "email", "full_name", "business_name"},
        )
        self.assertEqual(owner["email"], self.entrepreneur.email)

    def test_owner_cannot_write_moderation_fields_through_normal_update(self):
        self.client.force_authenticate(self.entrepreneur)

        response = self.client.patch(
            reverse("project-detail", args=[self.project.slug]),
            {
                "status": Project.Status.ACTIVE,
                "verification_notes": "Self-approved",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, Project.Status.DRAFT)
        self.assertEqual(self.project.verification_notes, "")

    def test_moderation_actions_are_staff_only(self):
        self.client.force_authenticate(self.entrepreneur)

        reject_response = self.client.post(
            reverse("project-reject", args=[self.project.slug]),
            {"verification_notes": "Rejected"},
            format="json",
        )
        status_response = self.client.post(
            reverse("project-set-status", args=[self.project.slug]),
            {"status": Project.Status.PAUSED},
            format="json",
        )

        self.assertEqual(reject_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(status_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reject_requires_nonblank_notes(self):
        self.client.force_authenticate(self.staff)

        response = self.client.post(
            reverse("project-reject", args=[self.project.slug]),
            {"verification_notes": "   "},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, Project.Status.DRAFT)
        self.assertIsNone(self.project.verified_by)

    def test_staff_can_verify_and_reject_projects_with_an_audit_record(self):
        self.client.force_authenticate(self.staff)

        verify_response = self.client.post(
            reverse("project-verify", args=[self.project.slug]),
            {"verification_notes": "Documents checked"},
            format="json",
        )

        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertTrue(self.project.is_verified)
        self.assertEqual(self.project.status, Project.Status.ACTIVE)
        self.assertEqual(self.project.verified_by, self.staff)
        self.assertIsNotNone(self.project.verified_at)
        self.assertEqual(self.project.verification_notes, "Documents checked")

        reject_response = self.client.post(
            reverse("project-reject", args=[self.project.slug]),
            {"verification_notes": "  Financial evidence is incomplete  "},
            format="json",
        )

        self.assertEqual(reject_response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertFalse(self.project.is_verified)
        self.assertEqual(self.project.status, Project.Status.FAILED)
        self.assertEqual(self.project.verified_by, self.staff)
        self.assertIsNotNone(self.project.verified_at)
        self.assertEqual(
            self.project.verification_notes,
            "Financial evidence is incomplete",
        )

    def test_set_status_supports_operational_states(self):
        self.project.is_verified = True
        self.project.save(update_fields=["is_verified", "updated_at"])
        self.client.force_authenticate(self.staff)

        for project_status in (
            Project.Status.PAUSED,
            Project.Status.ACTIVE,
            Project.Status.CLOSED,
            Project.Status.SUCCESSFUL,
        ):
            with self.subTest(project_status=project_status):
                response = self.client.post(
                    reverse("project-set-status", args=[self.project.slug]),
                    {"status": project_status},
                    format="json",
                )

                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.project.refresh_from_db()
                self.assertEqual(self.project.status, project_status)

    def test_set_status_rejects_activating_an_unverified_project(self):
        self.client.force_authenticate(self.staff)

        response = self.client.post(
            reverse("project-set-status", args=[self.project.slug]),
            {"status": Project.Status.ACTIVE},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, Project.Status.DRAFT)
