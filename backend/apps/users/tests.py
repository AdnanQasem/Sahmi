from urllib.parse import parse_qs, urlparse
import base64
import tempfile

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


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

                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                user = User.objects.get(email=f"{user_type}@example.com")
                self.assertEqual(user.user_type, user_type)
                self.assertFalse(user.is_staff)

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
class PasswordResetTests(APITestCase):
    def setUp(self):
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
