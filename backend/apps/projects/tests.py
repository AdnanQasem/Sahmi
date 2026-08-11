import json
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.investments.models import Milestone

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


class ProjectCostTableTests(ProjectAPITestCase):
    def project_payload(self, **overrides):
        payload = {
            "title": "Solar Workshop",
            "description": "A solar equipment workshop.",
            "short_description": "Solar workshop",
            "category": str(self.category.pk),
            "location": "Ramallah",
            "goal_amount": "10000.00",
            "minimum_investment": "100.00",
            "expected_roi": "10.00",
            "funding_period_days": 30,
            "cost_items": [
                {
                    "name": "Equipment",
                    "description": "Workshop equipment",
                    "quantity": "2",
                    "unit_cost": "4000",
                },
                {
                    "name": "Initial materials",
                    "description": "Opening inventory",
                    "quantity": "1",
                    "unit_cost": "2000",
                },
            ],
            "milestones": [
                {
                    "title": "Workshop launch",
                    "description": "Install equipment and open the workshop.",
                    "target_date": "2027-02-01",
                    "deliverables": "Operational workshop",
                    "percentage_of_project": "100.00",
                    "order": 99,
                }
            ],
        }
        payload.update(overrides)
        return payload

    def test_entrepreneur_can_create_project_with_normalized_cost_table(self):
        self.client.force_authenticate(self.entrepreneur)

        response = self.client.post(
            reverse("project-list"),
            self.project_payload(),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["cost_items"][0]["name"], "1")
        self.assertEqual(response.data["cost_items"][0]["quantity"], "2")
        self.assertEqual(response.data["cost_items"][0]["unit_cost"], "4000.00")
        created = Project.objects.get(slug="solar-workshop")
        self.assertEqual(created.cost_items, response.data["cost_items"])
        self.assertEqual(created.milestone_count, 1)
        milestone = created.milestones.get()
        self.assertEqual(milestone.order, 1)
        self.assertEqual(milestone.status, Milestone.Status.PENDING)
        self.assertEqual(milestone.funding_released, Decimal("0.00"))

    def test_multipart_creation_accepts_json_encoded_cost_table(self):
        self.client.force_authenticate(self.entrepreneur)
        payload = self.project_payload(title="Multipart Costs")
        payload["cost_items"] = json.dumps(payload["cost_items"])
        payload["milestones"] = json.dumps(payload["milestones"])

        response = self.client.post(reverse("project-list"), payload, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["cost_items"][1]["name"], "2")
        self.assertEqual(response.data["cost_items"][1]["description"], "Opening inventory")
        self.assertEqual(response.data["milestones"][0]["title"], "Workshop launch")

    def test_anonymous_and_non_entrepreneur_users_cannot_create_costed_projects(self):
        anonymous_response = self.client.post(
            reverse("project-list"),
            self.project_payload(),
            format="json",
        )
        investor = User.objects.create_user(
            email="investor-project@example.com",
            username="investor-project",
            password="password",
            user_type=User.UserType.INVESTOR,
        )
        self.client.force_authenticate(investor)
        investor_response = self.client.post(
            reverse("project-list"),
            self.project_payload(title="Investor Project"),
            format="json",
        )

        self.assertEqual(anonymous_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(investor_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cross_user_cannot_replace_project_cost_table(self):
        self.project.cost_items = self.project_payload()["cost_items"]
        self.project.save(update_fields=["cost_items", "updated_at"])
        other_owner = User.objects.create_user(
            email="other-owner@example.com",
            username="other-owner",
            password="password",
            user_type=User.UserType.ENTREPRENEUR,
        )
        self.client.force_authenticate(other_owner)

        response = self.client.patch(
            reverse("project-detail", args=[self.project.slug]),
            {"cost_items": [{"name": "Tampered", "description": "", "quantity": "1", "unit_cost": "10000"}]},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.project.refresh_from_db()
        self.assertEqual(self.project.cost_items[0]["name"], "Equipment")

    def test_rejects_missing_zero_mismatched_and_oversized_cost_tables(self):
        self.client.force_authenticate(self.entrepreneur)
        invalid_tables = {
            "missing": None,
            "zero quantity": [
                {"name": "ignored", "description": "Equipment", "quantity": "0", "unit_cost": "10000"}
            ],
            "fractional quantity": [
                {"name": "ignored", "description": "Equipment", "quantity": "1.5", "unit_cost": "10000"}
            ],
            "missing description": [
                {"name": "ignored", "description": "", "quantity": "1", "unit_cost": "10000"}
            ],
            "unbounded numeric input": [
                {"name": "ignored", "description": "Equipment", "quantity": "1e999999", "unit_cost": "10000"}
            ],
            "mismatched total": [
                {"name": "ignored", "description": "Equipment", "quantity": "1", "unit_cost": "9999"}
            ],
            "more than fifty rows": [
                {"name": f"Item {index}", "description": "", "quantity": "1", "unit_cost": "200"}
                for index in range(51)
            ],
        }

        for label, cost_items in invalid_tables.items():
            with self.subTest(label=label):
                payload = self.project_payload(title=f"Invalid {label}")
                if cost_items is None:
                    payload.pop("cost_items")
                else:
                    payload["cost_items"] = cost_items
                response = self.client.post(reverse("project-list"), payload, format="json")
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn("cost_items", response.data)

    def test_owner_can_replace_cost_table_when_total_matches_goal(self):
        self.project.cost_items = [
            {"name": "Original", "description": "", "quantity": "1.00", "unit_cost": "10000.00"}
        ]
        self.project.save(update_fields=["cost_items", "updated_at"])
        self.client.force_authenticate(self.entrepreneur)

        response = self.client.patch(
            reverse("project-detail", args=[self.project.slug]),
            {
                "cost_items": [
                    {"name": "Equipment", "description": "Machinery", "quantity": "2", "unit_cost": "3000"},
                    {"name": "Materials", "description": "Inventory", "quantity": "1", "unit_cost": "4000"},
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.project.refresh_from_db()
        self.assertEqual([item["name"] for item in self.project.cost_items], ["1", "2"])

    def test_public_detail_exposes_cost_table_but_legacy_project_remains_editable(self):
        self.client.force_authenticate(self.entrepreneur)
        update_response = self.client.patch(
            reverse("project-detail", args=[self.project.slug]),
            {"short_description": "Updated legacy description"},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK, update_response.data)

        self.project.cost_items = [
            {"name": "Equipment", "description": "", "quantity": "1.00", "unit_cost": "10000.00"}
        ]
        self.project.status = Project.Status.ACTIVE
        self.project.is_verified = True
        self.project.save(update_fields=["cost_items", "status", "is_verified", "updated_at"])
        self.client.force_authenticate(user=None)

        public_response = self.client.get(reverse("project-detail", args=[self.project.slug]))

        self.assertEqual(public_response.status_code, status.HTTP_200_OK)
        self.assertEqual(public_response.data["cost_items"][0]["name"], "Equipment")

    def test_rejects_invalid_timeline_without_creating_a_partial_project(self):
        self.client.force_authenticate(self.entrepreneur)
        invalid_timelines = {
            "missing": None,
            "percentage mismatch": [
                {
                    "title": "Launch",
                    "description": "Launch the workshop",
                    "target_date": "2027-02-01",
                    "deliverables": "Workshop",
                    "percentage_of_project": "90",
                }
            ],
            "past target": [
                {
                    "title": "Launch",
                    "description": "Launch the workshop",
                    "target_date": "2020-01-01",
                    "deliverables": "Workshop",
                    "percentage_of_project": "100",
                }
            ],
            "unordered dates": [
                {
                    "title": "Later",
                    "description": "Later stage",
                    "target_date": "2027-05-01",
                    "deliverables": "Later output",
                    "percentage_of_project": "50",
                },
                {
                    "title": "Earlier",
                    "description": "Earlier stage",
                    "target_date": "2027-03-01",
                    "deliverables": "Earlier output",
                    "percentage_of_project": "50",
                },
            ],
        }

        for label, milestones in invalid_timelines.items():
            with self.subTest(label=label):
                title = f"Invalid timeline {label}"
                payload = self.project_payload(title=title)
                if milestones is None:
                    payload.pop("milestones")
                else:
                    payload["milestones"] = milestones
                response = self.client.post(reverse("project-list"), payload, format="json")
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn("milestones", response.data)
                self.assertFalse(Project.objects.filter(title=title).exists())

    def test_owner_timeline_edit_preserves_server_controlled_progress(self):
        milestone = Milestone.objects.create(
            project=self.project,
            title="Original stage",
            description="Original description",
            target_date="2027-02-01",
            percentage_of_project=Decimal("100.00"),
            status=Milestone.Status.IN_PROGRESS,
            funding_released=Decimal("500.00"),
            order=1,
        )
        self.client.force_authenticate(self.entrepreneur)

        response = self.client.patch(
            reverse("project-detail", args=[self.project.slug]),
            {
                "milestones": [
                    {
                        "id": str(milestone.id),
                        "title": "Updated stage",
                        "description": "Updated plan",
                        "target_date": "2027-03-01",
                        "deliverables": "Updated deliverable",
                        "percentage_of_project": "100",
                        "status": Milestone.Status.COMPLETED,
                        "funding_released": "9999",
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        milestone.refresh_from_db()
        self.assertEqual(milestone.title, "Updated stage")
        self.assertEqual(milestone.status, Milestone.Status.IN_PROGRESS)
        self.assertEqual(milestone.funding_released, Decimal("500.00"))

    def test_project_edit_cannot_remove_a_started_milestone_and_rolls_back(self):
        Milestone.objects.create(
            project=self.project,
            title="Started stage",
            description="Work started",
            target_date="2027-02-01",
            percentage_of_project=Decimal("100.00"),
            status=Milestone.Status.IN_PROGRESS,
            order=1,
        )
        original_title = self.project.title
        self.client.force_authenticate(self.entrepreneur)

        response = self.client.patch(
            reverse("project-detail", args=[self.project.slug]),
            {
                "title": "Should roll back",
                "milestones": [
                    {
                        "title": "Replacement",
                        "description": "Replacement stage",
                        "target_date": "2027-04-01",
                        "deliverables": "Replacement output",
                        "percentage_of_project": "100",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.project.refresh_from_db()
        self.assertEqual(self.project.title, original_title)
        self.assertEqual(self.project.milestones.count(), 1)


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

class PublicProjectPrivacyTests(ProjectAPITestCase):
    def test_public_detail_omits_private_owner_and_document_fields(self):
        self.project.status = Project.Status.ACTIVE
        self.project.is_verified = True
        self.project.verification_notes = "internal review"
        self.project.business_plan.name = "project-documents/private-plan.pdf"
        self.project.save()
        response = self.client.get(reverse("project-detail", args=[self.project.slug]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for field in ("verification_notes", "business_plan", "financial_projections", "ownership_proof", "supporting_documents"):
            self.assertNotIn(field, response.data)
        self.assertNotIn("email", response.data["entrepreneur"])
        self.assertNotIn("phone_number", response.data["entrepreneur"])
        self.assertNotIn("kyc_document", response.data["entrepreneur"])
