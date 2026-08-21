from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from apps.projects.models import Project

from .models import Investment, Milestone, ProjectFundingAccount, WithdrawalRequest


FUNDED_STATUSES = [Investment.Status.CONFIRMED, Investment.Status.COMPLETED]
ZERO = Decimal("0.00")


def _released_total(queryset):
    return queryset.filter(status=WithdrawalRequest.Status.RELEASED).aggregate(
        total=Sum("amount")
    )["total"] or ZERO


@transaction.atomic
def reconcile_project_finances(project_id):
    """Rebuild cached financial totals from immutable transaction records."""
    project = Project.objects.select_for_update().get(pk=project_id)
    funded_investments = project.investments.filter(status__in=FUNDED_STATUSES)
    funded_amount = funded_investments.aggregate(total=Sum("amount"))["total"] or ZERO
    investor_count = funded_investments.values("investor_id").distinct().count()
    next_status = project.status
    project_updates = {}
    if project.status == Project.Status.ACTIVE and funded_amount >= project.goal_amount:
        next_status = Project.Status.SUCCESSFUL
        project_updates.update(deleted_at=None, updated_at=timezone.now())
    elif (
        project.status == Project.Status.SUCCESSFUL
        and not project.funding_finalized_at
        and funded_amount < project.goal_amount
    ):
        next_status = Project.Status.ACTIVE
        project_updates.update(deleted_at=None, updated_at=timezone.now())

    Project.objects.filter(pk=project.pk).update(
        funded_amount=funded_amount,
        investor_count=investor_count,
        status=next_status,
        **project_updates,
    )
    if funded_amount < project.goal_amount:
        project.milestones.filter(status=Milestone.Status.IN_PROGRESS).update(
            status=Milestone.Status.PENDING,
        )

    for milestone in project.milestones.select_for_update():
        released = _released_total(milestone.withdrawal_requests)
        if milestone.funding_released != released:
            Milestone.objects.filter(pk=milestone.pk).update(funding_released=released)

    account = ProjectFundingAccount.objects.select_for_update().filter(project=project).first()
    if account:
        released = _released_total(project.withdrawal_requests)
        if released + account.refunded > funded_amount:
            raise ValueError(
                f"Released and refunded funds exceed confirmed funding for project {project.pk}."
            )
        account.released = released
        account.secured = funded_amount - released - account.refunded
        account.save(update_fields=["secured", "released", "updated_at"])
    elif project.status in {Project.Status.IMPLEMENTATION, Project.Status.CLOSED}:
        released = _released_total(project.withdrawal_requests)
        if released > funded_amount:
            raise ValueError(f"Released funds exceed confirmed funding for project {project.pk}.")
        ProjectFundingAccount.objects.create(
            project=project,
            secured=funded_amount - released,
            released=released,
        )


def audit_funding_integrity():
    """Return every financial cache or allocation inconsistency."""
    issues = []
    for project in Project.objects.all().prefetch_related("milestones"):
        funded_investments = project.investments.filter(status__in=FUNDED_STATUSES)
        funded_amount = funded_investments.aggregate(total=Sum("amount"))["total"] or ZERO
        investor_count = funded_investments.values("investor_id").distinct().count()
        if project.funded_amount != funded_amount:
            issues.append(f"{project.title}: funded amount is {project.funded_amount}, expected {funded_amount}")
        if project.investor_count != investor_count:
            issues.append(f"{project.title}: investor count is {project.investor_count}, expected {investor_count}")
        if project.status == Project.Status.ACTIVE and funded_amount >= project.goal_amount:
            issues.append(f"{project.title}: funding goal reached but status is fundraising")
        if (
            funded_investments.exists()
            and project.deleted_at is not None
            and project.repayment_status != Project.RepaymentStatus.COMPLETED
        ):
            issues.append(f"{project.title}: project was soft deleted before repayment completed")
        if (
            funded_amount < project.goal_amount
            and project.milestones.filter(status=Milestone.Status.IN_PROGRESS).exists()
        ):
            issues.append(f"{project.title}: underfunded project has an in-progress milestone")

        percentage_total = project.milestones.aggregate(
            total=Sum("percentage_of_project")
        )["total"] or ZERO
        if project.milestones.exists() and percentage_total != Decimal("100"):
            issues.append(f"{project.title}: milestone allocations total {percentage_total}%, expected 100%")

        for milestone in project.milestones.all():
            released = _released_total(milestone.withdrawal_requests)
            allocation = (
                funded_amount * milestone.percentage_of_project / Decimal("100")
            ).quantize(Decimal("0.01"))
            if milestone.funding_released != released:
                issues.append(
                    f"{project.title}/{milestone.title}: released cache is "
                    f"{milestone.funding_released}, expected {released}"
                )
            if released > allocation:
                issues.append(
                    f"{project.title}/{milestone.title}: released {released} exceeds allocation {allocation}"
                )

        account = ProjectFundingAccount.objects.filter(project=project).first()
        if account:
            released = _released_total(project.withdrawal_requests)
            if account.released != released:
                issues.append(f"{project.title}: ledger released is {account.released}, expected {released}")
            ledger_total = account.secured + account.released + account.refunded
            if ledger_total != funded_amount:
                issues.append(f"{project.title}: ledger total is {ledger_total}, expected {funded_amount}")
        elif project.status in {Project.Status.IMPLEMENTATION, Project.Status.CLOSED}:
            issues.append(f"{project.title}: implementation project has no funding account")
    return issues


def reconcile_all_project_finances():
    for project_id in Project.objects.values_list("id", flat=True).iterator():
        reconcile_project_finances(project_id)
    return audit_funding_integrity()
