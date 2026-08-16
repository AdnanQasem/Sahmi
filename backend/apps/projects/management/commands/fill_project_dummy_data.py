from __future__ import annotations

from datetime import timedelta
from decimal import Decimal, InvalidOperation
from io import BytesIO
from textwrap import wrap

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from PIL import Image, ImageDraw, ImageFont

from apps.investments.models import Milestone
from apps.projects.models import Project, ProjectDocument, ProjectEditRequest, ProjectImage


PLACEHOLDER_TEXT = {
    "test",
    "testing",
    "description",
    "project description",
    "short description",
    "dummy",
}

DUMMY_UPDATE_REVIEW_NOTE = "Approved dummy-data completion for Sahmi development testing."


def _needs_richer_text(value: str | None, minimum_length: int) -> bool:
    normalized = (value or "").strip()
    first_section = normalized.replace("\r", "").split("\n\n", 1)[0].strip().lower()
    return (
        len(normalized) < minimum_length
        or normalized.lower() in PLACEHOLDER_TEXT
        or first_section in PLACEHOLDER_TEXT
        or first_section.startswith("testing ")
    )


def _project_theme(project: Project) -> str:
    category = project.category.name if project.category_id else "local enterprise"
    return f"{project.title} is a community-focused {category.lower()} project in Palestine"


def _description(project: Project) -> str:
    theme = _project_theme(project)
    return (
        f"{theme}. The project will use the requested funding to purchase essential equipment, "
        "prepare the operating site, train the team, and launch reliable services for local customers. "
        "Implementation is divided into measurable milestones so progress, spending evidence, and final "
        "results can be reviewed transparently. This is realistic dummy content intended for Sahmi "
        "development, demonstration, and workflow testing.\n\n"
        "Funding breakdown:\nThe requested amount is allocated across the complete project cost table, "
        "including equipment, preparation, supplies, training, launch activities, and contingency support.\n\n"
        "Risks and challenges:\nPossible supplier delays, price changes, permit timing, transport limits, "
        "and interruptions to local services may affect delivery. The entrepreneur will document changes, "
        "use alternative suppliers where practical, and report material delays through project updates."
    )


def _short_description(project: Project) -> str:
    category = project.category.name.lower() if project.category_id else "business"
    return (
        f"A practical {category} initiative creating useful local services, jobs, and measurable "
        "community impact through milestone-based implementation."
    )[:200]


def _cost_items(goal: Decimal) -> list[dict[str, str]]:
    ratios = [Decimal("0.40"), Decimal("0.20"), Decimal("0.15"), Decimal("0.10")]
    labels = [
        "Core equipment and materials",
        "Site preparation and installation",
        "Initial operating supplies",
        "Training, permits, and launch marketing",
        "Contingency and implementation support",
    ]
    amounts = [(goal * ratio).quantize(Decimal("0.01")) for ratio in ratios]
    amounts.append(goal - sum(amounts, Decimal("0.00")))
    return [
        {
            "name": str(index),
            "description": label,
            "quantity": "1",
            "unit_cost": f"{amount:.2f}",
        }
        for index, (label, amount) in enumerate(zip(labels, amounts), start=1)
    ]


def _cost_table_is_complete(project: Project) -> bool:
    if not isinstance(project.cost_items, list) or not project.cost_items:
        return False
    try:
        total = sum(
            Decimal(str(item["quantity"])) * Decimal(str(item["unit_cost"]))
            for item in project.cost_items
        ).quantize(Decimal("0.01"))
    except (InvalidOperation, KeyError, TypeError, ValueError):
        return False
    return total == project.goal_amount.quantize(Decimal("0.01"))


def _faqs(project: Project) -> list[dict[str, str]]:
    return [
        {
            "question": f"What will {project.title} use the funding for?",
            "answer": (
                "Funding will cover the detailed cost-table items, including equipment, site preparation, "
                "initial supplies, training, and launch expenses."
            ),
        },
        {
            "question": "How will implementation progress be verified?",
            "answer": (
                "Each milestone has dated deliverables. The entrepreneur submits invoices, photographs, "
                "and completion evidence for administrator review before the next stage is unlocked."
            ),
        },
        {
            "question": "When will project operations begin?",
            "answer": (
                "Implementation begins after full funding reconciliation. Operations start after equipment, "
                "site preparation, testing, and final readiness milestones are completed."
            ),
        },
        {
            "question": "What risks could affect the schedule?",
            "answer": (
                "Supplier delays, availability of materials, permit timing, and local operating conditions "
                "may affect dates. Any material delay should be reported through a project update."
            ),
        },
        {
            "question": "Is the displayed financial activity real?",
            "answer": (
                "No. This project content and its attached sample documents are dummy development data used "
                "to test Sahmi's project, funding, review, and milestone interfaces."
            ),
        },
    ]


def _pdf_bytes(title: str, project_title: str) -> bytes:
    safe_title = title.replace("(", "[").replace(")", "]")
    safe_project = project_title.replace("(", "[").replace(")", "]")
    lines = [
        "BT",
        "/F1 18 Tf",
        "72 740 Td",
        f"({safe_title}) Tj",
        "0 -32 Td",
        "/F1 12 Tf",
        f"(Project: {safe_project}) Tj",
        "0 -24 Td",
        "(Dummy development document for Sahmi workflow testing.) Tj",
        "0 -20 Td",
        "(Not a real invoice, registration, forecast, or legal record.) Tj",
        "ET",
    ]
    stream = "\n".join(lines).encode("latin-1", errors="replace")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    output = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(f"{index} 0 obj\n".encode())
        output.extend(obj)
        output.extend(b"\nendobj\n")
    xref_offset = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n".encode())
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode())
    output.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode()
    )
    return bytes(output)


def _image_bytes(project: Project, subtitle: str, color: tuple[int, int, int]) -> bytes:
    image = Image.new("RGB", (1200, 675), color)
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default(size=42)
    small = ImageFont.load_default(size=24)
    draw.rounded_rectangle((70, 70, 1130, 605), radius=32, fill=(255, 255, 255), outline=(220, 230, 230), width=4)
    draw.text((120, 140), project.title, fill=(15, 45, 55), font=font)
    y = 230
    for line in wrap(subtitle, width=48):
        draw.text((120, y), line, fill=(35, 85, 90), font=small)
        y += 42
    draw.text((120, 520), "SAHMI · DUMMY DEVELOPMENT ASSET", fill=(80, 110, 115), font=small)
    buffer = BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    return buffer.getvalue()


class Command(BaseCommand):
    help = (
        "Fill every existing project with realistic dummy user-facing content and assets without "
        "changing investments, funding totals, project status, funding accounts, or milestone progress."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report projects that need dummy data without writing database rows or media files.",
        )

    def handle(self, *args, dry_run=False, **options):
        projects = Project.objects.select_related("category").prefetch_related(
            "milestones", "images", "supporting_documents"
        ).order_by("created_at")
        if not projects.exists():
            self.stdout.write(self.style.WARNING("No projects were found."))
            return

        changed_projects = 0
        for project in projects:
            changes = self._planned_changes(project)
            if dry_run:
                self.stdout.write(f"{project.title}: {', '.join(changes) if changes else 'already complete'}")
                continue
            with transaction.atomic():
                changed = self._fill_project(project)
            changed_projects += int(changed)
            self.stdout.write(
                self.style.SUCCESS(f"{project.title}: populated") if changed
                else f"{project.title}: already complete"
            )

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run only; no data or files were changed."))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"Finished {projects.count()} projects; {changed_projects} received dummy data."
            ))

    def _planned_changes(self, project: Project) -> list[str]:
        changes = []
        for field in (
            "description", "short_description", "location", "location_governorate",
            "faqs", "cover_image", "video_url", "business_plan",
            "financial_projections", "ownership_proof",
        ):
            if not getattr(project, field):
                changes.append(field)
        if _needs_richer_text(project.description, 80):
            changes.append("rich_description")
        if _needs_richer_text(project.short_description, 40):
            changes.append("rich_short_description")
        if not _cost_table_is_complete(project):
            changes.append("cost_items")
        if project.milestones.count() == 0:
            changes.append("milestones")
        if project.images.count() < 2:
            changes.append("gallery_images")
        if project.supporting_documents.count() < 2:
            changes.append("supporting_documents")
        if not project.edit_requests.filter(
            status=ProjectEditRequest.Status.APPROVED,
            review_notes=DUMMY_UPDATE_REVIEW_NOTE,
        ).exists():
            changes.append("approved_update_history")
        return list(dict.fromkeys(changes))

    def _fill_project(self, project: Project) -> bool:
        changed = False
        update_fields = []

        def set_field(field: str, value):
            nonlocal changed
            if getattr(project, field) != value:
                setattr(project, field, value)
                update_fields.append(field)
                changed = True

        if _needs_richer_text(project.description, 80):
            set_field("description", _description(project))
        if _needs_richer_text(project.short_description, 40):
            set_field("short_description", _short_description(project))
        if not project.location:
            set_field("location", "Khan Yunis, Gaza, Palestine")
        if not project.location_governorate:
            set_field("location_governorate", "Gaza")
        if not _cost_table_is_complete(project):
            set_field("cost_items", _cost_items(project.goal_amount))
        if not project.faqs:
            set_field("faqs", _faqs(project))
        if not project.video_url:
            set_field("video_url", "https://www.youtube.com/watch?v=ysz5S6PUM-U")
        if not project.end_date:
            set_field(
                "end_date",
                (project.start_date or timezone.now()) + timedelta(days=project.funding_period_days or 30),
            )
        if project.minimum_investment <= 0 or project.minimum_investment > project.goal_amount:
            set_field("minimum_investment", min(Decimal("100.00"), project.goal_amount))
        if project.expected_roi <= 0:
            set_field("expected_roi", Decimal("12.00"))
        if project.rating <= 0:
            set_field("rating", Decimal("4.50"))
        if project.reviews_count == 0:
            set_field("reviews_count", 8)
        if project.view_count == 0:
            set_field("view_count", 125)
        if project.is_verified and not project.verification_notes:
            set_field("verification_notes", "Verified dummy project record prepared for development testing.")
        if project.is_verified and not project.verified_at:
            set_field("verified_at", timezone.now())

        for field, title in (
            ("business_plan", "Dummy Business Plan"),
            ("financial_projections", "Dummy Financial Projections"),
            ("ownership_proof", "Dummy Ownership Proof"),
        ):
            if not getattr(project, field):
                getattr(project, field).save(
                    f"{project.slug}-{field}.pdf",
                    ContentFile(_pdf_bytes(title, project.title)),
                    save=False,
                )
                update_fields.append(field)
                changed = True

        if not project.cover_image:
            project.cover_image.save(
                f"{project.slug}-dummy-cover.png",
                ContentFile(_image_bytes(project, "Project cover and implementation preview", (222, 242, 237))),
                save=False,
            )
            update_fields.append("cover_image")
            changed = True

        if update_fields:
            project.save(update_fields=[*dict.fromkeys(update_fields), "updated_at"])

        if project.milestones.count() == 0:
            base_date = timezone.localdate()
            milestone_specs = [
                ("Planning and procurement", 30, "Approve suppliers and purchase core equipment."),
                ("Site preparation", 30, "Prepare the location and complete installation work."),
                ("Testing and team training", 25, "Test operations and train the project team."),
                ("Operational launch", 15, "Open the project and submit final launch evidence."),
            ]
            for order, (title, percentage, deliverables) in enumerate(milestone_specs, start=1):
                Milestone.objects.create(
                    project=project,
                    title=title,
                    description=f"Implementation stage {order} for {project.title}.",
                    target_date=base_date + timedelta(days=30 * order),
                    deliverables=deliverables,
                    percentage_of_project=Decimal(str(percentage)),
                    order=order,
                )
            project.milestone_count = 4
            project.save(update_fields=["milestone_count", "updated_at"])
            changed = True
        else:
            milestones_changed = False
            for milestone in project.milestones.order_by("order"):
                fields = []
                if _needs_richer_text(milestone.description, 20):
                    milestone.description = f"Complete and document the {milestone.title} stage for {project.title}."
                    fields.append("description")
                if not milestone.deliverables:
                    milestone.deliverables = f"Invoices, photographs, and completion evidence for {milestone.title}."
                    fields.append("deliverables")
                if fields:
                    milestone.save(update_fields=[*fields, "updated_at"])
                    milestones_changed = True
            actual_count = project.milestones.count()
            if project.milestone_count != actual_count:
                project.milestone_count = actual_count
                project.save(update_fields=["milestone_count", "updated_at"])
                milestones_changed = True
            changed = changed or milestones_changed

        gallery_specs = [
            ("Implementation preview", "Equipment, site preparation, and team implementation preview", (226, 238, 250)),
            ("Community impact", "Expected local services, employment, and community impact", (245, 235, 211)),
        ]
        existing_images = project.images.count()
        for index, (alt, subtitle, color) in enumerate(gallery_specs[existing_images:], start=existing_images + 1):
            image = ProjectImage(project=project, alt_text=f"Dummy {alt.lower()} for {project.title}")
            image.image.save(
                f"{project.slug}-dummy-gallery-{index}.png",
                ContentFile(_image_bytes(project, subtitle, color)),
                save=True,
            )
            changed = True

        supporting_specs = [
            ("Dummy market research", "Dummy Market Research"),
            ("Dummy supplier quotation", "Dummy Supplier Quotation"),
        ]
        existing_titles = set(project.supporting_documents.values_list("title", flat=True))
        for title, heading in supporting_specs:
            if title in existing_titles:
                continue
            document = ProjectDocument(project=project, title=title)
            document.file.save(
                f"{project.slug}-{title.replace(' ', '-')}.pdf",
                ContentFile(_pdf_bytes(heading, project.title)),
                save=True,
            )
            changed = True

        changed = self._ensure_dummy_update_history(project) or changed

        return changed

    def _ensure_dummy_update_history(self, project: Project) -> bool:
        """Backfill one visible, approved diff for fields generated by this command.

        This keeps the public Updates tab representative of the normal approved-edit
        workflow. Only values with an unambiguous dummy-data marker are included.
        """
        if project.edit_requests.filter(
            status=ProjectEditRequest.Status.APPROVED,
            review_notes=DUMMY_UPDATE_REVIEW_NOTE,
        ).exists():
            return False

        reviewer = project.__class__._meta.get_field("entrepreneur").remote_field.model.objects.filter(
            is_staff=True,
            is_active=True,
        ).order_by("date_joined").first()
        if reviewer is None:
            self.stdout.write(self.style.WARNING(
                f"{project.title}: update history skipped because no active staff reviewer exists."
            ))
            return False

        changes = {}
        generated_faqs = any(
            "dummy development data" in str(item.get("answer", "")).lower()
            for item in (project.faqs or [])
            if isinstance(item, dict)
        )
        if generated_faqs:
            changes["location_governorate"] = {"before": "", "after": project.location_governorate}
            changes["faqs"] = {"before": [], "after": project.faqs}
        if project.video_url == "https://www.youtube.com/watch?v=ysz5S6PUM-U":
            changes["video_url"] = {"before": "", "after": project.video_url}

        generated_cost_labels = {
            "Core equipment and materials",
            "Site preparation and installation",
            "Initial operating supplies",
            "Training, permits, and launch marketing",
            "Contingency and implementation support",
        }
        if project.cost_items and {
            str(item.get("description", "")) for item in project.cost_items
        } == generated_cost_labels:
            changes["cost_items"] = {"before": [], "after": project.cost_items}

        generated_milestone_titles = {
            "Planning and procurement",
            "Site preparation",
            "Testing and team training",
            "Operational launch",
        }
        milestones = list(project.milestones.order_by("order"))
        if milestones and {item.title for item in milestones} == generated_milestone_titles:
            changes["milestones"] = {
                "before": [],
                "after": [
                    {
                        "id": str(item.id),
                        "title": item.title,
                        "description": item.description,
                        "target_date": item.target_date.isoformat(),
                        "deliverables": item.deliverables,
                        "percentage_of_project": f"{item.percentage_of_project:.2f}",
                        "order": item.order,
                    }
                    for item in milestones
                ],
            }

        generated_images = [
            {"image": item.image.name, "alt_text": item.alt_text}
            for item in project.images.order_by("created_at")
            if item.alt_text.startswith("Dummy ")
        ]
        if generated_images:
            changes["images"] = {"before": [], "after": generated_images}
        generated_documents = [
            {"title": item.title, "file": item.file.name}
            for item in project.supporting_documents.order_by("created_at")
            if item.title.startswith("Dummy ")
        ]
        if generated_documents:
            changes["supporting_documents"] = {"before": [], "after": generated_documents}
        if project.cover_image and "dummy-cover" in project.cover_image.name:
            changes["cover_image"] = {"before": False, "after": True}

        for field in ("business_plan", "financial_projections", "ownership_proof"):
            file_field = getattr(project, field)
            if not file_field:
                continue
            with file_field.open("rb") as document:
                if b"Dummy " in document.read(1024):
                    changes[field] = {"before": False, "after": True}

        if not changes:
            return False
        ProjectEditRequest.objects.create(
            project=project,
            submitted_by=project.entrepreneur,
            payload={field: values["after"] for field, values in changes.items()},
            changes=changes,
            status=ProjectEditRequest.Status.APPROVED,
            review_notes=DUMMY_UPDATE_REVIEW_NOTE,
            reviewed_by=reviewer,
            reviewed_at=timezone.now(),
        )
        return True
