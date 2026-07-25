from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.messaging.models import (
    Conversation,
    ConversationParticipant,
    Message,
)
from apps.messaging.services import (
    edit_message,
    get_or_create_direct_conversation,
    mark_conversation_read,
    send_message,
    soft_delete_message,
    unread_count_for_user,
    unread_counts_by_conversation,
)

User = get_user_model()


class MessagingModelTests(TestCase):
    def setUp(self):
        self.alice = User.objects.create_user(
            username="alice", email="alice@example.com", password="pw-alice-1234", full_name="Alice"
        )
        self.bob = User.objects.create_user(
            username="bob", email="bob@example.com", password="pw-bob-12345", full_name="Bob"
        )

    def test_direct_conversation_is_deduplicated(self):
        first = get_or_create_direct_conversation(self.alice, self.bob)
        second = get_or_create_direct_conversation(self.bob, self.alice)
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(first.kind, Conversation.KIND_DIRECT)
        self.assertEqual(first.participants.count(), 2)

    def test_cannot_create_direct_conversation_with_self_only(self):
        with self.assertRaises(ValueError):
            get_or_create_direct_conversation(self.alice, self.alice)

    def test_messages_persist_in_creation_order(self):
        convo = get_or_create_direct_conversation(self.alice, self.bob)
        m1 = send_message(convo, self.alice, "Hello Bob")
        m2 = send_message(convo, self.bob, "Hi Alice")
        messages = list(convo.messages.order_by("created_at"))
        self.assertEqual([m1, m2], messages)
        self.assertEqual(convo.last_message_at, m2.created_at)

    def test_send_message_rejects_empty_and_oversized_body(self):
        convo = get_or_create_direct_conversation(self.alice, self.bob)
        with self.assertRaises(ValueError):
            send_message(convo, self.alice, "   ")
        long_body = "x" * (Message.MAX_MESSAGE_LENGTH + 1)
        with self.assertRaises(ValueError):
            send_message(convo, self.alice, long_body)

    def test_soft_delete_hides_body(self):
        convo = get_or_create_direct_conversation(self.alice, self.bob)
        msg = send_message(convo, self.alice, "secret")
        self.assertTrue(soft_delete_message(msg, self.alice))
        msg.refresh_from_db()
        self.assertIsNotNone(msg.deleted_at)
        self.assertTrue(msg.is_deleted)

    def test_edit_message_rejects_non_owner(self):
        convo = get_or_create_direct_conversation(self.alice, self.bob)
        msg = send_message(convo, self.alice, "hi")
        with self.assertRaises(PermissionError):
            edit_message(msg, self.bob, "edited")
        with self.assertRaises(ValueError):
            edit_message(msg, self.alice, "   ")

    def test_unread_count_after_send_and_mark_read(self):
        convo = get_or_create_direct_conversation(self.alice, self.bob)
        send_message(convo, self.alice, "hi")
        self.assertEqual(unread_count_for_user(self.bob), 1)
        mark_conversation_read(convo, self.bob)
        self.assertEqual(unread_count_for_user(self.bob), 0)


class MessagingAPITests(TestCase):
    def setUp(self):
        self.alice = User.objects.create_user(
            username="alice", email="alice@example.com", password="pw-alice-1234", full_name="Alice"
        )
        self.bob = User.objects.create_user(
            username="bob", email="bob@example.com", password="pw-bob-12345", full_name="Bob"
        )
        self.outsider = User.objects.create_user(
            username="eve", email="eve@example.com", password="pw-eve-12345", full_name="Eve"
        )
        self.client_alice = APIClient()
        self.client_alice.force_authenticate(self.alice)
        self.client_bob = APIClient()
        self.client_bob.force_authenticate(self.bob)
        self.client_outsider = APIClient()
        self.client_outsider.force_authenticate(self.outsider)

    def _login_via_api(self, email, password):
        client = APIClient()
        resp = client.post("/api/v1/auth/login/", {"email": email, "password": password})
        return resp

    def test_anonymous_cannot_list_conversations(self):
        anon = APIClient()
        resp = anon.get("/api/v1/conversations/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_search_returns_minimal_results_and_excludes_self(self):
        response = self.client_alice.get("/api/v1/conversations/user-search/", {"q": "Bo"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], str(self.bob.id))
        self.assertEqual(response.data[0]["full_name"], "Bob")
        self.assertNotIn("email", response.data[0])

    def test_create_direct_conversation_then_list(self):
        resp = self.client_alice.post(
            "/api/v1/conversations/",
            {"kind": "direct", "other_user_id": str(self.bob.pk)},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        convo_id = resp.data["id"]
        # Both participants should see it.
        for client, who in (
            (self.client_alice, "alice"),
            (self.client_bob, "bob"),
        ):
            list_resp = client.get("/api/v1/conversations/")
            self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
            ids = [c["id"] for c in list_resp.data["results"]]
            self.assertIn(convo_id, ids, f"{who} should see conversation")

    def test_duplicate_direct_conversation_is_idempotent(self):
        r1 = self.client_alice.post(
            "/api/v1/conversations/",
            {"kind": "direct", "other_user_id": str(self.bob.pk)},
            format="json",
        )
        r2 = self.client_bob.post(
            "/api/v1/conversations/",
            {"kind": "direct", "other_user_id": str(self.alice.pk)},
            format="json",
        )
        self.assertEqual(r1.data["id"], r2.data["id"])

    def test_non_participant_cannot_retrieve_conversation(self):
        create = self.client_alice.post(
            "/api/v1/conversations/",
            {"kind": "direct", "other_user_id": str(self.bob.pk)},
            format="json",
        )
        convo_id = create.data["id"]
        outsider_resp = self.client_outsider.get(f"/api/v1/conversations/{convo_id}/")
        self.assertEqual(outsider_resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_non_participant_cannot_list_messages(self):
        create = self.client_alice.post(
            "/api/v1/conversations/",
            {"kind": "direct", "other_user_id": str(self.bob.pk)},
            format="json",
        )
        convo_id = create.data["id"]
        outsider_resp = self.client_outsider.get(
            f"/api/v1/conversations/{convo_id}/messages/"
        )
        self.assertEqual(outsider_resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_send_message_via_api(self):
        create = self.client_alice.post(
            "/api/v1/conversations/",
            {"kind": "direct", "other_user_id": str(self.bob.pk)},
            format="json",
        )
        convo_id = create.data["id"]
        send = self.client_alice.post(
            f"/api/v1/conversations/{convo_id}/messages/",
            {"body": "Hello via API"},
            format="json",
        )
        self.assertEqual(send.status_code, status.HTTP_201_CREATED, send.content[:500])
        self.assertEqual(send.data["body"], "Hello via API")
        self.assertEqual(send.data["sender"]["id"], str(self.alice.pk))
        self.assertNotIn("password", send.data["sender"])

    def test_empty_message_rejected(self):
        create = self.client_alice.post(
            "/api/v1/conversations/",
            {"kind": "direct", "other_user_id": str(self.bob.pk)},
            format="json",
        )
        convo_id = create.data["id"]
        send = self.client_alice.post(
            f"/api/v1/conversations/{convo_id}/messages/",
            {"body": "   "},
            format="json",
        )
        self.assertEqual(send.status_code, status.HTTP_400_BAD_REQUEST)

    def test_sender_cannot_be_spoofed(self):
        create = self.client_alice.post(
            "/api/v1/conversations/",
            {"kind": "direct", "other_user_id": str(self.bob.pk)},
            format="json",
        )
        convo_id = create.data["id"]
        send = self.client_alice.post(
            f"/api/v1/conversations/{convo_id}/messages/",
            {"body": "hello", "sender": str(self.bob.pk)},
            format="json",
        )
        # Edits are not part of the payload; sender is determined by request.user
        self.assertEqual(send.status_code, status.HTTP_201_CREATED)
        self.assertEqual(send.data["sender"]["id"], str(self.alice.pk))

    def test_edit_message_only_by_sender(self):
        create = self.client_alice.post(
            "/api/v1/conversations/",
            {"kind": "direct", "other_user_id": str(self.bob.pk)},
            format="json",
        )
        convo_id = create.data["id"]
        msg = self.client_alice.post(
            f"/api/v1/conversations/{convo_id}/messages/",
            {"body": "original"},
            format="json",
        )
        self.assertEqual(msg.status_code, status.HTTP_201_CREATED)
        msg_id = msg.data["id"]
        # Non-owner tries to edit
        outsider_edit = self.client_bob.patch(
            f"/api/v1/messages/{msg_id}/",
            {"body": "hijacked"},
            format="json",
        )
        self.assertEqual(outsider_edit.status_code, status.HTTP_403_FORBIDDEN)
        # Owner edits successfully
        own_edit = self.client_alice.patch(
            f"/api/v1/messages/{msg_id}/",
            {"body": "edited"},
            format="json",
        )
        self.assertEqual(own_edit.status_code, status.HTTP_200_OK, own_edit.content[:500])
        self.assertEqual(own_edit.data["body"], "edited")
        self.assertIsNotNone(own_edit.data["edited_at"])

    def test_delete_message_only_by_sender(self):
        create = self.client_alice.post(
            "/api/v1/conversations/",
            {"kind": "direct", "other_user_id": str(self.bob.pk)},
            format="json",
        )
        convo_id = create.data["id"]
        msg = self.client_alice.post(
            f"/api/v1/conversations/{convo_id}/messages/",
            {"body": "to delete"},
            format="json",
        )
        msg_id = msg.data["id"]
        outsider_del = self.client_bob.delete(f"/api/v1/messages/{msg_id}/")
        self.assertEqual(outsider_del.status_code, status.HTTP_403_FORBIDDEN)
        own_del = self.client_alice.delete(f"/api/v1/messages/{msg_id}/")
        self.assertEqual(own_del.status_code, status.HTTP_204_NO_CONTENT)

    def test_mark_read_updates_unread_count(self):
        create = self.client_alice.post(
            "/api/v1/conversations/",
            {"kind": "direct", "other_user_id": str(self.bob.pk)},
            format="json",
        )
        convo_id = create.data["id"]
        self.client_alice.post(
            f"/api/v1/conversations/{convo_id}/messages/",
            {"body": "unread"},
            format="json",
        )
        before = self.client_bob.get("/api/v1/conversations/unread-count/")
        self.assertEqual(before.data["unread_count"], 1)
        mark = self.client_bob.post(f"/api/v1/conversations/{convo_id}/mark-read/")
        self.assertEqual(mark.status_code, status.HTTP_200_OK)
        after = self.client_bob.get("/api/v1/conversations/unread-count/")
        self.assertEqual(after.data["unread_count"], 0)


class MessagingSignalTests(TestCase):
    """Notification creation on message send is asserted in apps.notifications.tests."""

    def setUp(self):
        User = get_user_model()
        self.alice = User.objects.create_user(
            username="alice", email="alice@example.com", password="pw-alice-1234", full_name="Alice"
        )
        self.bob = User.objects.create_user(
            username="bob", email="bob@example.com", password="pw-bob-12345", full_name="Bob"
        )

    def test_notification_created_for_recipient_on_send(self):
        from apps.notifications.models import Notification

        convo = get_or_create_direct_conversation(self.alice, self.bob)
        with self.captureOnCommitCallbacks(execute=True):
            send_message(convo, self.alice, "ping")
        count = Notification.objects.filter(
            recipient=self.bob,
            notification_type=Notification.NotificationType.MESSAGE_RECEIVED,
        ).count()
        self.assertEqual(count, 1)
