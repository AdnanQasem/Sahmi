# Implementation Audit — Before

> This report describes the state of the Sahmi repository at the moment work began
> on the `feature/backend-messaging-security-hardening` branch. It was produced by
> direct inspection of the files; no claims are made beyond what is visible in the
> tree.

## 0. Starting state

- **Starting branch:** `main`
- **Starting HEAD commit:** `270f823ea6d5bf36dd91a1a4d6798fa67246aa00`
- **HEAD commit subject:** `Lateststst`
- **Work branch created from clean HEAD:** `feature/backend-messaging-security-hardening`

### 0.1 Working-tree state at branch creation

At the moment the branch was created, the working tree contained a substantial set
of **uncommitted changes that were already present before this task started**.
These were carried forward onto the new branch unchanged, because their provenance
could not be verified within this session. They are reported honestly here so that
later commits do not attribute pre-existing authorship to this task.

**Modified tracked files (uncommitted, pre-existing):**

| File | Approx. delta |
|------|----|
| `README.md` | +12 |
| `backend/apps/investments/permissions.py` | +20 |
| `backend/apps/investments/views.py` | +44 |
| `backend/apps/projects/permissions.py` | +14 |
| `backend/apps/projects/serializers.py` | +59 |
| `backend/apps/projects/views.py` | +45 |
| `backend/apps/users/models.py` | +2 |
| `backend/apps/users/serializers.py` | +31 |
| `backend/config/settings/base.py` | +3 |
| `backend/config/urls.py` | +1 |
| `src/App.tsx` | +19 |
| `src/components/ProtectedRoute.tsx` | +7 |
| `src/components/dashboard/StatusBadge.tsx` | +27 |
| `src/pages/EditProject.tsx` | +11 |
| `src/pages/dashboard/DashboardLayout.tsx` | +56 |
| `src/pages/dashboard/DashboardRedirect.tsx` | +8 |
| `src/services/authService.ts` | +1 |
| `src/services/projectsService.ts` | +52 |

**Untracked files (pre-existing):**

- `backend/apps/core/admin_urls.py`, `backend/apps/core/tests.py`
- `backend/apps/investments/admin_serializers.py`, `backend/apps/investments/admin_views.py`
- `backend/apps/projects/admin_serializers.py`, `backend/apps/projects/admin_views.py`, `backend/apps/projects/tests.py`
- `backend/apps/users/admin_serializers.py`, `backend/apps/users/admin_views.py`, `backend/apps/users/backends.py`, `backend/apps/users/tests.py`
- `src/components/admin/`
- `src/pages/dashboard/AdminDashboard.tsx`
- `src/pages/dashboard/admin/`
- `src/services/adminFinanceService.ts`, `src/services/adminProjectsService.ts`, `src/services/adminUsersService.ts`
- `src/test/admin-access.test.tsx`

These already partially implement later phases (admin endpoints, public role
restriction, admin project moderation UI, admin role tests). They are reused as
the foundation where possible; this task does **not** claim to have authored them.
All remaining phases below describe the state at the moment work began, including
what these pre-existing changes already did.

### 0.2 Baseline command results (recorded before any change)

| Check | Command | Exit | Result |
|------|------|----|------|
| Backend | `python manage.py check` (settings `dev`) | 0 | No issues |
| Backend | `python manage.py makemigrations --check --dry-run` | 0 | No changes detected (migrations consistent) |
| Backend | `python manage.py test` (settings `test`, in-memory SQLite) | 0 | 29 tests, OK |
| Frontend | `npx tsc --noEmit` | 0 | OK |
| Frontend | `npm run test` (vitest) | 0 | 4 tests pass (`example.test.ts` ×1, `admin-access.test.tsx` ×3) |

The Python virtualenv at `venv/` was empty at this point in the session. To run
the backend checks above, the project's `backend/requirements.txt` was installed
into the existing venv with one adjustment: `Pillow 10.4` does not provide a
prebuilt wheel for Python 3.14 (the only Python available here), so
`Pillow>=11.0,<14` was installed instead. No requirements file was modified.

## 1. Backend apps and models

- Apps: `apps.core`, `apps.users`, `apps.projects`, `apps.investments`,
  `apps.notifications`. (see `backend/config/settings/base.py`)
- Base abstract model `UUIDTimestampModel` (`apps/core/models.py`): UUID PK,
  `created_at`, `updated_at`.
- Custom `User` model (`apps/users/models.py`) extends `AbstractUser`; uses
  `email` as `USERNAME_FIELD`. Custom fields: `user_type`, `full_name`,
  `phone_number`, `profile_picture`, `bio`, `country`, `city`, `is_verified`,
  `is_kyc_verified`, `kyc_document`, `kyc_verified_at`, `investor_tier`,
  `total_invested`, `total_returned`, `average_roi`, `risk_preference`,
  `business_name`, `business_registration_number`,
  `business_established_date`, `business_address`, `total_funded`,
  `total_repaid`, `reputation_score`.
- `User.save()` side effect (line 58-59): **if `user_type == ADMIN`, force
  `is_staff = True`**. There is no inverse: setting `user_type=investor` does not
  clear `is_staff`.
- Project apps define `ProjectCategory`, `Project`, `ProjectImage`,
  `ProjectDocument`.
- Investments app defines `Investment`, `Milestone`, `Repayment`.

## 2. Current User model — security posture

- Public `UserSerializer` exposes `user_type`, `is_staff` in `fields`, but the
  pre-existing changes add them to `read_only_fields` — so `PATCH
  /api/v1/auth/me/` cannot change them at the serializer layer.
- `RegisterSerializer.validate_user_type` (added by the pre-existing changes)
  rejects `admin` registrations, allowing only `investor`/`entrepreneur`.
- However, `User.save()` still forces `is_staff=True` whenever `user_type`
  becomes `ADMIN` via any other code path. That is a residual privilege-escalation
  surface (Phase 8 must address it).
- `is_superuser`, `groups`, `user_permissions` are not exposed by the public
  `UserSerializer`.
- `AdminUserSerializer` (apps/users/admin_serializers.py, pre-existing,
  staff-only) is the intended server-controlled channel for role changes.

## 3. Authentication serializers and views

- `RegisterView` (`AllowAny`) returns JWT pair + user (`apps/users/views.py:17-26`).
- `LoginView` (`AllowAny`) uses `EmailTokenObtainPairSerializer` which lowercases
  the email and looks up the stored email case-insensitively (pre-existing change
  in `apps/users/serializers.py`).
- `RefreshTokenView` (`AllowAny`) — plain SimpleJWT refresh, no rotation, no
  blacklist.
- `MeView` (`IsAuthenticated`) — GET/PATCH for current user.
- `ChangePasswordView` (`IsAuthenticated`) — `current_password`+`new_password`+
  `confirm_password`; calls `update_session_auth_hash`.

## 4. JWT configuration

`backend/config/settings/base.py:113-116`:

```
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}
```

Missing for Phase 11:

- No `ROTATE_REFRESH_TOKENS=True`.
- No `BLACKLIST_AFTER_ROTATION=True`.
- No `rest_framework_simplejwt.token_blacklist` in `INSTALLED_APPS`.
- No blacklist migrations present.

## 5. Current logout behavior

- `authService.logout()` (`src/services/authService.ts:63-67`) only removes
  `accessToken`, `refreshToken`, `user` from `localStorage`.
- **No backend logout endpoint exists** — the refresh token remains valid for 7
  days after logout. This is a Phase 11 blocker.
- Frontend `api.ts` interceptor clears tokens on a 401 refresh failure and
  redirects to `/login`, but does not call a backend logout.

## 6. Permission classes

- DRF default: `IsAuthenticatedOrReadOnly` (base.py:100). Nearly every viewset
  overrides this.
- `apps/projects/permissions.py`: `IsEntrepreneur`, `IsStaffOrReadOnly`,
  `ProjectPermission`. **`ProjectPermission.has_object_permission` returns True
  for every SAFE method regardless of `status` or `is_verified`** — this is the
  documented "unverified project detail visibility" gap (Phase 9 must address).
- `apps/investments/permissions.py`: `InvestmentPermission`,
  `MilestonePermission`, `RepaymentPermission`. Already enforce
  investor/entrepreneur ownership per object.
- `apps/core/permissions.py`: `IsOwnerOrAdminOrReadOnly` — dead code (no imports
  anywhere).
- Staff/admin endpoints use DRF's `IsAdminUser` (`is_staff==True`).

## 7. Project serializers and views

- Public `ProjectSerializer` marks `status`, `is_verified`, `verified_at`,
  `verification_notes`, `ai_*`, `funded_amount`, `investor_count` read-only.
  `_detail` nested serializers (`ProjectImageSerializer`,
  `ProjectDocumentSerializer`) are read-only but their `file` URLs are still
  returned by `GET /api/v1/projects/{slug}/`.
- `ProjectViewSet` exposes `@action verify`, `reject`, `set-status`
  (`IsAdminUser`), `my` (`IsAuthenticated`), `payments` (`AllowAny`), and `events`
  (SSE, `AllowAny`). The `events` action opens a `redis` client inline; with no
  Redis it yields an `error` event and prints to stdout.
- `AdminProjectViewSet` (untracked `apps/projects/admin_views.py`) mirrors the
  moderation actions behind `IsAdminUser`.

## 8. Investment serializers and views

- `InvestmentSerializer` (pre-existing change removed `status` write access? to
  verify). Read_only list: `id`, `investor`, `investment_date`,
  `expected_return`, `actual_return`, `return_received_at`, `created_at`,
  `updated_at`. **Before this task, `status` was writable** — an investor could
  confirm their own investment with no payment. The pre-existing uncommitted
  diff to `backend/apps/investments/views.py` and `permissions.py` may already
  narrow this; I will re-verify at implementation time and ensure server
  control per Phase 9.
- `InvestmentViewSet.perform_create` sets `investor = request.user` — but no
  role check, so an entrepreneur can create an investment in their own name.
- `Investment.save()` auto-computes `expected_return` only when it is zero;
  editing the project's `expected_roi` does not recompute existing investments.
- `Investment` signals (`apps/investments/signals.py`): on
  `post_save`/`post_delete`, recalculate project's `funded_amount` and
  `investor_count` via `transaction.on_commit`. Reassignment is handled
  (recompute totals for both old and new projects).

## 9. Category, milestone, and repayment permissions

- Categories: `IsStaffOrReadOnly` — public read, staff-only mutation. No
  object-level ownership. Admin deletion returns 409 on `ProtectedError`.
- Milestones: `MilestonePermission` — `is_staff` or project.entrepreneur.
  Investors cannot read milestones at all (consistent with viewset queryset).
- Repayments: `RepaymentPermission` — investor or entrepreneur of the related
  investment, plus staff. **Status and `actual_payment_date` are writable by
  the investor** — Phase 9 must server-control these.

## 10. Existing Notification model

`apps/notifications/models.py:7-14`:

```
class Notification(UUIDTimestampModel):
    user = FK(settings.AUTH_USER_MODEL)
    title = CharField(max_length=120)
    body = TextField()
    read_at = DateTimeField(blank=True, null=True)
    class Meta: ordering = ["-created_at"]
```

Issues for Phase 4:

- No `notification_type` enum.
- No `actor` (who triggered it).
- No related-object reference (project/investment/conversation id).
- No `delivery_status`.
- **No views, serializers, or urls.py exist.** `apps/notifications/` contains
  only `models.py`, `tasks.py`, `apps.py`, `__init__.py`, plus two migrations
  (`0001_initial.py`, `0002_initial.py`).
- `tasks.py:send_notification_email` returns a dict, never sends email, and is
  never `.delay()`-called from anywhere. It is effectively dead code.
- No code path currently creates a `Notification` row.

## 11. Existing Message / Conversation / Chat models

**None.** No `apps/messaging/`, no `Conversation`, `ConversationParticipant`,
`Message` models anywhere. Phase 2 must create them.

## 12. Existing Celery configuration

- `backend/config/celery.py` boots `Celery("sahmi")` with `autodiscover_tasks()`.
- `base.py:124-125` sets `CELERY_BROKER_URL = config("REDIS_URL", ...)` and
  result backend to the same.
- `backend/docker-compose.yml` defines `redis:7-alpine` but **does not define a
  `celery worker` service** — so even if a task were called, nothing would
  consume it on Docker. Phase 6 must add this.

## 13. Existing email configuration

**None.** No `EMAIL_BACKEND`, no SMTP env vars, no
`django.core.mail.backends` configuration in any settings module. The single
`send_notification_email` task pretends to send mail. Phase 6 must add
environment-based SMTP plus a console backend for development.

## 14. Current React message page

- `src/pages/dashboard/MessagesPage.tsx` (~830 lines). Lines 31-57 declare
  `Message` and `Conversation` interfaces. Line 59 defines
  `const fixtureConversations: Conversation[] = [ ... ]` with at least two
  hardcoded conversations ("Sarah Ahmed", "Mohammad Hassan", etc.). Line 172
  defines `const fixtureMessages: Record<string, Message[]>`. The page renders
  these hardcoded arrays; **no API call** is made.
- No conversation-id, no participants list, no `mark-read`, no unread-count API.
- Layout: DashboardLayout wrapping a left conversation list and right message
  pane. Uses framer-motion, lucide-react icons.

## 15. Current notification popover

- **There is no notification popover or bell icon anywhere in the frontend.**
  Search for "notification" in `src/pages/dashboard/` returns only SettingsPage
  toggle UI (see §16). The role-detection header (`DashboardLayout.tsx`)
  contains no notification badge.
- Phase 7 must add a notification bell + dropdown that fetches
  `/api/v1/notifications/` and `/api/v1/notifications/unread-count/` with React
  Query refetch on an interval.

## 16. Current settings/preferences page

- `src/pages/dashboard/SettingsPage.tsx` (~900 lines). The "Notifications" tab
  uses **local `useState` only** (lines 111-113): `emailNotifications` and
  `pushNotifications` Booleans, toggled with `setNotifications(...)` (line 885).
  **No API call persists them.**
- Profile tab calls `auth/me/`; security tab calls `auth/change-password/`.
- The keys `emailNotifications` / `pushNotifications` are kept but their names
  will be aligned to the new persistent `NotificationPreference` model
  (in_app / message / project / investment / milestone / repayment / email).

## 17. Axios configuration

- `src/services/api.ts`: `axios.create({ baseURL: API_BASE_URL })`,
  `localStorage.getItem("accessToken")` attached to `Authorization` via
  request interceptor.
- Response interceptor unwraps the backend's `{success, data, message}`
  envelope via `unwrapResponse`.
- 401 retry path: reads `refreshToken` from localStorage, posts to
  `auth/refresh-token/`, stores new access, replays the original request.
- Refresh failure clears tokens and forces `window.location.href = "/login"`.
- **No cookie-based refresh support; refresh token lives in localStorage.**
  Phase 11 plans to implement rotation+blacklist with local storage left as a
  documented residual risk unless cookie migration proves feasible without
  restructuring CSRF and CORS.

## 18. React Query usage

- `@tanstack/react-query` is installed (`package.json`), `QueryClientProvider`
  wired in `src/App.tsx`. `useQuery` / `useMutation` are used in several pages
  (ProjectDetails, InvestorDashboard, InvestorTransactionsPage,
  EntrepreneurAnalyticsPage).
- `MessagesPage` and the notification flow do **not** use React Query yet.

## 19. Frontend tests

- `src/test/example.test.ts` — the trivial `expect(true).toBe(true)` test the
  spec calls out.
- `src/test/admin-access.test.tsx` (pre-existing) — three assertions about admin
  route gating.
- `src/test/setup.ts` — registers `@testing-library/jest-dom` + a `matchMedia`
  stub.
- `vitest.config.ts` — `jsdom` env, globals, `@` alias to `./src`, includes
  `src/**/*.{test,spec}.{ts,tsx}`.

## 20. Backend tests

- `backend/apps/core/tests.py` (~593 lines, pre-existing): admin authz, user
  CRUD, project CRUD, finance CRUD, related-party writes.
- `backend/apps/users/tests.py` (~129 lines, pre-existing): registration role
  restriction, profile self-promotion rejection, case-insensitive login.
- `backend/apps/projects/tests.py` (~225 lines, pre-existing): category perms,
  project moderation, set-status rules.
- `backend/apps/investments/tests.py` (~57 lines, pre-existing): signal-driven
  totals recalculation on confirm.
- No tests for messaging, notifications, preferences, audit logging,
  throttling, or token blacklist.

## 21. Playwright configuration

- `playwright.config.ts` and `playwright-fixture.ts` both import
  `lovable-agent-playwright-config`, a package that is **not declared in
  `package.json` and not present in `node_modules`**. As a result Playwright
  cannot load its config. **This is a definite blocker for Phase 16** and will
  be replaced with a standard local `@playwright/test` config (Playwright's
  own runner is installed at `@playwright/test` ^1.57.0 per `package.json`).
- No `*.spec.ts` files exist under the project. The screenshot/audit
  `playwright-fixture.ts` at root is unrelated.

## 22. Current API schema configuration

- `drf_spectacular` installed and in `INSTALLED_APPS`. `config/urls.py` exposes
  `api/schema/` (`SpectacularAPIView`) and `api/docs/`
  (`SpectacularSwaggerView`).
- `SPECTACULAR_SETTINGS` defines title/description/version only.
- No custom schema extensions, no operation IDs customised; default
  `AutoSchema` is used.

## Summary — fixture areas, security gaps, missing APIs

**Fixture / hardcoded:**

- `src/pages/dashboard/MessagesPage.tsx` — `fixtureConversations`,
  `fixtureMessages`.
- `src/pages/dashboard/InvestorsPage.tsx` — `fixtureInvestors`.
- SettingsPage notification preferences — local `useState`, not persisted.
- No notification bell in the dashboard header.

**Security problems to fix in later phases:**

1. Self-promotion path through `User.save()` (`user_type==admin` forces
   `is_staff=True`).
2. Unverified detail visibility — `ProjectPermission.has_object_permission`
   returns True for every SAFE method.
3. `Investment.status`, `Milestone.status`, `Repayment.status` are
   client-mutable where they should be server-controlled.
4. No JWT rotation / blacklist / logout endpoint.
5. No throttling anywhere.
6. No audit log model.
7. No messaging access control, no notification preferences persistence.

**Missing APIs to implement:**

- `POST /api/v1/auth/logout/` (blacklist refresh token)
- `GET/POST/PATCH /api/v1/conversations/...` and `messages/...`
- `GET /api/v1/notifications/...`, mark-read, mark-all-read, unread-count
- `GET/PATCH /api/v1/notification-preferences/`
- `GET /api/v1/audit-logs/` (admin only, read-only)

**Existing reusable components to keep using:**

- `DashboardLayout`, `ProtectedRoute`, `SahmiLogo`, shadcn/ui primitives
  (`Button`, `Input`, `Badge`, `ScrollArea`, `Sheet`, `Tabs`, `Toaster`,
  `Skeleton`, `Switch`).
- Backend: `UUIDTimestampModel`, `StandardJSONRenderer`,
  `StandardResultsSetPagination`, `standard_exception_handler`,
  `apps/users/backends.py:CaseInsensitiveEmailBackend`.

## Planned implementation approach (high level)

1. Commit Phase: preserve the pre-existing forward-port work and document it;
   do not pretend this task authored it.
2. Add a small `apps/messaging` app with `Conversation`, `ConversationParticipant`,
   `Message` models; service layer; serializer+viewset with participant-only
   permissions; migrations.
3. Extend `apps/notifications`: add `NotificationType` enum, `actor` FK optional,
   related-object type/id; `NotificationPreference` one-to-one with `User`; add
   urls/views/serializers; create a notifications service called from domain
   signals (message received, project submitted/verified/rejected, investment
   created and status changed through the new controlled endpoint).
4. Phase 6: add SMTP env config, console backend default, real Celery task
   `send_notification_email`, add a `celery` service to `docker-compose.yml`.
5. Phase 7: replace `fixtureConversations` / `fixtureMessages` with React Query-backed
   service calls; add a notification bell in `DashboardLayout` header; wire
   SettingsPage preference toggles to persistent preferences endpoint.
6. Phase 8: fix `User.save()` so it never silently grants `is_staff`; add a
   management command to normalise any existing mismatched rows; tests for
   self-promotion rejection.
7. Phase 9: server-control investment/milestone/repayment status transitions;
   fix public project visibility; do not expose private documents / verification
   notes / emails in public responses.
8. Phase 10: split serializers (public user summary vs. own profile vs. admin
   user; project detail public vs. owner vs. admin).
9. Phase 11: Simple JWT rotation + blacklist + logout endpoint; frontend logout
   calls backend; document residual localStorage refresh-token risk if cookie
   migration is not feasible without restructuring CSRF/CORS.
10. Phase 12: DRF scoped throttles with env-configurable rates; 429 responses
    via `standard_exception_handler`.
11. Phase 13: `apps/audit` app with immutable `AuditLog`; explicit `audit.log`
    calls from privilege-sensitive endpoints; admin-only read endpoint; no
    secrets / message bodies stored.
12. Phases 14-16: tests are added incrementally alongside each feature;
    Playwright config replaced and an e2e scenario exercised against a local
    server if feasible.
13. Phase 18: schema regenerated and checked.

This audit was compiled by directly reading the source files at the cited line
numbers. No code was changed to produce it, and no test results or external
evidence were fabricated.
