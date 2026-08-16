from urllib.parse import parse_qs, urlparse
import base64
import tempfile
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import PendingRegistration


User = get_user_model()


class EntrepreneurFinancialDeletionTests(APITestCase):
    def setUp(self):
        from apps.projects.models import ProjectCategory

        self.admin = User.objects.create_user(
            username="deletion-admin",
            email="deletion-admin@example.com",
            full_name="Deletion Admin",
            password="password",
            is_staff=True,
        )
        self.entrepreneur = User.objects.create_user(
            username="deletion-owner",
            email="deletion-owner@example.com",
            full_name="Deletion Owner",
            password="password",
            user_type=User.UserType.ENTREPRENEUR,
        )
        self.investor = User.objects.create_user(
            username="deletion-investor",
            email="deletion-investor@example.com",
            full_name="Deletion Investor",
            password="password",
            user_type=User.UserType.INVESTOR,
        )
        self.category = ProjectCategory.objects.create(
            name="Deletion finance",
            slug="deletion-finance",
        )
        self.client.force_authenticate(self.admin)

    def project(self, *, status_value, slug):
        from apps.projects.models import Project

        return Project.objects.create(
            entrepreneur=self.entrepreneur,
            title=f"Deletion project {slug}",
            slug=slug,
            description="Financial deletion guard test.",
            short_description="Deletion guard",
            category=self.category,
            location="Hebron",
            goal_amount=Decimal("100.00"),
            funded_amount=Decimal("100.00"),
            minimum_investment=Decimal("10.00"),
            expected_roi=Decimal("10.00"),
            is_verified=True,
            status=status_value,
        )

    def delete_entrepreneur(self):
        return self.client.delete(
            reverse("admin-user-detail", args=[self.entrepreneur.pk])
        )

    def test_unfinished_funded_project_requires_investments_to_be_sent_back(self):
        from apps.investments.models import Investment
        from apps.projects.models import Project

        project = self.project(status_value=Project.Status.IMPLEMENTATION, slug="refund-first")
        Investment.objects.create(
            investor=self.investor,
            project=project,
            amount=Decimal("100.00"),
            expected_return=Decimal("10.00"),
            status=Investment.Status.CONFIRMED,
        )

        response = self.delete_entrepreneur()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["detail"],
            "Investments must be sent back before deleting this entrepreneur account.",
        )
        self.assertTrue(User.objects.filter(pk=self.entrepreneur.pk).exists())

    def test_completed_project_requires_full_return_of_investment(self):
        from apps.investments.models import Investment, Repayment
        from apps.projects.models import Project

        project = self.project(status_value=Project.Status.CLOSED, slug="roi-first")
        investment = Investment.objects.create(
            investor=self.investor,
            project=project,
            amount=Decimal("100.00"),
            expected_return=Decimal("10.00"),
            status=Investment.Status.COMPLETED,
        )
        Repayment.objects.create(
            investment=investment,
            amount=Decimal("50.00"),
            scheduled_date="2030-01-01",
            actual_payment_date="2026-08-16",
            status=Repayment.Status.PAID,
        )

        response = self.delete_entrepreneur()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["detail"],
            "Return of investments must be done before deleting this entrepreneur account.",
        )
        self.assertTrue(User.objects.filter(pk=self.entrepreneur.pk).exists())

    def test_admin_can_delete_after_unfinished_investments_are_refunded(self):
        from apps.investments.models import Investment
        from apps.projects.models import Project

        project = self.project(status_value=Project.Status.CANCELLED, slug="refunded")
        Investment.objects.create(
            investor=self.investor,
            project=project,
            amount=Decimal("100.00"),
            expected_return=Decimal("10.00"),
            status=Investment.Status.REFUNDED,
        )

        response = self.delete_entrepreneur()

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.entrepreneur.pk).exists())

    def test_admin_can_delete_after_completed_roi_is_fully_paid(self):
        from apps.investments.models import Investment, Repayment
        from apps.projects.models import Project

        project = self.project(status_value=Project.Status.CLOSED, slug="roi-paid")
        investment = Investment.objects.create(
            investor=self.investor,
            project=project,
            amount=Decimal("100.00"),
            expected_return=Decimal("10.00"),
            status=Investment.Status.COMPLETED,
        )
        Repayment.objects.create(
            investment=investment,
            amount=Decimal("110.00"),
            scheduled_date="2030-01-01",
            actual_payment_date="2026-08-16",
            status=Repayment.Status.PAID,
        )

        response = self.delete_entrepreneur()

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.entrepreneur.pk).exists())


class UserSettingsPersistenceTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="settings@example.com",
            email="settings@example.com",
            full_name="Settings User",
            password="StrongPassword123!",
            user_type=User.UserType.ENTREPRENEUR,
            is_verified=True,
        )
        self.client.force_authenticate(self.user)

    def test_profile_and_entrepreneur_fields_persist(self):
        response = self.client.patch(
            reverse("me"),
            {
                "full_name": "Updated Entrepreneur",
                "phone_number": "+970592286907",
                "city": "Khan Yunis",
                "country": "Palestine",
                "website": "https://example.com",
                "bio": "Local business owner",
                "business_name": "Gaza Solar",
                "business_registration_number": "REG-42",
                "business_established_date": "2024-05-01",
                "business_address": "Hounain Street",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        reloaded = self.client.get(reverse("me"))
        self.assertEqual(reloaded.data["business_name"], "Gaza Solar")
        self.assertEqual(reloaded.data["city"], "Khan Yunis")

    def test_investor_risk_preference_persists(self):
        self.user.user_type = User.UserType.INVESTOR
        self.user.save(update_fields=["user_type"])
        response = self.client.patch(reverse("me"), {"risk_preference": "high"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.risk_preference, User.RiskPreference.HIGH)

    def test_email_change_is_normalized_and_resets_verification(self):
        response = self.client.patch(reverse("me"), {"email": " NewEmail@Example.COM "}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "newemail@example.com")
        self.assertFalse(self.user.is_verified)

    def test_duplicate_email_and_invalid_timezone_are_rejected(self):
        User.objects.create_user(username="other", email="other@example.com", full_name="Other", password="password")
        duplicate = self.client.patch(reverse("me"), {"email": "OTHER@example.com"}, format="json")
        invalid_timezone = self.client.patch(reverse("me"), {"timezone": "Hebron (UTC+2)"}, format="json")
        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(invalid_timezone.status_code, status.HTTP_400_BAD_REQUEST)

    def test_profile_picture_upload_and_removal_persist(self):
        png = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        )
        with tempfile.TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            upload = SimpleUploadedFile("avatar.png", png, content_type="image/png")
            response = self.client.patch(reverse("me"), {"profile_picture": upload}, format="multipart")
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.user.refresh_from_db()
            self.assertTrue(bool(self.user.profile_picture))
            removed = self.client.patch(reverse("me"), {"profile_picture": None}, format="json")
            self.assertEqual(removed.status_code, status.HTTP_200_OK)
            self.user.refresh_from_db()
            self.assertFalse(bool(self.user.profile_picture))

    def test_password_change_checks_current_password_and_persists(self):
        wrong = self.client.post(
            reverse("change-password"),
            {
                "current_password": "WrongPassword123!",
                "new_password": "NewStrongPassword456!",
                "confirm_password": "NewStrongPassword456!",
            },
            format="json",
        )
        self.assertEqual(wrong.status_code, status.HTTP_400_BAD_REQUEST)
        changed = self.client.post(
            reverse("change-password"),
            {
                "current_password": "StrongPassword123!",
                "new_password": "NewStrongPassword456!",
                "confirm_password": "NewStrongPassword456!",
            },
            format="json",
        )
        self.assertEqual(changed.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewStrongPassword456!"))


class AuthenticationPrivilegeTests(APITestCase):
    def registration_payload(self, email, user_type):
        return {
            "email": email,
            "full_name": "Public User",
            "password": "StrongPassword123!",
            "user_type": user_type,
        }

    def test_public_registration_accepts_only_public_account_types(self):
        for user_type in (User.UserType.INVESTOR, User.UserType.ENTREPRENEUR):
            with self.subTest(user_type=user_type):
                response = self.client.post(
                    reverse("register"),
                    self.registration_payload(f"{user_type}@example.com", user_type),
                    format="json",
                )

                self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
                self.assertFalse(User.objects.filter(email=f"{user_type}@example.com").exists())
                registration = PendingRegistration.objects.get(email=f"{user_type}@example.com")
                self.assertEqual(registration.user_type, user_type)

        response = self.client.post(
            reverse("register"),
            self.registration_payload("admin@example.com", User.UserType.ADMIN),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email="admin@example.com").exists())

    def test_me_patch_cannot_promote_a_user(self):
        user = User.objects.create_user(
            email="investor@example.com",
            username="investor",
            full_name="Investor",
            password="password",
            user_type=User.UserType.INVESTOR,
        )
        self.client.force_authenticate(user)

        response = self.client.patch(
            reverse("me"),
            {"user_type": User.UserType.ADMIN, "is_staff": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        user.refresh_from_db()
        self.assertEqual(user.user_type, User.UserType.INVESTOR)
        self.assertFalse(user.is_staff)
        self.assertIn("user_type", response.data)

    def test_me_exposes_staff_flag_for_legitimate_staff(self):
        staff_user = User.objects.create_user(
            email="staff@example.com",
            username="staff",
            full_name="Staff User",
            password="password",
            is_staff=True,
        )
        self.client.force_authenticate(staff_user)

        response = self.client.get(reverse("me"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_staff"])

    def test_user_emails_are_normalized_when_saved(self):
        user = User.objects.create_user(
            email="MixedCase@Example.COM",
            username="mixed-case",
            full_name="Mixed Case",
            password="password",
        )

        self.assertEqual(user.email, "mixedcase@example.com")

    def test_login_accepts_a_legacy_mixed_case_email(self):
        user = User.objects.create_user(
            email="legacyadmin@example.com",
            username="legacy-admin",
            full_name="Legacy Admin",
            password="StrongPassword123!",
            is_staff=True,
        )
        User.objects.filter(pk=user.pk).update(email="LegacyAdmin@Example.com")

        response = self.client.post(
            reverse("login"),
            {
                "email": "legacyadmin@example.com",
                "password": "StrongPassword123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["id"], str(user.pk))

    def test_django_admin_login_is_case_insensitive(self):
        user = User.objects.create_user(
            email="admin@example.com",
            username="django-admin",
            full_name="Django Admin",
            password="StrongPassword123!",
            is_staff=True,
            is_superuser=True,
        )
        User.objects.filter(pk=user.pk).update(email="Admin@Example.com")

        logged_in = self.client.login(
            username="ADMIN@example.COM",
            password="StrongPassword123!",
        )

        self.assertTrue(logged_in)
        response = self.client.get(reverse("admin:index"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

class JWTRotationAndLogoutTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="jwt-user", email="jwt@example.com", full_name="JWT User",
            password="StrongPassword123!",
        )

    def test_refresh_rotation_blacklists_old_token_and_logout_blacklists_new_token(self):
        login = self.client.post(reverse("login"), {"email": self.user.email, "password": "StrongPassword123!"}, format="json")
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        old_refresh = login.data["refresh"]
        rotated = self.client.post(reverse("refresh-token"), {"refresh": old_refresh}, format="json")
        self.assertEqual(rotated.status_code, status.HTTP_200_OK)
        self.assertIn("refresh", rotated.data)
        new_refresh = rotated.data["refresh"]
        self.assertNotEqual(new_refresh, old_refresh)
        rejected_old = self.client.post(reverse("refresh-token"), {"refresh": old_refresh}, format="json")
        self.assertEqual(rejected_old.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {rotated.data['access']}")
        logout = self.client.post(reverse("logout"), {"refresh": new_refresh}, format="json")
        self.assertEqual(logout.status_code, status.HTTP_200_OK)
        rejected_new = self.client.post(reverse("refresh-token"), {"refresh": new_refresh}, format="json")
        self.assertEqual(rejected_new.status_code, status.HTTP_401_UNAUTHORIZED)
class PreferredLanguageTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="language-user",
            email="language@example.com",
            full_name="Language User",
            password="StrongPassword123!",
        )
        self.client.force_authenticate(self.user)

    def test_authenticated_user_can_persist_supported_language(self):
        response = self.client.patch(reverse("me"), {"preferred_language": "ar"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["preferred_language"], "ar")
        self.user.refresh_from_db()
        self.assertEqual(self.user.preferred_language, User.PreferredLanguage.ARABIC)
        self.assertEqual(self.client.get(reverse("me")).data["preferred_language"], "ar")

    def test_invalid_language_is_rejected_without_changing_preference(self):
        response = self.client.patch(reverse("me"), {"preferred_language": "fr"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertEqual(self.user.preferred_language, User.PreferredLanguage.ENGLISH)


class EmailVerificationTests(APITestCase):
    def setUp(self):
        cache.clear()

    def registration_payload(self, email="confirm@example.com"):
        return {
            "email": email,
            "full_name": "Confirmation User",
            "password": "StrongPassword123!",
            "user_type": User.UserType.INVESTOR,
        }

    def test_registration_sends_confirmation_and_link_verifies_email(self):
        response = self.client.post(reverse("register"), self.registration_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertTrue(response.data["email_confirmation_sent"])
        self.assertFalse(User.objects.filter(email="confirm@example.com").exists())
        pending = PendingRegistration.objects.get(email="confirm@example.com")
        self.assertNotEqual(pending.password, "StrongPassword123!")
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["confirm@example.com"])
        verification_url = mail.outbox[0].body.splitlines()[3]
        query = parse_qs(urlparse(verification_url).query)

        verification = self.client.post(
            reverse("verify-email"),
            {"uid": query["uid"][0], "token": query["token"][0]},
            format="json",
        )
        self.assertEqual(verification.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", verification.data)
        self.assertIn("refresh", verification.data)
        user = User.objects.get(email="confirm@example.com")
        self.assertIsNotNone(user.email_verified_at)
        self.assertTrue(user.check_password("StrongPassword123!"))
        self.assertFalse(user.is_verified)
        self.assertFalse(PendingRegistration.objects.filter(email="confirm@example.com").exists())

    def test_invalid_confirmation_token_is_rejected(self):
        self.client.post(reverse("register"), self.registration_payload("invalid@example.com"), format="json")
        verification_url = mail.outbox[0].body.splitlines()[3]
        query = parse_qs(urlparse(verification_url).query)
        response = self.client.post(
            reverse("verify-email"),
            {"uid": query["uid"][0], "token": "invalid-token"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email="invalid@example.com").exists())
        self.assertTrue(PendingRegistration.objects.filter(email="invalid@example.com").exists())

    def test_resend_uses_generic_response_and_sends_for_unconfirmed_account(self):
        self.client.post(reverse("register"), self.registration_payload("resend@example.com"), format="json")
        mail.outbox.clear()
        response = self.client.post(reverse("verify-email-resend"), {"email": "resend@example.com"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        missing = self.client.post(reverse("verify-email-resend"), {"email": "missing@example.com"}, format="json")
        self.assertEqual(missing.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)


class PasswordResetTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            email="reset@example.com",
            username="reset",
            full_name="Reset User",
            password="OldStrongPassword123!",
        )

    def test_request_and_confirm_password_reset(self):
        request_response = self.client.post(
            reverse("password-reset"),
            {"email": self.user.email},
            format="json",
        )
        self.assertEqual(request_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        reset_url = mail.outbox[0].body.splitlines()[3]
        query = parse_qs(urlparse(reset_url).query)

        confirm_response = self.client.post(
            reverse("password-reset-confirm"),
            {
                "uid": query["uid"][0],
                "token": query["token"][0],
                "new_password": "NewStrongPassword456!",
                "confirm_password": "NewStrongPassword456!",
            },
            format="json",
        )

        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewStrongPassword456!"))

        reused = self.client.post(
            reverse("password-reset-confirm"),
            {
                "uid": query["uid"][0],
                "token": query["token"][0],
                "new_password": "AnotherStrongPassword789!",
                "confirm_password": "AnotherStrongPassword789!",
            },
            format="json",
        )
        self.assertEqual(reused.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_email_returns_same_generic_success(self):
        response = self.client.post(
            reverse("password-reset"),
            {"email": "missing@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("debug_reset_url", response.data)
        self.assertEqual(len(mail.outbox), 0)
