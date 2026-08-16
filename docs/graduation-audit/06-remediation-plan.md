# Sahmi Security and Financial-Integrity Remediation Plan

**Verification date:** 25 July 2026  
**Verified against:** local working tree on `feature/backend-messaging-security-hardening`, commit `7a6cb1e57eb76c6fecfde015a1097c41ac69f6d3`  
**Scope:** implementation plan only; no application code, configuration, migration, or database was changed while preparing this document.

## 1. Verification basis and prioritisation

This plan re-checked the findings in the graduation audit against the current local source. It does not treat a prior audit statement as evidence by itself. The working tree is already dirty, including backend security-related edits and an untracked user migration; line references therefore describe the working tree at the verification date, not necessarily the committed `HEAD`.

Severity is based on confidentiality, integrity, exploitability, and whether an issue can affect financial records:

| Priority | Meaning |
|---|---|
| Critical | A low-effort remote or authenticated request can disclose sensitive information or create an invalid financial record. Fix before any further demonstration involving real accounts or data. |
| High | A privileged or ordinary permitted user can bypass intended business controls, or the system cannot reproduce or protect sensitive data reliably. Fix before release or broader testing. |
| Medium | A material hardening, consistency, or operational-control gap that has a meaningful precondition or needs a product-policy decision. |
| Low | Defense-in-depth or maintainability work after the higher-risk paths are controlled. |

## 2. Prioritised verified findings

### CRIT-01 — Public SSE exposes investment/payment data

**Exact defect.** `GET /api/v1/projects/{slug}/events/` is declared `AllowAny`. For its `events` action, the project queryset is every non-deleted project rather than the public project set. On confirmation, the Redis message includes the investor’s name, amount, date, and payment method.

**Repository evidence.**

- `backend/apps/projects/views.py:84-85` returns the broad queryset for `events`; `:286-326` declares `permission_classes=[permissions.AllowAny]` and subscribes to `project_{project.id}`.
- `backend/apps/investments/services.py:54-66` constructs the published `payment` object with `investor_name`, `amount`, `date`, and `payment_method`.
- `src/pages/ProjectDetails.tsx:76-104` opens the endpoint with browser `EventSource`; native `EventSource` does not attach the app’s bearer token from `src/services/api.ts:91-99`.

**Risk and plausible exploitation.** An unauthenticated party who knows or guesses a slug can hold an SSE connection for a draft, failed, paused, unverified, or otherwise non-public project and receive newly confirmed investment data. This discloses personal identity data and financial metadata and permits private-project existence probing. The stream is also unsuitable for authorization based on the current frontend bearer token because the client does not send it.

**Required changes.**

- Backend: make the public stream aggregate-only: allow it only for `ACTIVE` and verified projects, and publish only `project_id`, aggregate funded amount, investor count, and funding percentage. Remove the complete `payment` object from public events.
- Backend: if staff, project owners, or an individual investor genuinely need event details, create a separate authenticated endpoint and a distinct, least-privilege event schema. Do not place JWTs in the query string. Use a streaming client that can send an authorization header, or an explicitly designed short-lived, single-use stream credential after a security review.
- Backend: centralize event payload construction in a service/schema so future publishers cannot reintroduce PII.
- Frontend: keep the public project-details subscription only for aggregate updates. Add reconnection/error handling that refreshes aggregate project data and never assumes a payment payload exists.
- Database: no schema migration is required for the aggregate-only minimum fix. A dedicated event/outbox table is optional only if reliable replay/audit is later required.

**Regression risks.** Existing UI code or undocumented consumers may read `data.payment`; removing it is intentionally breaking. Filtering the stream to public projects may turn a formerly connected private-project page into 404/403; owner/staff requirements must be handled through a separately reviewed path, not by weakening the public path.

**Tests that must be added.**

- Anonymous access to public active/verified project receives only aggregate event fields.
- Anonymous access to unverified, inactive, deleted, and guessed private slugs is denied without opening the stream.
- Serialized event contract contains no investor name, investment ID, amount, date, payment method, transaction ID, note, or other payer metadata.
- Confirmation still recalculates totals and publishes the aggregate event after transaction commit.
- Frontend test for aggregate event parsing, reconnect/reload behavior, and absence of a payment-field dependency.

### CRIT-02 — Payment-history endpoint authorizes any authenticated account

**Exact defect.** `GET /api/v1/projects/{slug}/payments/` requires authentication but does not check public visibility, project ownership, investor participation, or staff status. It returns every confirmed record’s investor name, amount, date, and payment method.

**Repository evidence.** `backend/apps/projects/views.py:84-85` broadens the queryset for `payments`; `:257-284` uses only `IsAuthenticated`, calls `self.get_object()`, and returns all confirmed records with the listed fields. The frontend exposes a corresponding service method at `src/services/projectsService.ts:179`.

**Risk and plausible exploitation.** Any logged-in account can enumerate known project slugs, including private ones, to obtain other investors’ identities and financial metadata. This defeats the otherwise more restrictive project retrieval logic at `backend/apps/projects/views.py:67-83`.

**Required changes.**

- Backend: make the endpoint’s access policy explicit in a reusable project-access function, rather than relying on generic `get_queryset` behavior.
- Backend: recommended default policy is: staff may access the staff payment view; an entrepreneur may access only a privacy-minimized ledger for their own project if that is a documented business need; an investor may access only their own investment records; unrelated accounts receive 404 or 403 consistently. Public users should receive aggregate project funding only, not a payment history.
- Backend: use separate serializers for staff, owner, and investor views. Never expose a full name merely because the requester is authenticated; use only fields each role needs.
- Frontend: remove or adapt any public/unrelated payment-history call. Render role-appropriate data and a clear authorization error rather than silently falling back to public content.
- Database: no migration for the access-control fix. A future payment-ledger model may need a migration if a real provider integration is approved.

**Regression risks.** Entrepreneurs may currently rely on seeing investor names; confirm whether consent, legal basis, and the required minimum data have been approved. Existing UI views that call this endpoint outside an authenticated role context will fail by design.

**Tests that must be added.**

- Anonymous request is denied.
- Unrelated authenticated investor is denied for both public and private project slugs.
- Project owner, participating investor, staff, and non-participating investor receive exactly their permitted data shapes.
- A participating investor cannot retrieve another investor’s amount, name, payment method, transaction ID, or notes.
- Deleted/unverified/inactive project behavior is tested for every role.

### CRIT-03 — Zero-value investments bypass the minimum-investment rule

**Exact defect.** `InvestmentSerializer.validate()` checks `if project and amount and amount < project.minimum_investment`. `Decimal("0")` is falsy, so it bypasses the minimum rule. The model has no positive-value database constraint.

**Repository evidence.** `backend/apps/investments/serializers.py:34-53` contains the truthiness check; `backend/apps/investments/models.py:20-31` defines `amount` as an unconstrained `DecimalField`. The staff serializer separately rejects non-positive amounts at `backend/apps/investments/admin_serializers.py:64-67`, demonstrating inconsistent entry-point validation.

**Risk and plausible exploitation.** Any authenticated caller permitted to create an investment can submit `amount: 0` to an active verified project. This creates an invalid investment record, may generate notifications, and can pollute workflow or reporting data. Negative values should be rejected by the same invariant even though the truthiness bug specifically demonstrates zero.

**Required changes.**

- Backend: add a field-level `validate_amount` requiring `amount > 0` to the normal serializer. In object validation, resolve `project` and `amount` from the incoming values *or the existing instance*, so `PATCH` cannot bypass the project minimum by omitting one of the two fields.
- Backend: add a model/database `CheckConstraint(amount__gt=0)` through a migration. Keep serializer validation because the project-specific minimum is dynamic and cannot be represented safely by that static constraint.
- Backend: make all writes use a domain service or a single serializer policy; direct staff CRUD must not be a weaker/alternate financial validation path.
- Frontend: prevent zero/negative submission and show the server error, but do not rely on client checks for enforcement.
- Database: add the positive-amount constraint migration after cleaning or rejecting any existing non-positive rows. The migration must include a preflight/data-remediation decision rather than silently changing historical data.

**Regression risks.** Existing test fixtures or database rows with zero amount will prevent the constraint migration. Partial-update behavior needs careful handling so legitimate metadata changes to pending records do not fail because a field was omitted.

**Tests that must be added.**

- API create rejects zero and negative amounts for normal and staff routes.
- API create and partial update reject positive amounts below the project minimum.
- Existing-instance partial updates use the current amount/project correctly.
- Direct ORM/database insertion of a non-positive amount fails after the constraint migration.
- Valid minimum and above-minimum amounts still create pending records and preserve totals.

### HIGH-01 — Confirmed financial records remain mutable and deletable

**Exact defect.** A non-staff investor owns the object permission for all unsafe methods, irrespective of status. The normal serializer leaves `amount`, `quantity`, `transaction_id`, `payment_method`, and `notes` writable. `perform_update` saves them and `perform_destroy` deletes the row without a pending-only guard. The staff CRUD serializer additionally leaves investor, project, status, and financial fields writable.

**Repository evidence.**

- `backend/apps/investments/permissions.py:4-13` returns true for an owner’s unsafe request without checking status.
- `backend/apps/investments/serializers.py:21-32` exposes the mutable fields; `backend/apps/investments/views.py:63-78` saves/deletes them.
- `backend/apps/investments/views.py:87-96` correctly limits the dedicated cancel action to pending records, but generic `PATCH`/`DELETE` do not share that invariant.
- `backend/apps/investments/admin_serializers.py:34-62` makes `investor`, `project`, `amount`, status and ledger fields writable; `admin_views.py:38-42` saves arbitrary changes. Confirmed investments contribute to totals in `backend/apps/investments/services.py:12-35`.

**Risk and plausible exploitation.** An investor can alter the amount or payment metadata of their confirmed record or delete it, changing project totals after confirmation. Staff can overwrite or reassign the same historical record without a compensating record or full audit. This destroys the ability to explain a financial total and can create mismatches between notifications, SSE events, expected return, and project aggregates.

**Required changes.**

- Backend: define a written investment state machine. Recommended minimum: only pending investments may be edited by their owner and only pending investments may be cancelled; confirmed/completed records are immutable to ordinary users.
- Backend: remove generic destructive financial CRUD from public routes. Implement explicit commands such as `cancel_pending`, `confirm`, and a staff-only `void/reverse` or `correct` workflow. A correction must create an attributable compensating record, reason, and link to the original; it must not rewrite or delete a confirmed ledger row.
- Backend: prohibit client writes to provider transaction IDs, actual returns, and paid/confirmed statuses. A real provider/webhook service, if later approved, owns payment-status transitions.
- Backend: make aggregate updates and audit/notification/event publication happen inside one documented transaction/outbox policy. Ensure an authorized reversal updates totals exactly once.
- Frontend: hide edit/delete controls for non-pending investments; replace staff free-form editing of confirmed records with the explicit transition/correction UI and mandatory reason field.
- Database: add a new correction/reversal/audit-ledger model if corrections must be supported, with original-investment foreign key, immutable amount/direction, actor, reason, timestamps, and indexes. Add database constraints for allowed values where practical. Do not retroactively delete current records.

**Regression risks.** The current administrator investment dialog intentionally edits amount, status, method, return, and transaction ID (`src/components/admin/AdminInvestmentDialog.tsx:181-255`; `src/services/adminFinanceService.ts:157-167`). Replacing it affects administration workflows and requires a recorded business policy for mistakes, refunds, chargebacks, and legitimate pending changes. Existing tests currently assert generic total recalculation after direct model mutation (`backend/apps/investments/tests.py:74-93`); they need to be updated to test authorized commands instead.

**Tests that must be added.**

- Owner can edit/cancel a pending investment but cannot patch/delete a confirmed, canceled, or completed one.
- Unrelated user and entrepreneur cannot mutate an investment through either normal route.
- Staff cannot generic-patch/delete confirmed fields; approved confirm/void/correction commands require reason and create audit evidence.
- Totals, investor count, expected return, notification, and SSE aggregate remain correct through confirm, cancel, correction, and reversal.
- Concurrent confirm/cancel/correction requests are serialized or resolve to one valid state transition.

### HIGH-02 — Staff project moderation has two inconsistent, bypassable paths

**Exact defect.** The normal project actions apply an audit record, entrepreneur notification, and `AdminVerificationRateThrottle`. The admin-prefixed project actions duplicate the state mutations but omit all three. The generic admin project serializer also makes moderation-related fields writable, so a staff user can bypass the action methods by `PATCH`.

**Repository evidence.**

- Normal actions use throttle at `backend/apps/projects/views.py:148-153`, `:183-188`, and `:218-223`; use notifications/audit at `:164-180`, `:199-215`, and `:235-242`.
- `backend/apps/projects/admin_views.py:85-139` duplicates `verify`, `reject`, and `set_status` without throttle, notification, or `audit_log` calls.
- `backend/apps/projects/admin_serializers.py:66-184` inherits broad project fields and does not mark status, verification, verifier, or moderation notes read-only. `AdminProjectViewSet` uses `IsAdminUser` only at `admin_views.py:39-46`.

**Risk and plausible exploitation.** Any staff account can perform moderation through an endpoint with no specialized rate limit and no audit/notification trail, or directly PATCH moderation state. Operationally this makes staff activity non-repudiable only in some paths and may leave the entrepreneur unaware of approval, rejection, or status changes.

**Required changes.**

- Backend: move verify/reject/status transition logic into one domain service used by both normal and admin URLs, or retire one set of routes. The service must validate the transition, execute in a transaction, create an audit log, and schedule role-appropriate notifications after commit.
- Backend: restrict generic admin `PATCH` fields. Verification and status must be changed only by explicit actions; system-derived values such as `verified_by`, `verified_at`, totals, and financial fields must be read-only.
- Backend: apply an appropriate scoped throttle to every admin moderation command. Consider a separate admin action throttle for destructive/configuration changes rather than assuming the global authenticated rate is sufficient.
- Frontend: route administration through explicit moderation commands. Show success only after the server command returns, and display validation errors/reasons.
- Database: no migration is required for parity. A later immutable audit-event design may require an audit schema migration.

**Regression risks.** Adding notifications to the admin route can duplicate messages if both the old and new path remain active during refactor. Throttle selection should not block bulk moderation without an approved operational workflow. Restricting generic admin fields may break the current full-edit dialog and requires endpoint-specific client changes.

**Tests that must be added.**

- Normal and admin URLs have identical transition validation, audit record, notification recipients, and throttle behavior.
- Generic admin PATCH cannot modify status, verification, verifier, verification time, or moderation notes.
- Verify/reject/set-status produce exactly one audit record and the expected notifications after successful commit, none on validation failure/rollback.
- Throttle returns 429 at the configured boundary for both route families.

### HIGH-03 — Uploads have no explicit content controls or private-storage design

**Exact defect.** Project, profile, and KYC fields use plain Django `FileField`/`ImageField` paths. No inspected serializer, model, or settings module implements file-size limits, allowed extensions, MIME/magic-byte verification, malware scanning/quarantine, content hashing, or authorization-controlled downloads. Media uses local `MEDIA_ROOT`; Django serves it under `MEDIA_URL` when `DEBUG` is enabled.

**Repository evidence.**

- `backend/apps/projects/models.py:60-63,98-106` defines project documents/images with static upload paths.
- `backend/apps/users/models.py:36,44` defines `profile_picture` and `kyc_document` similarly.
- `backend/config/settings/base.py:87-89` uses local `MEDIA_ROOT`; `backend/config/urls.py:20-21` serves all media in debug.
- Project serializers expose owner/staff document URLs at `backend/apps/projects/serializers.py:102-137`; the admin user serializer exposes `kyc_document` at `backend/apps/users/admin_serializers.py:15-50`, and the UI opens that URL directly at `src/components/admin/AdminUserDialog.tsx:517-520`.

**Risk and plausible exploitation.** A permitted uploader can store unexpectedly large, malformed, or dangerous content. Local/debug media URLs can be directly reachable if an attacker learns or guesses a path. The current repository does not establish that production storage is private, that KYC access is authorized at download time, or that old objects are cleaned up consistently. This is especially sensitive for identity/KYC and financial-support documents.

**Required changes.**

- Backend: establish an upload policy by field: exact allowed format, maximum size, maximum image dimensions, rejection messages, retention, and who may download. Validate extension, trusted MIME, and file signature server-side; use safe image decoding/re-encoding where appropriate.
- Backend: store KYC and project financial documents in non-public storage with randomized, non-guessable names. Replace raw URLs with an authorization-checked download endpoint or short-lived signed URL produced only after a role/object check. Public cover/project images may use a separate public storage class and allow-list.
- Backend: implement a quarantine/scan state before a sensitive document becomes downloadable. Scanner integration and storage provider require team approval; fail safely if configured scanning is unavailable.
- Backend: ensure replacement/clear/delete operations remove objects only after a successful database transaction, preserve audit metadata, and avoid path disclosure in logs/errors.
- Frontend: validate file type/size for usability, label upload state, remove direct private URL links, and call the authorized download endpoint. Do not imply that client-side validation is a security control.
- Database: a minimal storage change does not require migration. A robust implementation should add a file-asset/document metadata model (owner/object relation, classification, original filename policy, safe storage key, size, declared/detected content type, SHA-256, scan status, uploader, retention/deletion timestamps) plus a data migration for existing files. Team confirmation is required before moving/rehydrating existing documents.

**Regression risks.** Existing document URL fields and direct anchor links will stop working after private storage. Data migration, storage copy, rollback, and deletion handling must be rehearsed with non-production data; never move KYC documents blindly. A scanning dependency can make uploads unavailable unless a clear availability/fail-closed policy is selected.

**Tests that must be added.**

- Reject oversized, extension-spoofed, MIME-spoofed, malformed image, and disallowed-file uploads for every field class.
- Authorized staff/owner can download only the permitted object; unrelated and anonymous users cannot access KYC/private project files by direct path or endpoint.
- Quarantined/failed scan files are never served; clean files become available only after the approved state transition.
- Replacing/clearing/deleting a file respects transaction rollback and does not remove a newly referenced file.
- Public image behavior remains available only for explicitly public assets.

### HIGH-04 — User schema changes are not reproducible from the tracked repository

**Exact defect.** The current `User` model and serializer contain `website` and `timezone`, but the only migration adding them is untracked. A clean checkout of the tracked repository cannot recreate the current schema.

**Repository evidence.**

- `backend/apps/users/models.py:40-41` defines both fields; `backend/apps/users/serializers.py:19` serializes them.
- `backend/apps/users/migrations/0003_user_timezone_user_website.py` adds them after `0002_add_preferred_language`, but `git status --short` reports `?? backend/apps/users/migrations/0003_user_timezone_user_website.py` and `git ls-files --error-unmatch` reports it is not tracked.
- Tracked user migrations end at `backend/apps/users/migrations/0002_add_preferred_language.py`.

**Risk and plausible exploitation.** Fresh environments, CI, and collaborators will have a `User` model that expects columns absent from the database. Profile reads/writes can fail at runtime, migrations become inconsistent between machines, and an unreviewed schema change can be omitted from release history.

**Required changes.**

- Backend/database: review the field defaults and data classification, then add the existing migration to version control in a dedicated migration commit. Do not hand-edit applied historical migrations.
- Backend: run the authorized migration-consistency workflow in a disposable database: `makemigrations --check`, `migrate --plan`, migration from zero, and upgrade from the supported prior schema. Capture the results in CI rather than relying on a developer’s local database.
- Frontend: no security logic change is required, but profile form values must tolerate an older API only during a deliberate rolling-deployment compatibility window.
- Database: this is itself the required migration. If the intended timezone changes or data normalization is needed, create a follow-up migration rather than altering the already reviewed migration after deployment.

**Regression risks.** Applying the migration to a shared environment changes the user table and needs a backup/rollback plan. The default `Asia/Riyadh (UTC+3)` may be incorrect for existing users; do not claim it is a user-confirmed timezone. Validate serializer/admin API inclusion and form behavior after the schema is present.

**Tests that must be added.**

- CI migration check and fresh-database migration test.
- Upgrade test from the previous migration state preserving existing users.
- Profile API create/update/read tests for `website` and `timezone`, including invalid URL and maximum-length cases.
- A deployment smoke check confirming the database migration level matches the release artifact.

### HIGH-05 — Any authenticated role may create investment records

**Exact defect.** `InvestmentPermission.has_permission` only requires authentication, and `perform_create` always writes the caller as investor. There is no `user_type == investor` gate.

**Repository evidence.** `backend/apps/investments/permissions.py:4-6` accepts every authenticated user; `backend/apps/investments/views.py:36-37` saves `investor=self.request.user`. The existing audit finding is still present; no role-specific validation was found in `InvestmentSerializer`.

**Risk and plausible exploitation.** An entrepreneur or any future authenticated role can create investment records. Combined with CRIT-03, this allows invalid or misleading records from roles that the UI may not intend to invest. Whether entrepreneurs are deliberately permitted to invest is a business-rule decision, so the correct policy must be confirmed before implementation.

**Required changes.**

- Backend: document the allowed investor roles, then enforce them in a dedicated creation permission and the domain command. Staff-created records should use an explicit administrative workflow with audit reason, not an accidental side effect of staff bypass.
- Frontend: hide investment controls for disallowed roles, while continuing to treat the server as authoritative.
- Database: no migration required.

**Regression risks.** A legitimate entrepreneur-investor dual-role workflow would be blocked unless the data model supports it. Obtain `[TEAM CONFIRMATION REQUIRED]` on role semantics before enforcement.

**Tests that must be added.** Role matrix tests for investor, entrepreneur, staff, inactive account, and any approved dual-role model; test that authorization cannot be bypassed by posting an `investor` field.

### HIGH-06 — Payment confirmation is an internal status change, not verified money movement

**Exact defect.** The model stores a payment method/transaction ID, and staff can confirm records, but the repository contains no payment-provider client, webhook signature verification, receipt reconciliation, refund/disbursement workflow, or immutable settlement ledger.

**Repository evidence.** `backend/apps/investments/models.py:15-31` stores the fields; `backend/apps/investments/views.py:111-153` confirms an investment with a staff request; `backend/apps/investments/admin_views.py:38-71` permits staff status changes. No provider integration module or webhook endpoint was found in the inspected backend routes/services.

**Risk and possible exploitation.** This is not evidence of a broken provider integration; none exists. If this platform is presented or operated as receiving real funds, staff can mark an unverified record confirmed and totals/notifications/SSE change without evidence of payment. That is a high financial-integrity and product-claims risk.

**Required changes.**

- Immediate: label the feature as an internal platform record workflow in UI/documentation and prohibit production payment claims until a provider and reconciliation design are approved.
- Future backend: use provider-created payment intents/orders, signed webhook verification, idempotency keys, server-side amount/currency verification, settlement/reversal handling, and a reconciliation job. Confirmation must be driven by verified provider events, not a free-form status update.
- Future frontend: invoke only the approved provider flow and never accept raw card data unless the chosen compliant provider explicitly permits it.
- Database: future provider work requires a migration for provider reference, immutable payment event/ledger records, currency, idempotency key, provider status, webhook event uniqueness, reconciliation timestamps, and reversal/refund links. Do not invent a provider before `[TEAM CONFIRMATION REQUIRED]`.

**Regression risks.** Introducing a provider changes the legal, compliance, accounting, support, and data-retention scope. It must be reviewed as a separate project, not hidden inside a serializer change.

**Tests that must be added.** Until a provider is approved, test that UI/documentation do not represent confirmation as a settled payment. For a provider implementation, add signed webhook, replay/idempotency, amount mismatch, delayed event, refund, reversal, and reconciliation tests using provider-approved test fixtures.

### HIGH-07 — Audit coverage and audit-row integrity are incomplete for sensitive operations

**Exact defect.** The audit mechanism is an explicit service, but major staff/financial routes do not call it. Audit rows have no database immutability or tamper-evident chain; the service accepts the first `X-Forwarded-For` value without a documented trusted-proxy boundary.

**Repository evidence.** `backend/apps/audit/services.py:53-95` writes ordinary mutable rows and trusts `HTTP_X_FORWARDED_FOR` at `:71-77`. Normal project actions call `audit_log` (`projects/views.py:118-125,140-146,173-180,208-215,235-242`), while `investments/views.py`, `investments/admin_views.py`, and `projects/admin_views.py` contain no equivalent audit call for their sensitive writes. `AuditLog` has no append-only constraint at `backend/apps/audit/models.py:9-41`.

**Risk and possible exploitation.** Sensitive financial/admin changes may lack actor/reason/old-new-value evidence. Anyone who can modify database rows or use an overly broad administrative path can alter or remove the ordinary audit record; a client can influence recorded source IP unless the deployment strips/sets forwarded headers at a trusted proxy.

**Required changes.**

- Backend: define an audit event matrix for every authorization, financial, moderation, account privilege, file-access, and security-relevant action. Invoke a shared audit service from the domain commands, not separately in each URL.
- Backend: record safe before/after summaries, transition reason, correlation ID, actor, target, and result; never record secrets, payment instrument data, message bodies, or document content.
- Backend/deployment: trust `X-Forwarded-For` only when a controlled proxy is configured; otherwise use `REMOTE_ADDR`. Configure structured logging/retention/monitoring separately.
- Database: for meaningful audit assurances, add an append-only audit-event design (restrict application update/delete permissions, or use an external immutable log/WORM store). A hash chain may improve tamper evidence but does not replace access controls. This needs operational-owner approval.
- Frontend: require reason input and show immutable event history for staff actions once the backend supports it.

**Regression risks.** Logging after commit without carefully designed failure handling can lose audit evidence; logging inside a failed transaction can log an event that did not happen. Audit metadata can become a privacy leak if field diffing is indiscriminate.

**Tests that must be added.** An event-matrix suite asserting one audit event for each successful sensitive command, expected denied/failure events where approved, no secret leakage, transaction rollback behavior, and trusted/untrusted forwarded-IP behavior.

### HIGH-08 — Messaging conversation creation lacks several object-scope checks

**Exact defect.** The audit identified direct/self/inactive-user and project-conversation validation gaps. These remain outside the current plan’s financial focus but should be fixed before treating messaging as a production communication channel.

**Repository evidence.** `docs/graduation-audit/04-testing-security-and-traceability.md:160-167` identifies the current concerns; their source evidence is in `backend/apps/messaging/serializers.py:102-145` and messaging views. This remediation pass did not execute the backend test suite because its setup applies migrations, but no source change was found that would supersede the documented findings.

**Risk and possible exploitation.** A caller may create nonsensical/self conversations, involve inactive users, or associate a project conversation with a project they should not access. Uncaught validation can produce a 500, which is an availability and information-quality issue.

**Required changes.** Validate active recipients; reject self-conversations with a controlled 400; require project visibility and party relationship for project conversations; convert invalid page values to validation errors; add an explicit retention/moderation policy before storing sensitive communications.

**Database migration.** None for validation; a retention/reporting/blocking feature needs its own approved schema.

**Regression risks and tests.** Existing conversation creation UX needs clear messages. Add participant, inactive, self, private/deleted project, unrelated party, malformed pagination, and response-status tests.

### MED-01 — Throttling is process-local unless deployment supplies a shared cache

**Exact defect.** Scoped/default DRF throttles exist, but no explicit shared Django cache configuration was found. Admin-prefixed moderation endpoints also lack the specialized moderation throttle (addressed in HIGH-02).

**Repository evidence.** Rates and default throttle classes are configured in `backend/config/settings/base.py:111-153`; scopes are defined in `backend/apps/core/throttling.py:8-58`. No `CACHES` configuration was found in the inspected settings.

**Risk and possible exploitation.** With multiple application workers/instances, local-memory counters can be bypassed by distributing requests. Rate limits are therefore not a verified globally enforced protection.

**Required changes.** Configure an approved shared cache (normally Redis) for throttles, document failure behavior, add endpoint-specific scopes where needed, and monitor 429s. Do not rely on a Celery broker URL as proof of a safe cache topology.

**Database migration.** None.

**Regression risks and tests.** Cache outages can either fail open or fail closed; choose deliberately. Add isolated throttle tests plus an authorized multi-process/integration test when infrastructure exists.

### MED-02 — Token storage and browser hardening leave a broad XSS blast radius

**Exact defect.** Both access and refresh JWTs are stored in `localStorage`; no CSP configuration was found.

**Repository evidence.** `src/services/api.ts:79-81,91-99,114-137` stores tokens and attaches the access token. JWT configuration is at `backend/config/settings/base.py:102-109`; no CSP middleware/settings were found in inspected backend configuration.

**Risk and possible exploitation.** Any successful same-origin script injection can read both tokens and impersonate the user until rotation/expiry. This is defense-in-depth work; it does not establish that an XSS vulnerability exists.

**Required changes.** Select and document an authentication architecture: preferably short-lived access token held in memory plus a secure, HttpOnly, SameSite refresh cookie with CSRF defenses for cookie-authenticated refresh; alternatively retain bearer storage only with a reviewed CSP and a consciously accepted risk. Add CSP/security headers, a refresh single-flight guard, and consistent logout/cache clearing.

**Database migration.** None normally; server-side session/device tracking would require one.

**Regression risks and tests.** Cookie refresh changes CORS/CSRF behavior and EventSource semantics. Add login/refresh/logout, parallel 401 refresh, CSRF, token rotation/blacklist, and header-policy tests.

### MED-03 — Configuration defaults need production fail-closed controls

**Exact defect.** Base settings supply a development fallback secret and permissive local origins; the environment examples/ports need deployment-specific verification.

**Repository evidence.** `backend/config/settings/base.py:9-11,92-100,164-176` contains the fallback secret, origin configuration, and local defaults. The current audit also found example/Vite origin mismatch.

**Risk and possible exploitation.** A production deployment started with a known/default secret or unintended origins compromises authentication/session assumptions. This is a deployment-misconfiguration risk; it does not prove a live deployment is using those defaults.

**Required changes.** In production settings, require a strong secret, exact HTTPS origin/host allow-lists, secure proxy/header configuration, private-media storage configuration, and startup checks that fail closed. Keep explicit local-development values only in development settings. Add deployment documentation and CI configuration validation without printing secrets.

**Database migration.** None.

**Regression risks and tests.** Strict settings can break local builds and reverse-proxy deployments. Add settings tests and a non-production deployment smoke test with the intended proxy/CORS topology.

### MED-04 — Derived financial values and adjacent workflows lack enforced invariants

**Exact defect.** `expected_return` is calculated in `Investment.save()` only when it is currently zero; later amount or ROI changes do not reliably recompute it. Milestone release/percentage and repayment authority also lack documented cross-record constraints.

**Repository evidence.** `backend/apps/investments/models.py:40-43` performs conditional expected-return calculation; `backend/apps/investments/serializers.py:56-102` provides typed serializers but no cross-record invariants. The project total service only aggregates confirmed investment amount/count at `backend/apps/investments/services.py:12-35`.

**Risk and possible exploitation.** Totals/returns can become internally inconsistent after currently permitted edits. Related-party repayment creation can create schedules not tied to a verified payment engine. This is amplified by HIGH-01 but remains relevant after immutability controls.

**Required changes.** Define authoritative source of expected return, currency/rounding, milestone allocation, repayment scheduling, and permitted actors. Calculate derived values in domain commands; protect server-derived fields; add static database constraints where feasible and service validation for cross-row rules.

**Database migration.** Potential constraints/new ledger tables depend on the approved business rules. Do not add arbitrary percentage or ROI constraints without policy confirmation.

**Regression risks and tests.** Existing fixtures may rely on inconsistent values. Add transition, rounding, allocation-total, repayment-authority, and aggregate-reconciliation tests after the business rules are accepted.

## 3. Recommended implementation order and reviewable commits

The commits below are intentionally narrow. Do not combine schema, authorization, provider integration, UI redesign, and infrastructure changes in one review.

### Phase 0 — Establish a safe baseline

1. **Commit A: record schema reproducibility (HIGH-04).** Review and track `users/0003_user_timezone_user_website.py`; add migration-consistency CI/tests. This commit should contain only the already intended user fields/migration and tests.
2. **Commit B: add failing regression tests for the three critical API defects.** Cover SSE privacy, payment-history authorization, zero/negative/minimum amounts, and confirmed-record mutation. Tests should demonstrate the current behavior before fixes, then become passing in the following commits. Use a disposable/test database only with explicit authorization.

### Phase 1 — Stop direct disclosure and invalid record creation

3. **Commit C: public SSE contract reduction (CRIT-01).** Public-project gating, aggregate-only publisher schema, updated project-details listener, and contract tests. Treat payload removal as a versioned API change.
4. **Commit D: payment-history role/object authorization (CRIT-02).** Add dedicated serializers/access policy and frontend adaptation. Include denial and response-shape tests.
5. **Commit E: positive investment amount invariant (CRIT-03).** Serializer fixes, database check constraint migration, pre-migration data check/remediation procedure, and normal/admin API tests.

### Phase 2 — Make financial state transitions accountable

6. **Commit F: pending-only user mutation (HIGH-01 first part).** Block generic owner modification/deletion outside pending, limit writable fields, and update UI controls. This can ship before the complete correction ledger.
7. **Commit G: staff financial command model and audit (HIGH-01/HIGH-07).** Replace broad confirmed-record editing with explicit confirm/void/correction commands, mandatory reasons, transaction-safe aggregate updates, and audit/notification tests. If a correction ledger is approved, put its migration in this commit only.
8. **Commit H: moderation service parity (HIGH-02).** Centralize normal/admin project transitions; lock down generic admin fields; add audit/notification/throttle parity tests. Avoid duplicate notification emission during migration.
9. **Commit I: investment-role policy (HIGH-05).** Implement only after the team confirms whether a user can be both entrepreneur and investor. Include the complete role matrix.

### Phase 3 — Protect documents and operate the controls

10. **Commit J: upload validation and private-access boundary (HIGH-03 first part).** Field-specific validation, separate public/private storage interfaces, protected download API, frontend link changes, and tests. Do not migrate existing files in this commit unless a tested rollback plan exists.
11. **Commit K: document metadata/quarantine migration (HIGH-03 second part).** Add approved asset metadata/scan states, data migration/copy tooling, and retention behavior. This needs storage, malware-scanning, privacy, and operational-owner confirmation.
12. **Commit L: audit event matrix and trusted-proxy policy (HIGH-07).** Complete sensitive-action coverage and configure audit/structured-log behavior. An append-only or external immutable log is a separately reviewable operational change.

### Phase 4 — Product/infrastructure hardening and deferred capability

13. **Commit M: messaging object-scope fixes (HIGH-08)** and controlled-error tests.
14. **Commit N: shared throttle/cache and production settings validation (MED-01/MED-03).** Provision and test the approved non-production topology before enabling it in any deployment.
15. **Commit O: token/browser hardening (MED-02).** This is a cross-cutting auth migration and should have a rollback plan.
16. **Separate project, not a routine fix: real payment integration (HIGH-06) and broader financial invariants (MED-04).** Start only after provider, legal/compliance, currency, settlement, refund, accounting, and support ownership decisions are documented.

## 4. Required confirmations before implementation

- `[TEAM CONFIRMATION REQUIRED]` Whether entrepreneurs may invest, whether staff may create investments, and which financial corrections/refunds/reversals are valid.
- `[TEAM CONFIRMATION REQUIRED]` Who may see an investor’s identity and payment metadata: staff, project owner, participating investor, or nobody outside staff.
- `[TEAM CONFIRMATION REQUIRED]` Whether the public project page needs real-time updates or can use polling; public aggregate-only SSE is the safest minimum.
- `[TEAM CONFIRMATION REQUIRED]` Storage provider, scanning/quarantine service, private-download policy, retention/deletion policy, and migration approach for existing KYC/project documents.
- `[TEAM CONFIRMATION REQUIRED]` Whether Sahmi will process real money. If yes, provider/compliance/legal/accounting scope must be approved before development; if no, UI and documentation must continue to state that confirmation is a platform workflow rather than settlement.
- `[TEAM CONFIRMATION REQUIRED]` Trusted reverse proxy, shared cache, production domains, secret-management process, and audit retention/monitoring owner.

## 5. Readiness gate

Sahmi should **not** be represented as a production-ready investment or payment platform until CRIT-01 through CRIT-03 are fixed and verified, confirmed-record immutability is enforced, private document handling is designed and tested, the untracked migration is committed and reproducible, and the team resolves the real-payment boundary. Passing frontend tests or visible UI controls do not satisfy these gates.
