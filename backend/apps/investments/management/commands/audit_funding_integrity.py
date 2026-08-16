from django.core.management.base import BaseCommand, CommandError

from apps.investments.integrity import (
    audit_funding_integrity,
    reconcile_all_project_finances,
)


class Command(BaseCommand):
    help = "Audit cached project, milestone, and funding-ledger totals."

    def add_arguments(self, parser):
        parser.add_argument(
            "--repair",
            action="store_true",
            help="Rebuild cached totals from confirmed investments and released withdrawals.",
        )

    def handle(self, *args, **options):
        issues = (
            reconcile_all_project_finances()
            if options["repair"]
            else audit_funding_integrity()
        )
        if issues:
            for issue in issues:
                self.stderr.write(self.style.ERROR(issue))
            raise CommandError(f"Funding integrity audit found {len(issues)} issue(s).")
        action = "repaired and verified" if options["repair"] else "verified"
        self.stdout.write(self.style.SUCCESS(f"Funding integrity {action}: no issues found."))
