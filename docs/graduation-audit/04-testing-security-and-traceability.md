# Sahmi Testing, Security, and Traceability Audit

**Audit date:** 25 July 2026  
**Execution boundary:** no package installation, migration, database reset, external service, container, SMTP, Redis, PostgreSQL, payment or deployment call was performed.

## 1. Test evidence

### 1.1 Fresh results from this audit

| Check | Result | Scope and interpretation |
|---|---|---|
| `npm test -- --run` | Exit 0; **11 test files, 24 tests passed** | Current frontend working tree; Vitest 3.2.4/jsdom |
| `npx --no-install tsc --noEmit` | Exit 0 | Current TypeScript project type-check |

The initial sandboxed Vitest startup could not load `vitest.config.ts` because esbuild was denied host-directory traversal. The identical read-only command was rerun with local filesystem access and passed. No failed test case occurred in the successful run.

Current passing frontend test areas:

- administrator route access and server-confirmed staff handling;
- authentication/language synchronization;
- English/Arabic switching, document direction and locale persistence;
- localization resource coverage;
- persistent-message page loading, Arabic controls, duplicate-send prevention, user search and conversation creation;
- notification loading/read actions and Arabic rendering;
- notification preference and language persistence;
- password-reset request/confirmation payloads;
- logout cleanup;
- rotated refresh-token storage;
- one trivial placeholder test.

Warnings were limited to React Router future flags. They do not establish production correctness.

### 1.2 Backend test assets

Static discovery found **64 `test_` methods** across:

| Area | Representative covered behavior | Evidence |
|---|---|---|
| Users/auth | public roles, profile escalation, case-insensitive email, JWT rotation/blacklist, language, reset | `backend/apps/users/tests.py` |
| Projects | category permissions, moderation, public privacy, status rules | `backend/apps/projects/tests.py` |
| Investments | confirmation publication, total resync, status/project authorization, notifications | `backend/apps/investments/tests.py` |
| Messaging | deduplication, participant scope, spoof prevention, edit/delete/read, notification signal | `backend/apps/messaging/tests.py` |
| Notifications | owner scope, preferences, mark-all, throttling | `backend/apps/notifications/tests.py` |
| Audit | staff read access and recursive sanitization | `backend/apps/audit/tests.py` |
| Admin APIs | users, projects/assets/categories, investments, milestones, repayments, related-party rules | `backend/apps/core/tests.py` |

These tests were **not executed in this audit**. Django test setup creates a test database and applies migrations; executing it would violate the user's explicit no-migration rule. Static presence is not a pass result.

### 1.3 Historical repository evidence

Repository reports record earlier commands:

- `docs/command-results/2026-07-23-messaging-security.md` reports 58 full backend tests, 46 focused backend tests, 12 frontend tests, TypeScript/build/OpenAPI and a disposable-DB smoke pass;
- `docs/command-results/localization.md` reports 60 backend tests, 21 frontend tests, build and a mocked-API browser walkthrough;
- `docs/testing-report.md` summarizes part of those results.

They are useful provenance but precede additional uncommitted changes. They must be cited as **historical passes**, never as a current backend pass.

### 1.4 Manual and E2E evidence

- The localization report documents a headless desktop/mobile walkthrough with intercepted mock APIs. It supports a dated localization demonstration, not live backend integration.
- No current manual test protocol, signed acceptance record, usability session, production monitoring output, or current screenshot set was found.
- `playwright.config.ts` and `playwright-fixture.ts` import `lovable-agent-playwright-config`, not declared in `package.json`; no Playwright case was found. E2E is therefore configured only as a non-operational stub.

## 2. Coverage gaps and recommended test priorities

| Priority | Missing or inadequate test area | Required evidence |
|---|---|---|
| Critical | Public SSE access to private/unverified project and investor payment data | anonymous/authenticated authorization tests and payload privacy assertions |
| Critical | `/projects/{slug}/payments/` unrelated-account access | object-relationship denial tests |
| Critical | investment amount `0` and partial-update minimum validation | serializer/API boundary tests |
| High | investor editing confirmed amount/method/metadata or deleting confirmed record | state/immutability tests |
| High | entrepreneur/investor role restriction for investment creation | role matrix tests after business decision |
| High | normal vs admin project moderation side effects | audit, notification and throttle parity tests |
| High | project-conversation relationship, private/deleted project, inactive user and self-conversation | controlled 4xx and object-scope tests |
| High | upload size, MIME/signature, malicious file, private download and deletion | storage/security integration tests after controls exist |
| High | untracked website/timezone migration and fresh-checkout schema consistency | migration consistency in authorized CI |
| High | `normalise_roles` non-dry-run defect | command test; current `updated_at` field reference should fail |
| Medium | invalid/zero/negative messaging page numbers | 400 response tests |
| Medium | all aggregate-changing SSE cases and reconnect reconciliation | Redis integration tests |
| Medium | notification system-event behavior when in-app disabled | service test resolving comment/code conflict |
| Medium | expected-return recomputation after amount/ROI change | model/service invariant tests |
| Medium | milestone percentages/released amounts and repayment schedule authority | serializer/model/business-rule tests |
| Medium | dashboard totals excluding pending/canceled records | frontend calculation tests |
| Medium | contact form, 2FA/session/wallet/payment/billing controls | remove/label mocks or add real integration tests |
| Medium | API response envelope and refresh concurrency | contract and concurrent-request tests |
| Medium | audit completeness for all staff/financial/security mutations | event matrix tests |
| Medium | accessibility, responsive layout and RTL visual regression | automated scan plus manual keyboard/screen-reader/native review |
| Operational | Docker/Compose, production settings, health checks, backup/restore, SMTP, Redis/PostgreSQL | controlled non-production environment evidence |
| Operational | performance/load/concurrency | agreed targets, reproducible scripts and measured results |

No coverage percentage is available. An “80%” target in prior documents is aspirational and not a result.

## 3. Security and privacy protections

### 3.1 Verified protections

| Control | Evidence | Qualification |
|---|---|---|
| Server-controlled staff authority | `User.save` deliberately avoids auto-staff; role/staff fields read-only; registration rejects admin | Current source and privilege tests |
| Password validation | Django validators used for registration/change/reset/admin reset | Does not replace MFA |
| Case-insensitive normalized email | custom backend and model normalization | Tests exist |
| Short access/rotating refresh JWT | `settings/base.py:102-109`; blacklist app | Local-storage risk remains |
| Logout blacklist | `users/views.py:107-136` | Requires submitted refresh token |
| Enumeration-safe reset response | `PasswordResetRequestView` | Delivery not verified |
| Public project data minimization | public serializer omits contacts/KYC/private docs/notes | SSE/payment gaps remain |
| Project/category/normal-status permissions | backend permission classes and read-only fields | Admin and related-party paths need parity review |
| Participant-scoped messaging | filtered querysets, explicit participant checks, server-derived sender | Conversation creation relationship gaps remain |
| Owner-scoped notifications | views resolve through `request.user` | In-app only |
| Throttling | global anonymous/user plus login/register/refresh/reset/message/conversation/notification/admin scopes | Cache topology not verified |
| Audit sanitization | recursive forbidden key fragments | Audit coverage/immutability incomplete |
| Production HTTPS flags | SSL redirect, secure session/CSRF cookies and HSTS in `prod.py` | No production deployment proof |
| CORS allow-list configuration | environment-derived origins | Example/config mismatch |

### 3.2 Authentication and token handling observations

Positive:

- access token lifetime is 15 minutes;
- refresh lifetime is 7 days;
- refresh rotation and blacklist-after-rotation are enabled;
- access token is attached as a bearer header;
- password-reset tokens use Django's default token generator;
- password reset and authentication endpoints are scoped-throttled.

Gaps:

- access, refresh and serialized user are stored in `localStorage` (`src/services/api.ts:79-81,94-97`; `authService.ts:69-71`), increasing XSS impact;
- no CSP header/configuration was found;
- no refresh single-flight mechanism prevents parallel refresh races;
- interceptor refresh failure removes tokens but not cached `user`;
- no-refresh-token 401 path does not perform the same explicit cleanup/redirect;
- no MFA backend exists despite active-looking 2FA UI;
- current session list, revocation and login history are hard-coded;
- access tokens remain valid until expiry after password change/reset unless a separate token policy is added;
- recovery email is a local form field only.

## 4. Authorization and privacy gaps

### 4.1 Project payments and SSE

`ProjectViewSet.get_queryset` returns any non-deleted project for `payments` and `events` actions (`projects/views.py:84-85`).

- `payments` requires authentication, but does not require investor participation, project ownership, staff, or public visibility; it returns investor name, amount, date and method (`projects/views.py:257-284`).
- `events` is `AllowAny` and subscribes by project UUID; a known private project slug can be probed (`projects/views.py:286-326`).
- the published event includes investor name, amount and payment method (`investments/services.py:54-66`).

This is the highest-confidence privacy defect in the audited working tree.

### 4.2 Investment integrity

- `if project and amount` allows decimal zero to bypass minimum validation (`investments/serializers.py:34-40`);
- `InvestmentPermission.has_permission` accepts every authenticated user (`permissions.py:4-13`);
- owner investors may update/delete their own records without a pending-only restriction;
- amount, quantity, method, transaction ID and notes remain writable after confirmation;
- administrative CRUD can directly write statuses/financial values;
- no provider/webhook/receipt proves payment;
- expected return is not consistently recomputed after later changes.

### 4.3 Messaging

- direct creation does not require the selected user to be active;
- project conversations validate only ID existence, not project visibility/deletion or either party's relation;
- self-conversation can propagate uncaught `ValueError`;
- manual message pagination can raise on invalid integer/range;
- no blocking/reporting/moderation/retention/export policy exists;
- no attachments exist, which is a limitation rather than a security defect.

### 4.4 Administration and audit

- the staff admin project moderation path omits the normal path's audit, notifications and verification throttle;
- audit producers exist only in selected user/project/payment-view code; admin user changes, admin finance CRUD, normal investment mutations, messages, notifications and password-reset confirmation are not comprehensively logged;
- audit rows have no database immutability/tamper evidence, retention or export/alert policy;
- `X-Forwarded-For` first value is accepted by the audit service without a documented trusted proxy;
- client-provided `X-Request-ID` is retained up to 64 characters.

## 5. Validation and data-integrity observations

| Area | Present | Gap |
|---|---|---|
| Passwords | Django validation | no MFA; session invalidation policy incomplete |
| Projects | positive goal/minimum/duration in normal serializer | no minimum≤goal, ROI range, date consistency or model constraints |
| Investments | project verified/active and below-minimum check | zero bug, role gap, confirmed mutability |
| Milestones | typed fields/read-only workflow normal path | no percent total/range/release constraint or owner transition |
| Repayments | typed fields/read-only status normal path | related parties can define amount/schedule; no authoritative engine |
| Messages | nonblank, trimmed, max 5,000 | invalid page and conversation relation handling |
| Files | Django `ImageField`/`FileField` | no explicit size, extension/MIME/signature, malware, quarantine or private download policy |
| Email reset | valid email and token/password checks | SMTP and delivery operational state unverified |

Database fields alone do not provide legal or business validation.

## 6. CORS, CSRF, secrets, logging and rate limiting

### CORS and CSRF

- base settings allow environment-derived exact origins and include local ports 5173 and 8080 by default;
- `backend/.env.example` includes only 5173, while Vite uses 8080;
- `CORS_ALLOW_CREDENTIALS=True`, although bearer JWT is stored in local storage and sent as a header;
- Django CSRF middleware is enabled. JWT bearer API requests are not authenticated by a cookie, while Django admin/session surfaces remain CSRF-relevant;
- no production origin or proxy configuration is verified.

### Secrets

- `DJANGO_SECRET_KEY` has a development fallback `dev-only-change-me`;
- sample backend secret is `change-me`;
- SMTP password is environment-based and blank in the sample;
- no obvious live provider credential was found in inspected configuration, but this is not a formal secret-history scan;
- production must fail closed on missing/weak secret and must use an approved secret manager `[TEAM CONFIRMATION REQUIRED]`.

### Logging

- selected user/project actions write structured `AuditLog` rows;
- password/token/message/document-content key fragments are removed recursively;
- Redis publication/SSE failure uses `print`;
- no central `LOGGING` configuration, aggregation, metrics, alerting, redaction review or retention policy was found;
- password-reset email failure uses `logger.exception`, but no operational sink is verified.

### Rate limiting

- global default rates: anonymous 60/min, user 180/min;
- scoped defaults: login 5/min, register 3/min, refresh 10/min, password change/reset 5/hour, message send 30/min, conversation create 10/hour, notification read 120/min, admin verification 30/hour;
- the rates are configurable and tests exist for notification throttling;
- no explicit shared Django cache configuration was found. Default local-memory enforcement is not sufficient as a global multi-instance control;
- admin-prefixed moderation actions do not declare the normal action's specialized throttle.

Rates are configuration defaults, not measured security guarantees.

## 7. Deployment and operational security

Present but unverified:

- Gunicorn Dockerfile command;
- PostgreSQL/Redis Compose services;
- `prod.py` HTTPS redirect, secure cookies and HSTS;
- allowed hosts and CORS environment variables.

Missing or unresolved:

- frontend production service/build delivery;
- reverse proxy/TLS configuration and `SECURE_PROXY_SSL_HEADER`;
- Content Security Policy and other browser headers;
- production database SSL/pooling/backup/restore;
- private media/object storage and access URLs;
- Celery worker if tasks become active;
- health/readiness checks;
- centralized logs, monitoring, alerts and incident response;
- secret rotation and least-privilege service accounts;
- CI/CD and deployment approvals;
- dependency vulnerability/SBOM process;
- privacy notice, terms, retention and data deletion/export;
- verified domain/live URL.

## 8. Research-objective and requirement traceability

### 8.1 Research alignment

| Research item | UI evidence | API/backend logic | Data evidence | Test/evaluation | Finding |
|---|---|---|---|---|---|
| RQ-01 / OBJ-01: requirements and architecture for a bilingual role-oriented prototype | routes, i18n, public/role pages | URL modules, permissions, serializers | domain models | repository/document audit | Architecture and requirements can be derived; stakeholder research is not evidenced |
| RQ-02 / OBJ-02–03: extent of implementation | project/auth/dashboard/messages/notifications/admin UI | all domain apps and services | User, Project, Investment, Milestone, Repayment, Messaging, Notification, Audit | 24 current frontend tests; static backend tests | Substantial prototype; many workflows real, some backend-only/mock |
| RQ-03 / OBJ-04: readiness limitations | mocked settings/contact/investor cards and misleading copy | privacy/auth/integrity/config gaps | mutable financial records/local files | no current backend/E2E/usability/performance/deployment result | Not production-ready; user evaluation remains future work |

### 8.2 Detailed traceability

| Requirement | UI | API | Backend logic | Database | Test evidence | Status |
|---|---|---|---|---|---|---|
| FR-006 registration | Register page | `POST auth/register` | Register serializer/view | User | backend tests exist | Implemented |
| FR-007–009 session | Login/nav/auth hook | login/refresh/logout/me | JWT views/settings | User + blacklist | current logout/rotation frontend tests; backend tests exist | Implemented |
| FR-014 project submit | StartProject | `POST projects` | owner-derived create | Project/files | backend tests exist | Implemented |
| FR-017 moderation | admin projects | normal/admin actions | verification/status | Project | backend tests exist | Partial parity |
| FR-021 investment | detail form | `POST investments` | serializer/create | Investment | backend tests exist | Partial validation/role |
| FR-026 totals | cards/charts | project/investment reads | aggregate service/signals | Investment → Project | backend tests exist | Implemented source |
| FR-027 SSE | ProjectDetails | `GET events` | Redis stream/publish | no event history | backend publish test | Partial/privacy |
| FR-031/034 milestone/repayment | staff pages | CRUD viewsets | related-party permissions | Milestone/Repayment | admin tests exist | Backend/staff UI partial |
| FR-035–037 messaging | MessagesPage | conversations/messages | participant services/views | Conversation/Participant/Message | 4 current frontend tests; backend tests exist | Implemented |
| FR-040 notifications | DashboardLayout/Settings | notifications endpoints | views/services | Notification/Preference | current frontend tests; backend tests exist | Implemented |
| FR-044 audit | no dedicated primary UI | audit logs | explicit logger calls | AuditLog | backend sanitizer/access tests | Partial |
| FR-045 contact | ContactPage | none | none | none | none | Mock |
| FR-046 KYC | settings/admin fields | user/admin fields | no full workflow | User KYC fields/file | no workflow test | Storage only |
| FR-047 AI | admin project fields | admin CRUD | no classifier | Project AI fields | field CRUD only | Storage only |

## 9. Screenshots and evaluation evidence required from the team

All screenshots should use synthetic data and exclude real email, phone, KYC/document, token, message or payment information.

Required academic figures:

1. English and Arabic landing page at desktop width.
2. Arabic RTL mobile navigation.
3. public project browse with active/verified API data.
4. public project detail and explicit “internal record, not payment” wording after correction.
5. investor/entrepreneur registration and login.
6. entrepreneur project submission stages.
7. staff review showing draft → verified/active.
8. pending investment record and staff confirmation using synthetic data.
9. investor dashboard/transaction ledger with status-aware totals.
10. entrepreneur project dashboard/analytics.
11. persistent direct messaging between synthetic users.
12. in-app notifications and preference update.
13. staff users/projects/investments/milestones/repayments pages.
14. Swagger/OpenAPI page.
15. terminal capture for the current 24-test and TypeScript results.
16. clearly labelled mocked/settings/contact behavior if retained in the demonstration.

Still-required evaluation package:

- supervisor-approved evaluation objectives and instrument;
- participant population/sample and recruitment rationale;
- consent, anonymity, storage and ethics process;
- date, environment, tasks and facilitator protocol;
- raw anonymized responses;
- calculation method and complete results;
- negative/neutral as well as positive findings;
- screenshots/observations tied to participant IDs, not names;
- research-question/objective mapping;
- limitations and non-generalization statement.

Until supplied, every usability score, percentage, sample size, satisfaction statement and stakeholder-acceptance claim is `[NOT VERIFIED]`.

## 10. Security/testing verdict

Sahmi has meaningful source-level safeguards and a growing automated test base. The fresh frontend checks are healthy. However, the public event/payment privacy defects, investment integrity gaps, simulated security/payment UI, upload controls, incomplete audit trail, schema drift, lack of current backend/E2E execution and absent operational evaluation prevent a security or production-readiness claim.

**Verdict:** acceptable as a controlled academic prototype with full disclosure; not acceptable for real financial or personal-document use.

