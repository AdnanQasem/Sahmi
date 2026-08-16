from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = (
        "Normalise legacy rows whose ``user_type`` / ``is_staff`` combination is "
        "inconsistent after the security hardening that removed the "
        "``User.save()`` side effect that auto-granted staff status."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print the planned corrections without writing.",
        )

    def handle(self, *args, dry_run=False, **options):
        admin_no_staff_qs = User.objects.filter(
            user_type=User.UserType.ADMIN, is_staff=False
        )
        non_admin_staff_qs = User.objects.exclude(
            user_type=User.UserType.ADMIN
        ).filter(is_staff=True, is_superuser=False)
        application_admin_superusers_qs = User.objects.filter(
            user_type=User.UserType.ADMIN,
            is_superuser=True,
        )

        self.stdout.write("Detected:")
        self.stdout.write(f"  admin role but not staff : {admin_no_staff_qs.count()}")
        self.stdout.write(
            f"  non-admin role but staff  : {non_admin_staff_qs.count()}"
        )
        self.stdout.write(
            f"  app admin is superuser    : {application_admin_superusers_qs.count()}"
        )

        if dry_run:
            for user in admin_no_staff_qs:
                self.stdout.write(
                    f"  would grant is_staff=True  user={user.email}"
                )
            for user in non_admin_staff_qs:
                self.stdout.write(
                    f"  would clear is_staff=False user={user.email}"
                )
            for user in application_admin_superusers_qs:
                self.stdout.write(
                    f"  would clear is_superuser=False user={user.email}"
                )
            return

        for user in admin_no_staff_qs:
            user.is_staff = True
            user.save(update_fields=["is_staff", "updated_at"])
            self.stdout.write(self.style.SUCCESS(
                f"Granted is_staff=True for admin {user.email}"
            ))

        for user in non_admin_staff_qs:
            user.is_staff = False
            user.save(update_fields=["is_staff", "updated_at"])
            self.stdout.write(self.style.WARNING(
                f"Cleared is_staff=False for non-admin {user.email}"
            ))

        for user in application_admin_superusers_qs:
            user.is_superuser = False
            user.is_staff = True
            user.save(update_fields=["is_superuser", "is_staff", "updated_at"])
            self.stdout.write(self.style.WARNING(
                f"Cleared is_superuser=False for application admin {user.email}"
            ))
