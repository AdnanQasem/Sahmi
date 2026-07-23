from rest_framework.test import APITestCase

class AuditAccessAndSanitisationTests(APITestCase):
    def setUp(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        self.user = User.objects.create_user(username="audit-user", email="audit@example.com", full_name="Audit User", password="password")
        self.staff = User.objects.create_user(username="audit-staff", email="staff-audit@example.com", full_name="Audit Staff", password="password", is_staff=True)

    def test_ordinary_users_cannot_read_or_modify_audit_records(self):
        from apps.audit.services import log
        record = log(action="test.action", actor=self.user)
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get("/api/v1/audit-logs/").status_code, 403)
        self.assertEqual(self.client.patch(f"/api/v1/audit-logs/{record.id}/", {"action": "changed"}, format="json").status_code, 403)
        self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.get("/api/v1/audit-logs/").status_code, 200)
        self.assertEqual(self.client.patch(f"/api/v1/audit-logs/{record.id}/", {"action": "changed"}, format="json").status_code, 405)

    def test_sensitive_metadata_is_removed_recursively(self):
        from apps.audit.services import log
        record = log(action="safe", metadata={"token": "secret", "nested": {"password": "bad", "ok": "value"}, "body": "private message"})
        self.assertEqual(record.metadata, {"nested": {"ok": "value"}})