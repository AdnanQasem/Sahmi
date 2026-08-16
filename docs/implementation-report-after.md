# Implementation Report (After)

## Repository baseline

- Branch: `feature/backend-messaging-security-hardening`
- Starting SHA: `3b5e42fc0c908ab1571f0dbfb7bbd32df6cf8fcb`
- Existing uncommitted backend work was preserved and completed; `docs/backend-repair-start.patch` was left untouched and uncommitted.

## Completed backend work

- Persistent participant-scoped conversations, detail/list APIs, ordered persistent messages, send/edit/soft-delete, mark-read, per-conversation and total unread counts.
- Persistent owner-scoped notifications, unread counts, one/all mark-read, and notification preferences.
- JWT refresh rotation, blacklist-after-rotation, token blacklist app migrations, and authenticated logout refresh-token blacklisting.
- Audit logging with staff-only read access and recursive sensitive metadata filtering.
- Configurable throttles for login, registration, refresh, password change, conversation creation, message send, notification reads, and administrative verification.
- Server-controlled registration roles, profile roles, investment ownership/status, project reassignment, and funding-total synchronization.
- Public-safe project representations that omit private owner data, documents, and verification notes.
- Email delivery remains disabled and outside scope.

## Completed frontend work

- Replaced `fixtureConversations`, `fixtureMessages`, `recentNotifications`, recorded notification preference saves, hardcoded message previews, and local-only logout.
- Added typed Axios services for messaging and notifications.
- Added React Query loading, error, empty, retry, polling, unread, send, mark-read, and mutation invalidation behavior.
- Active message polling is 5 seconds; notification polling is 30 seconds. This is polling, not SSE or streaming.
- Added duplicate-send prevention, backend logout, cleanup in `finally`, and rotated refresh-token storage.
- Message bodies are rendered as React text; no message content uses `dangerouslySetInnerHTML`.

## Migrations

- `backend/apps/audit/migrations/0001_messaging_notifications_security.py`
- `backend/apps/messaging/migrations/0001_messaging_notifications_security.py`
- `backend/apps/notifications/migrations/0003_messaging_notifications_security.py`

The notification migration uses `RenameField(user -> recipient)` to preserve existing notification ownership data.

## Handoff

The final commit SHA is recorded in the final task response because a commit cannot contain its own SHA.