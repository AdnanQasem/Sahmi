# Sahmi Testing, Evaluation, and Findings

**Evidence snapshot:** 25 July 2026  
**Handoff constraint:** no application test, migration, database operation, external request, or source modification was performed while creating this package  
**Interpretation:** current source assets, prior audit executions, and historical logs are deliberately separated

## 1. Evidence classes

| Class | Meaning |
|---|---|
| Current executed evidence | A command was run by the completed graduation audit against the present audited working tree and its exact result was recorded |
| Current static test evidence | Test source exists in the current working tree but was not run by the completed audit |
| Historical execution evidence | A dated repository log reports a run against an earlier working-tree state |
| Configuration evidence | A test/deployment mechanism is configured but no reliable current execution is established |
| Missing evidence | No implementation/test/result was found |

Never collapse these classes into “all tests passed.”

## 2. Current executed evidence from the completed audit

The completed graduation audit reports these exact executions on 25 July 2026:

| Command | Result | Permitted claim |
|---|---|---|
| `npm test -- --run` | exit 0; Vitest 3.2.4; **11 test files, 24 tests passed** | “The current frontend Vitest suite passed 24/24 tests across 11 files in the audited local environment on 25 July 2026.” |
| `npx --no-install tsc --noEmit` | exit 0 | “The current frontend passed a TypeScript no-emit check in that audit.” |

No application command was rerun for this handoff. The results above come from `docs/graduation-audit/04-testing-security-and-traceability.md`, not from a new execution.

Warnings/limits:

- passing frontend tests do not prove backend behavior, production operation, payment processing, legal compliance, accessibility, or usability;
- `src/test/example.test.ts` is a trivial sanity assertion;
- many UI tests fixture API calls or services;
- no code-coverage percentage was produced;
- line/branch/function coverage is `[NOT VERIFIED]`.

## 3. Current frontend test assets

| File | Test declarations | Principal behavior |
|---|---:|---|
| `src/test/admin-access.test.tsx` | 3 | staff route guard, role redirect |
| `src/test/auth-language-sync.test.tsx` | 1 | authenticated language synchronization |
| `src/test/example.test.ts` | 1 | trivial test-runner sanity |
| `src/test/localization.test.tsx` | 4 | language/direction/principal UI behavior |
| `src/test/localization-resources.test.ts` | 1 | resource structure/coverage expectation |
| `src/test/logout.test.ts` | 2 | backend logout attempt and local cleanup |
| `src/test/messages.test.tsx` | 4 | conversation loading/sending/error/duplicate behavior |
| `src/test/notifications.test.tsx` | 3 | notification list/read behavior |
| `src/test/password-reset.test.tsx` | 2 | reset request/confirmation UI flow |
| `src/test/preferences.test.tsx` | 2 | preference loading/saving |
| `src/test/token-rotation.test.ts` | 1 | rotated token storage |
| `src/test/setup.ts` | 0 | jsdom/jest-dom and browser stubs |

Total test declarations: 24.

Frontend areas not established by these tests include:

- full project browse/detail/invest/moderation integration;
- payment-history and SSE authorization/privacy;
- investment zero/boundary validation;
- confirmed-record immutability;
- upload controls;
- all admin CRUD flows;
- wallet/cards/billing/2FA/session fixture disclosure;
- accessibility, keyboard, screen-reader, visual regression, complete RTL, and cross-browser behavior;
- real email delivery;
- real backend/Redis/PostgreSQL interaction.

## 4. Current backend test assets

The current source contains 64 `test_` methods. They were counted statically and were **not executed by the completed graduation audit** because Django's test setup applies migrations and that audit prohibited migration execution.

### 4.1 Audit tests — 2

File: `backend/apps/audit/tests.py`

- `test_ordinary_users_cannot_read_or_modify_audit_records`
- `test_sensitive_metadata_is_removed_recursively`

### 4.2 Core/staff API tests — 12

File: `backend/apps/core/tests.py`

- `test_every_admin_collection_is_staff_only`
- `test_user_crud_password_reset_and_safe_output`
- `test_self_deactivation_demotion_and_deletion_are_rejected`
- `test_last_active_superuser_cannot_be_demoted_or_deleted`
- `test_user_search_filter_and_ordering`
- `test_project_full_crud_moderation_and_filtering`
- `test_project_upload_clear_flags_and_child_asset_crud`
- `test_category_crud_and_project_moderation_actions`
- `test_investment_milestone_and_repayment_crud`
- `test_unrelated_user_cannot_create_or_mutate_milestones_and_repayments`
- `test_related_users_cannot_reassign_records_to_unrelated_objects`
- `test_project_owner_and_investor_can_create_related_records`

### 4.3 Investment tests — 4

File: `backend/apps/investments/tests.py`

- `test_confirming_investment_syncs_project_totals_and_publishes_event`
- `test_update_reassignment_and_deletion_recalculate_all_totals`
- `test_admin_status_update_notifies_investor_and_project_owner`
- `test_status_and_project_assignment_are_authorized`

### 4.4 Messaging tests — 20

File: `backend/apps/messaging/tests.py`

- direct conversation deduplication and self-conversation rejection at service level;
- persistent order;
- empty/oversized message rejection;
- deleted-body privacy;
- owner-only edit/delete;
- unread/read behavior;
- anonymous denial;
- minimal active-user search;
- create/list/retrieve participant behavior;
- non-participant denial;
- server-derived sender;
- recipient notification.

Exact method names in source:

- `test_direct_conversation_is_deduplicated`
- `test_cannot_create_direct_conversation_with_self_only`
- `test_messages_persist_in_creation_order`
- `test_send_message_rejects_empty_and_oversized_body`
- `test_soft_delete_hides_body`
- `test_edit_message_rejects_non_owner`
- `test_unread_count_after_send_and_mark_read`
- `test_anonymous_cannot_list_conversations`
- `test_user_search_returns_minimal_results_and_excludes_self`
- `test_create_direct_conversation_then_list`
- `test_duplicate_direct_conversation_is_idempotent`
- `test_non_participant_cannot_retrieve_conversation`
- `test_non_participant_cannot_list_messages`
- `test_send_message_via_api`
- `test_empty_message_rejected`
- `test_sender_cannot_be_spoofed`
- `test_edit_message_only_by_sender`
- `test_delete_message_only_by_sender`
- `test_mark_read_updates_unread_count`
- `test_notification_created_for_recipient_on_send`

### 4.5 Notification tests — 4

File: `backend/apps/notifications/tests.py`

- `test_list_and_mark_read_are_owner_scoped`
- `test_preferences_are_persistent_and_owner_scoped`
- `test_mark_all_only_changes_current_users_notifications`
- `test_mark_read_is_throttled`

### 4.6 Project tests — 11

File: `backend/apps/projects/tests.py`

- public category read and staff-only mutation;
- staff list context;
- ordinary-owner moderation-field protection;
- staff-only moderation;
- rejection-note validation;
- verification/rejection latest-record and audit behavior;
- operational status rules;
- public detail privacy.

Exact names:

- `test_category_reads_are_public`
- `test_non_staff_user_cannot_mutate_categories`
- `test_staff_user_can_mutate_categories`
- `test_staff_list_gets_owner_context_without_expanding_the_public_list`
- `test_owner_cannot_write_moderation_fields_through_normal_update`
- `test_moderation_actions_are_staff_only`
- `test_reject_requires_nonblank_notes`
- `test_staff_can_verify_and_reject_projects_with_an_audit_record`
- `test_set_status_supports_operational_states`
- `test_set_status_rejects_activating_an_unverified_project`
- `test_public_detail_omits_private_owner_and_document_fields`

### 4.7 User/authentication tests — 11

File: `backend/apps/users/tests.py`

- public role restriction;
- profile self-promotion denial;
- legitimate staff flag exposure;
- email normalization/case-insensitive login/admin authentication;
- refresh rotation/blacklist/logout;
- language preference;
- password-reset request/confirm and enumeration-safe response.

Exact names:

- `test_public_registration_accepts_only_public_account_types`
- `test_me_patch_cannot_promote_a_user`
- `test_me_exposes_staff_flag_for_legitimate_staff`
- `test_user_emails_are_normalized_when_saved`
- `test_login_accepts_a_legacy_mixed_case_email`
- `test_django_admin_login_is_case_insensitive`
- `test_refresh_rotation_blacklists_old_token_and_logout_blacklists_new_token`
- `test_authenticated_user_can_persist_supported_language`
- `test_invalid_language_is_rejected_without_changing_preference`
- `test_request_and_confirm_password_reset`
- `test_unknown_email_returns_same_generic_success`

## 5. Historical repository evidence

Historical results are useful provenance but are not a substitute for a current run because later uncommitted changes exist.

### 5.1 Messaging/security implementation run — 23 July 2026

`docs/command-results/2026-07-23-messaging-security.md` records:

- Django system check passed after an initial defect was corrected;
- migration consistency passed after explicit migration creation;
- 19 messaging tests passed;
- one notification throttle test passed;
- 14 investment/project tests passed;
- full backend: **58 tests passed**;
- focused backend: **46 tests passed**;
- migrations applied to a disposable in-memory test database;
- OpenAPI generation: zero errors and 22 warnings (16 unique);
- focused frontend: 8 tests passed;
- full frontend: 12 tests passed;
- TypeScript passed;
- production build passed after two corrected failures;
- disposable API smoke printed `SMOKE_OK` for login, messaging persistence, unread/read, participant denial, notifications, preferences, and logout blacklist;
- `git diff --check` passed.

Permitted wording: “A dated 23 July implementation log reports these passes against its then-current working tree.”

### 5.2 Localization run

`docs/command-results/localization.md` records:

- Django system/migration checks passed;
- disposable test migration succeeded;
- two language-preference API tests passed;
- full backend: **60 tests passed**;
- full frontend: **10 files, 21 tests passed**;
- production build passed;
- a desktop/mobile bilingual browser walkthrough passed after corrections;
- `git diff --check` passed.

The browser walkthrough intercepted APIs with disposable/fixture responses. It demonstrates localization behavior, not live backend integration or production deployment.

### 5.3 Earlier baseline

`docs/implementation-audit-before.md` reports an earlier branch baseline of:

- Django check and migration dry-run passed;
- **29 backend tests passed**;
- TypeScript passed;
- **4 frontend tests passed**.

That baseline predates the messaging/notification/security/localization work.

## 6. Test and evaluation evidence not executed or absent

### 6.1 Not executed in the completed graduation audit

- Django `check`;
- migration consistency check;
- backend test suite;
- OpenAPI generation against current source;
- frontend production build;
- Docker/Compose;
- PostgreSQL/Redis integration;
- SMTP delivery;
- browser E2E.

### 6.2 Not established anywhere as a reliable current result

- coverage percentage or an 80% threshold;
- Playwright E2E cases;
- real payment-provider sandbox/live tests;
- receipt, webhook, refund, escrow, disbursement, or reconciliation tests;
- penetration test or vulnerability scan;
- dependency/SBOM scan result;
- load, stress, endurance, or concurrency result;
- response-time/throughput/availability result;
- cross-browser matrix;
- WCAG/accessibility audit;
- private file-storage/malware scan;
- backup/restore/disaster-recovery exercise;
- production smoke/monitoring/uptime;
- native Arabic linguistic review;
- human usability/user acceptance evaluation.

`playwright.config.ts` and `playwright-fixture.ts` import `lovable-agent-playwright-config`, which is not declared in `package.json`, and no project E2E case was found. Treat Playwright as a non-operational stub.

## 7. Verified source-level protections

| Protection | Evidence | Qualification |
|---|---|---|
| Server-controlled staff authority | `User.save`; public serializers/views; tests | `is_staff` is authority |
| Public role restriction | `RegisterSerializer.validate_user_type` | investor/entrepreneur only |
| Password validation | registration/change/reset/admin reset | no MFA |
| Email normalization/case-insensitive auth | user model/backend/serializer | tests exist |
| Short access/rotating refresh JWT | `settings/base.py:102-109` | local-storage risk |
| Refresh blacklist/logout | Simple JWT blacklist and logout view | submitted refresh required |
| Enumeration-safe reset response | reset request view | actual mail unverified |
| Public project data minimization | reduced owner/project serializer | SSE/payment endpoints remain weak |
| Project/category/normal moderation permissions | backend permissions/read-only fields | admin path parity incomplete |
| Confirmed-only aggregate | investment services/signals | record is not money |
| Participant-scoped messages | querysets/checks; server sender | conversation creation gaps |
| Owner-scoped notifications | request-user filtering | in-app only |
| Throttle classes/rates | core throttles/settings | shared-cache operation unverified |
| Audit metadata sanitization | recursive forbidden fragments | producer coverage/immutability incomplete |
| Production HTTPS flags | `settings/prod.py` | configuration only |
| CORS exact-origin configuration | `base.py` | sample/port mismatch |

## 8. Security, privacy, and financial-integrity findings

The categories below describe current source, not an instruction to modify it in this handoff.

### 8.1 Critical

#### F-SEC-01 — Public SSE discloses confirmed-investment details

- `ProjectViewSet.get_queryset` returns any non-deleted project for the `events` action (`backend/apps/projects/views.py:84-85`).
- `events` uses `AllowAny` (`projects/views.py:286`) and looks up the project by slug.
- The Redis channel is project UUID-based and the response streams to an unauthenticated caller (`projects/views.py:287-326`).
- Published payload contains investor name, amount, date, and payment method (`backend/apps/investments/services.py:54-66`).

Risk: a caller who knows/guesses a non-deleted private project slug can probe existence and receive personal/financial event data. Public project visibility is not enforced at this endpoint.

#### F-SEC-02 — Payment-history authorization is too broad

- `payments` requires authentication but the action queryset includes any non-deleted project.
- It returns investor name, amount, date, and method (`projects/views.py:257-284`).
- It does not require staff, project owner, participating investor, or public project visibility.

Risk: any authenticated account with a slug can retrieve other users' confirmed-record details, including a non-public project.

#### F-FIN-01 — Zero-value record bypasses minimum validation

`InvestmentSerializer.validate` uses `if project and amount and amount < project.minimum_investment` (`backend/apps/investments/serializers.py:34-40`). Decimal zero is falsey, so the minimum branch is skipped. No database positive check constraint exists.

Risk: a zero record can enter the internal ledger, distort counts/workflows, and later be confirmed.

### 8.2 High

#### F-FIN-02 — Confirmed records remain owner-mutable/deletable

`InvestmentPermission` allows the investor owner and staff at object level; the normal viewset does not limit update/delete to pending. Writable fields include amount, quantity, transaction ID, method, and notes. Signals recalculate totals after changes/deletion.

Risk: history and displayed totals can be rewritten without an append-only correction/reversal event.

#### F-FIN-03 — Investment creation accepts any authenticated role

`InvestmentPermission.has_permission` accepts all authenticated accounts, and `perform_create` assigns the current user. The UI is narrower, but an entrepreneur can call the API.

Risk: bypass of intended role/business semantics, including self/related-project scenarios.

#### F-FIN-04 — “Confirmed” is not provider-confirmed money

No provider client, webhook, receipt object, signature verification, settlement/reconciliation, escrow, refund, disbursement, or custody code exists.

Risk: interface/report language can misrepresent an internal state as money received.

#### F-ADMIN-01 — Parallel moderation path omits side effects

Normal project verify/reject/status actions declare scoped throttling, notification, and/or audit. `backend/apps/projects/admin_views.py:85-139` performs parallel changes without equivalent calls.

Risk: sensitive state changes can avoid the controls expected by the normal path.

#### F-UPLOAD-01 — Uploaded files lack explicit private security controls

Project/KYC models use `FileField`/`ImageField` and local media. No explicit file-size limit, extension/MIME/signature validation, malware/quarantine process, private authorized download, retention/deletion policy, encryption/key ownership, or object storage is found.

Risk: malicious/oversized content, unauthorized file exposure, privacy/retention failures.

#### F-SCHEMA-01 — Current user schema is not reproducible from tracked files

`User` contains `website`/`timezone`, while the migration adding them is untracked: `backend/apps/users/migrations/0003_user_timezone_user_website.py`.

Risk: a clone of HEAD does not reproduce the current model schema, causing deployment/test drift.

#### F-AUDIT-01 — Audit event coverage and integrity are incomplete

Audit calls cover selected auth/project/payment-view events. Admin finance/user/project/media changes, many investment changes, messaging changes, notification actions, and password-reset confirmation are not comprehensively recorded. Rows have no database immutability/tamper evidence/retention/export/alert policy.

Risk: incomplete accountability for security and financial-state changes.

#### F-MSG-01 — Project conversation creation lacks object-scope rules

Project-conversation input validates object existence more than visibility/deletion and both parties' relation. Self-conversation can surface an uncaught service error, and manual page parsing can fail on invalid values.

Risk: unwanted project association, information leakage, and uncontrolled server error.

### 8.3 Medium

#### F-AUTH-01 — Browser token handling has XSS and refresh-edge risks

- access/refresh/user stored in local storage;
- no CSP configuration;
- parallel 401s have no single-flight refresh lock;
- refresh failure removes tokens but not always cached `user`;
- no-refresh-token 401 path does not run the same explicit cleanup;
- password changes do not explicitly invalidate all access tokens immediately.

#### F-THROTTLE-01 — Rate limits may be process-local

Default rates are:

- anonymous 60/minute;
- authenticated 180/minute;
- login 5/minute;
- registration 3/minute;
- refresh 10/minute;
- password change/reset 5/hour;
- message send 30/minute;
- conversation create 10/hour;
- notification read 120/minute;
- admin verification 30/hour.

No shared Django cache configuration is present; multi-instance global enforcement is unverified. Admin-prefixed moderation lacks the specialized throttle.

#### F-CONFIG-01 — Production defaults do not fail closed

- development fallback secret `dev-only-change-me`;
- sample secret `change-me`;
- CORS/frontend port mismatch;
- sample SQLite/localhost Redis conflict with Compose;
- no proxy header/CSP/secret manager/production database controls;
- no central logging/monitoring/health checks.

#### F-DATA-01 — Adjacent data invariants are incomplete

- project minimum≤goal, ROI/date rules absent;
- expected return can become stale;
- milestone percentage/release constraints absent;
- repayment schedule authority absent;
- several cached aggregate/rating fields are not synchronized;
- view count is request count, not unique visitor count.

#### F-NOTICE-01 — System-notification preference comment contradicts code

The service says system/security events remain allowed, but returns false immediately when `in_app_enabled` is off before checking the system type (`backend/apps/notifications/services.py:29-49`).

#### F-CMD-01 — Role-normalization command references nonexistent timestamp

`normalise_roles.py:46-55` calls `User.save(update_fields=["is_staff", "updated_at"])`, but `User` does not inherit `updated_at`. A non-dry-run is expected to fail; it was not executed.

## 9. Product-truth and quality findings

| Finding | Evidence | Report treatment |
|---|---|---|
| Marketing statistics are hard-coded | Home/About arrays | never use as results |
| Contact reports success without delivery | local delay/clear | disclose as recorded |
| Wallet/deposit/withdraw are local state | Settings | fixture-backed |
| Cards/billing history are hard-coded | Settings | fixture-backed |
| 2FA/session/login history is hard-coded | Settings | fixture-backed; no security claim |
| Entrepreneur investor list uses fabricated records | `fixtureInvestors` | fixture, not evaluation/sample |
| Entrepreneur dashboard message preview is hard-coded | dashboard | fixture despite real Messages page |
| Refund/keep-funds copy conflicts | locale FAQ entries | undefined future business rule |
| “Secure payment providers/bank-level encryption” copy | locale Contact FAQ | unsupported; provider absent |
| KYC fields/badges lack full workflow | User model/UI | storage/flag only |
| AI fields lack execution | Project model/admin | storage only |
| Email-notification toggle lacks delivery | disabled task | future |
| Docker/prod flags exist | source configuration | not deployment evidence |

## 10. Evaluation evidence that genuinely exists

### 10.1 Technical evaluation

Supported:

- repository-wide structure and source audit;
- source-to-requirement evidence mapping;
- current 24-test frontend run and TypeScript check;
- static inspection of 64 backend tests;
- historical dated backend/frontend/build/API/localization logs;
- architecture/API/data/RBAC derivation;
- source-level security/privacy/integrity findings.

Not supported:

- a statement that the complete system passed;
- operational payment/Redis/PostgreSQL/SMTP results;
- production readiness;
- secure/compliant certification.

### 10.2 Human evaluation

No evidence was found for:

- participant population/sample;
- recruitment or consent;
- ethics/supervisor approval;
- test environment and tasks;
- questionnaire/interview instrument;
- raw anonymized data;
- completion time/errors;
- Likert scores, means, percentages, confidence intervals, or qualitative themes;
- user acceptance or stakeholder approval.

Every human-evaluation result remains `[NOT VERIFIED]`. The MBLLS sample's questionnaire/results must not be copied.

### 10.3 Visual evaluation

The localization report records a fixture-backed-API desktop/mobile walkthrough. It can support a dated statement that bilingual direction and selected pages were exercised, but it cannot establish live backend integration.

The current repository contains conceptual figures and a few image artifacts, but no complete dated screenshot set tied to current routes, roles, build, synthetic data, and requirements.

## 11. Research-question findings

| RQ | Evidence-based finding | Boundary |
|---|---|---|
| RQ-01: requirements/architecture | A coherent React/DRF, role-oriented, bilingual platform architecture can be derived from routes, APIs, permissions, models, and services. | Stakeholder elicitation history is not verified |
| RQ-02: implementation extent | Public project discovery, account flows, project submission/moderation, internal records, dashboards, direct messaging, in-app notices, and staff administration are substantially present. | Many functions remain partial/backend-only/fixture; no money/AI/KYC completion |
| RQ-03: readiness limits | Critical privacy and financial-integrity findings, upload/audit/schema/config gaps, missing current backend/E2E/operational/human evidence prevent production claims. | This is a source audit, not a penetration/compliance certification |

## 12. Validity and reliability limitations

### Internal validity

- the working tree is materially uncommitted;
- backend tests were not rerun in the graduation audit;
- historical logs correspond to earlier states;
- static inspection may not reveal every runtime interaction;
- no database contents or production state were used.

### Construct validity

- internal “investment/payment/return” labels may not match legal/financial constructs;
- `view_count` is not unique visitors;
- internal `confirmed` is not settlement;
- frontend fixture success is not task success;
- test count is not coverage or quality by itself.

### External validity

- no user sample or production environment exists;
- no result can be generalized to Palestinian entrepreneurs/investors or other populations;
- local development behavior does not establish production reliability.

### Reliability/reproducibility

- Git branch/HEAD are recorded, but the working tree is dirty;
- an untracked migration affects schema;
- Python dependencies are ranged and local environment drifts;
- precise commands/dates in logs support partial repetition;
- no CI pipeline enforces reproducibility.

## 13. Required future evaluation, if approved

This is future academic work, not an existing result:

1. Supervisor-approved objectives and instrument.
2. Defined population, sample rationale, recruitment, inclusion/exclusion.
3. Consent, anonymity, withdrawal, storage, retention, and ethics process.
4. Dated build/environment, synthetic accounts, tasks, and facilitator protocol.
5. Raw anonymized observations/responses.
6. Predefined analysis method reporting positive, neutral, and negative outcomes.
7. Traceability to RQs/objectives.
8. Explicit non-generalization and study limitations.

Technical work needed before a meaningful readiness claim includes current backend/critical-regression execution, functional E2E, accessibility, load/concurrency, security, deployment, backup/restore, and provider-specific testing—but none should be described as completed.

## 14. Screenshot and demonstration evidence still required

Use synthetic data and exclude real email, phone, KYC/document, token, message, IP, or payment information. A defensible figure set would include:

1. English and Arabic landing pages at desktop width.
2. Arabic RTL mobile navigation.
3. Public project browse using active/verified local API data.
4. Public project detail with wording that identifies internal records rather than payments.
5. registration/login for investor and entrepreneur.
6. project submission stages.
7. staff review from draft to verified/active.
8. pending record and staff confirmation using synthetic data.
9. investor dashboard/ledger with status-aware totals.
10. entrepreneur dashboard/analytics.
11. persistent direct messaging between synthetic accounts.
12. in-app notifications and preference update.
13. staff users/projects/investments/milestones/repayments.
14. Swagger/OpenAPI page.
15. terminal captures of exact current test/type-check results.
16. clear labels on retained fixture-backed Settings/contact/investor-directory behavior.

Each screenshot should record route, date/build/commit, role, language, viewport, data source (local API/fixture), redactions, and related requirement/use case.

## 15. Readiness verdict

Sahmi has meaningful implementation and test assets and can be presented as an audited development-stage academic platform. It cannot be presented as a production financial platform, secure payment system, legally verified investment service, completed KYC service, deployed operation, or user-validated product.

**Evidence-safe verdict:** suitable for a controlled academic platform demonstration with full limitation disclosure; not suitable for real financial or personal-document use in its audited state.

