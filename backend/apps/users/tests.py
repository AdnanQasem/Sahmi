from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


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

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.user_type, User.UserType.INVESTOR)
        self.assertFalse(user.is_staff)
        self.assertFalse(response.data["is_staff"])

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
