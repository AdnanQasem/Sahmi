from calendar import monthrange
from datetime import date
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.investments.models import Investment, Repayment
from apps.investments.services import (
    repayment_status_for_date,
    sync_project_totals,
    sync_repayment_totals,
)
from apps.projects.models import Project


def add_months(value, months):
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    return value.replace(year=year, month=month, day=min(value.day, monthrange(year, month)[1]))


class Command(BaseCommand):
    help = "Rebuild a completed demo project's per-investment repayment ledger."

    def add_arguments(self, parser):
        parser.add_argument("slug")
        parser.add_argument("--target-funded", required=True, type=Decimal)
        parser.add_argument("--first-date", required=True, type=date.fromisoformat)
        parser.add_argument("--installments", type=int, default=3)
        parser.add_argument(
            "--restore-refunded",
            action="store_true",
            help="Treat existing refunded demo investments as completed investments.",
        )
        parser.add_argument("--confirm", action="store_true")

    @transaction.atomic
    def handle(self, *args, **options):
        if not options["confirm"]:
            raise CommandError("Pass --confirm to rebuild investment and repayment records.")
        if options["target_funded"] <= 0:
            raise CommandError("--target-funded must be greater than zero.")
        if options["installments"] < 1 or options["installments"] > 60:
            raise CommandError("--installments must be between 1 and 60.")

        try:
            project = Project.objects.select_for_update().get(slug=options["slug"])
        except Project.DoesNotExist as exc:
            raise CommandError(f"Project {options['slug']!r} was not found.") from exc
        if project.status != Project.Status.CLOSED:
            raise CommandError("Repayment ledgers can only be rebuilt for completed projects.")
        if project.investments.filter(repayments__status=Repayment.Status.PAID).exists():
            raise CommandError("A project with paid repayment history cannot be rebuilt.")

        statuses = [Investment.Status.CONFIRMED, Investment.Status.COMPLETED]
        if options["restore_refunded"]:
            statuses.append(Investment.Status.REFUNDED)
        investments = list(
            project.investments.select_for_update()
            .filter(status__in=statuses, investor__user_type="investor")
            .order_by("investment_date", "id")
        )
        if not investments:
            raise CommandError("No eligible investments were found.")

        target = options["target_funded"].quantize(Decimal("0.01"))
        current = sum((investment.amount for investment in investments), Decimal("0.00"))
        overflow = current - target
        if overflow < 0:
            raise CommandError(f"Eligible investments total {current}, below the target {target}.")
        if overflow > 0:
            adjustable = max(investments, key=lambda investment: investment.amount)
            adjusted_amount = adjustable.amount - overflow
            if adjusted_amount <= 0:
                raise CommandError("The overfunding cannot be reconciled without removing an investment.")
            adjustable.amount = adjusted_amount.quantize(Decimal("0.01"))

        roi_rate = project.expected_roi / Decimal("100")
        for investment in investments:
            investment.expected_return = (investment.amount * roi_rate).quantize(Decimal("0.01"))
            investment.status = Investment.Status.COMPLETED
            investment.save(update_fields=["amount", "expected_return", "status", "updated_at"])

        Repayment.objects.filter(investment__project=project).delete()
        count = options["installments"]
        first_date = options["first_date"]
        records = []
        for investment in investments:
            obligation_cents = int(((investment.amount + investment.expected_return) * 100).to_integral_value())
            if obligation_cents < count:
                raise CommandError(
                    f"Investment {investment.id} is too small for {count} positive installments."
                )
            base_cents, extra_cents = divmod(obligation_cents, count)
            for index in range(count):
                scheduled_date = add_months(first_date, index)
                records.append(Repayment(
                    investment=investment,
                    amount=Decimal(base_cents + (1 if index < extra_cents else 0)) / Decimal("100"),
                    scheduled_date=scheduled_date,
                    status=repayment_status_for_date(scheduled_date),
                    payment_method=investment.payment_method,
                    notes="Internal per-investor project repayment schedule.",
                ))
        Repayment.objects.bulk_create(records)
        project.goal_amount = target
        project.save(update_fields=["goal_amount", "updated_at"])
        sync_project_totals(project.id)
        totals = sync_repayment_totals(project.id)

        self.stdout.write(self.style.SUCCESS(
            f"Rebuilt {len(records)} repayments across {len(investments)} investments: "
            f"principal={target}, obligation={totals['obligation_total']}."
        ))
