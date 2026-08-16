import tempfile
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, override_settings
from PIL import Image

from apps.investments.models import Milestone

from .models import Project, ProjectCategory


User = get_user_model()


class FillProjectDummyDataCommandTests(TestCase):
    def setUp(self):
        self.media_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.media_directory.cleanup)
        self.settings_override = override_settings(MEDIA_ROOT=self.media_directory.name)
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)

        entrepreneur = User.objects.create_user(
            email="dummy-owner@example.com",
            username="dummy-owner",
            full_name="Dummy Project Owner",
            password="password",
            user_type=User.UserType.ENTREPRENEUR,
        )
        self.staff = User.objects.create_user(
            email="dummy-admin@example.com",
            username="dummy-admin",
            full_name="Dummy Administrator",
            password="password",
            user_type=User.UserType.ADMIN,
            is_staff=True,
        )
        category = ProjectCategory.objects.create(name="Energy", slug="energy")
        self.project = Project.objects.create(
            entrepreneur=entrepreneur,
            title="Project Kept Intact",
            slug="project-kept-intact",
            description="test",
            short_description="test",
            category=category,
            location="",
            goal_amount=Decimal("12345.67"),
            funded_amount=Decimal("4321.00"),
            minimum_investment=Decimal("0.00"),
            status=Project.Status.ACTIVE,
        )

    def test_command_fills_all_missing_demo_fields_and_is_idempotent(self):
        call_command("fill_project_dummy_data", verbosity=0)
        self.project.refresh_from_db()

        self.assertEqual(self.project.title, "Project Kept Intact")
        self.assertEqual(self.project.status, Project.Status.ACTIVE)
        self.assertEqual(self.project.funded_amount, Decimal("4321.00"))
        self.assertGreaterEqual(len(self.project.description), 80)
        self.assertGreaterEqual(len(self.project.short_description), 40)
        self.assertTrue(self.project.location)
        self.assertTrue(self.project.location_governorate)
        self.assertEqual(len(self.project.faqs), 5)
        self.assertTrue(self.project.video_url)
        self.assertTrue(self.project.cover_image)
        self.assertTrue(self.project.business_plan)
        self.assertTrue(self.project.financial_projections)
        self.assertTrue(self.project.ownership_proof)

        cost_total = sum(
            Decimal(str(item["quantity"])) * Decimal(str(item["unit_cost"]))
            for item in self.project.cost_items
        )
        self.assertEqual(cost_total, self.project.goal_amount)

        milestones = Milestone.objects.filter(project=self.project)
        self.assertEqual(milestones.count(), 4)
        self.assertEqual(
            sum((item.percentage_of_project for item in milestones), Decimal("0.00")),
            Decimal("100.00"),
        )
        self.assertEqual(self.project.images.count(), 2)
        self.assertEqual(self.project.supporting_documents.count(), 2)
        approved_update = self.project.edit_requests.get(status="approved")
        self.assertEqual(approved_update.reviewed_by, self.staff)
        self.assertIn("cost_items", approved_update.changes)
        self.assertIn("milestones", approved_update.changes)
        self.assertEqual(approved_update.changes["cost_items"]["before"], [])
        self.assertEqual(approved_update.changes["cost_items"]["after"], self.project.cost_items)

        with Image.open(self.project.cover_image.path) as image:
            image.verify()
        for field_name in ("business_plan", "financial_projections", "ownership_proof"):
            with getattr(self.project, field_name).open("rb") as document:
                self.assertEqual(document.read(5), b"%PDF-")

        initial_counts = (
            milestones.count(),
            self.project.images.count(),
            self.project.supporting_documents.count(),
            self.project.edit_requests.count(),
        )
        call_command("fill_project_dummy_data", verbosity=0)
        self.assertEqual(
            (
                Milestone.objects.filter(project=self.project).count(),
                self.project.images.count(),
                self.project.supporting_documents.count(),
                self.project.edit_requests.count(),
            ),
            initial_counts,
        )

    def test_dry_run_does_not_change_project(self):
        call_command("fill_project_dummy_data", dry_run=True, verbosity=0)
        self.project.refresh_from_db()

        self.assertEqual(self.project.description, "test")
        self.assertFalse(self.project.cover_image)
        self.assertEqual(self.project.milestones.count(), 0)
        self.assertEqual(self.project.images.count(), 0)
        self.assertEqual(self.project.supporting_documents.count(), 0)
