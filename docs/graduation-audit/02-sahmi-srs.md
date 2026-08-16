# Repository-Verified Software Requirements Specification: Sahmi

**Version:** audit draft 1.0  
**Date:** 25 July 2026  
**Baseline:** working tree on `feature/backend-messaging-security-hardening` at HEAD `7a6cb1e57eb76c6fecfde015a1097c41ac69f6d3`  
**Supersession note:** this SRS corrects stale implementation statements in the root `SRS.md`; it does not modify or replace that file.

## 1. Purpose and scope

This specification defines the observable and target requirements of Sahmi, a bilingual web platform for presenting Palestinian entrepreneurial projects, recording intended investments, moderating projects, and supporting role-oriented communication and tracking.

The implemented system is a platform. An `Investment` row and a `confirmed` status are internal records; they are not evidence of transferred, settled, escrowed, refunded, or legally owned funds. Sahmi is not verified as a deployed, licensed, regulated, secure, or production-ready financial service.

### 1.1 Status legend

| Status | Meaning |
|---|---|
| Verified and implemented | Frontend/backend or relevant layer exists and is supported by repository evidence |
| Partially implemented | Useful behavior exists, but a requirement, workflow, or trust boundary is incomplete |
| Frontend-only or fixture-backed | UI exists without authoritative backend persistence/operation |
| Backend-only | API/data behavior exists without a complete user-facing workflow |
| Configured but not operationally verified | Configuration exists; current end-to-end operation was not demonstrated |
| Planned/future work | Normative target not implemented |
| Claimed in documentation but not found in code | Existing prose/UI claim has no implementation evidence |

## 2. Stakeholders and user roles

| Stakeholder/role | Interest and verified capability |
|---|---|
| Visitor | Reads marketing pages, active/verified project listings and public project details; may register/login |
| Investor account | May browse and submit internal investment records, view own records/dashboard, use direct messages, notifications and settings |
| Entrepreneur account | May submit and manage owned projects, view project investment data and analytics, use direct messages, notifications and settings |
| Staff administrator | Django `is_staff` user; accesses REST admin workspace, all project/investment data, moderation and CRUD |
| Superuser | Django administrative authority; has framework-level permissions in addition to staff behavior |
| Project team | Develops, tests, documents and maintains the platform |
| Supervisor/examiners | Evaluate academic method, evidence, scope and conclusions |
| Intended payment/KYC/legal operators | Not yet defined; `[TEAM CONFIRMATION REQUIRED]` |
| Data subjects | Users, founders, investors and message participants whose personal or uploaded data is stored |

`user_type` describes investor, entrepreneur, or admin-facing account type. `is_staff` is the actual backend administrative boundary. Public registration and profile update do not grant staff.

## 3. Assumptions and constraints

### 3.1 Verified constraints

- Frontend: React/TypeScript single-page application.
- Backend: Django REST Framework JSON API under `/api/v1/`.
- Authentication: JWT bearer access and rotating refresh tokens.
- Browser token storage: local storage.
- Default database: SQLite; PostgreSQL is configurable and present in Compose.
- Live confirmed-investment updates: Redis Pub/Sub and SSE, with frontend polling after SSE failure.
- File storage: local Django media filesystem.
- In-app notification delivery: database and polling.
- Response formatting: most DRF responses use `StandardJSONRenderer`; frontend also tolerates plain auth payloads.
- Project identifiers in public application routes and normal project API detail are slugs.
- The audited working tree is dirty and includes an untracked user migration.

### 3.2 Unverified assumptions

- Production use of PostgreSQL, Redis, SMTP, Gunicorn, TLS termination or a domain is `[NOT VERIFIED]`.
- Legal classification of contributions, returns, fees, ownership, KYC and refunds is `[TEAM CONFIRMATION REQUIRED]`.
- Actual stakeholder interviews, sprint records, user research and usability evaluation are `[NOT VERIFIED]`.
- Performance, availability, concurrency and retention targets are `[TEAM CONFIRMATION REQUIRED]`.

## 4. Functional requirements

### 4.1 Public discovery and localization

| ID | Requirement | Status | Repository evidence and qualification |
|---|---|---|---|
| FR-001 | The system shall allow visitors to list active, verified, non-deleted projects and filter/order them through supported query parameters. | Verified and implemented | `backend/apps/projects/views.py:67-83`; `src/pages/BrowseProjects.tsx`; `src/services/projectsService.ts:135` |
| FR-002 | The system shall allow public retrieval only of active, verified project details; the owner and staff may retrieve a non-public owned project. | Verified and implemented | `projects/views.py:73-83`; `PublicProjectSerializer`, `projects/serializers.py:172-210`; privacy test |
| FR-003 | Public project responses shall exclude private owner contact/KYC data, verification notes and private document URLs. | Verified and implemented | `ProjectOwnerSummarySerializer`, `projects/serializers.py:75-83`; public serializer; `PublicProjectPrivacyTests` |
| FR-004 | The application shall provide English and Arabic resources, persist language choice, and set document language/direction. | Partially implemented | `src/i18n/`, `LanguageSwitcher.tsx`, `auth-language-sync.test.tsx`, localization tests; native/full-copy review not performed |
| FR-005 | Homepage/project statistics presented as factual platform outcomes shall be derived from authoritative data. | Planned/future work | Current `HomePage.tsx:61-63` and `AboutPage.tsx:78-80` values are hard-coded |

### 4.2 Accounts and sessions

| ID | Requirement | Status | Repository evidence and qualification |
|---|---|---|---|
| FR-006 | A visitor shall register only as investor or entrepreneur with validated password and normalized unique email. | Verified and implemented | `users/serializers.py:41-88`; `users/models.py:62-73`; registration tests |
| FR-007 | A user shall authenticate using email/password and receive access token, rotating refresh token and user representation. | Verified and implemented | `users/views.py:61-105`; `EmailTokenObtainPairSerializer`; `authService.ts:64-72` |
| FR-008 | The client shall attach bearer tokens and attempt one refresh after an eligible 401. | Verified and implemented | `src/services/api.ts:91-142` |
| FR-009 | Logout shall attempt to blacklist the refresh token and shall remove local credentials even if the request fails. | Verified and implemented | `users/views.py:107-136`; `authService.ts:79-91`; `logout.test.ts` |
| FR-010 | An authenticated user shall view/update permitted profile fields without changing role, staff, superuser, groups, permissions, KYC status or financial aggregates. | Verified and implemented | `UserSerializer`, `users/serializers.py:13-29`; `MeView`, `users/views.py:139-188`; privilege tests |
| FR-011 | An authenticated user shall change password after supplying the current password and valid matching replacement. | Verified and implemented | `PasswordChangeSerializer`, `users/serializers.py:90-115`; Settings connection `SettingsPage.tsx:187-204` |
| FR-012 | A visitor shall request and confirm password reset without account enumeration. | Configured but not operationally verified | `users/views.py:193-258`; forgot/reset pages; frontend tests passed; SMTP not exercised |
| FR-013 | The system shall offer real 2FA, recovery email, session listing/revocation, and login history before those controls are presented as active. | Frontend-only or fixture-backed | Hard-coded/local controls at `SettingsPage.tsx:723-883`; no backend model/API |

### 4.3 Project lifecycle

| ID | Requirement | Status | Repository evidence and qualification |
|---|---|---|---|
| FR-014 | An entrepreneur or staff user shall create a project, owned by the authenticated user, initially draft and unverified. | Verified and implemented | `projects/permissions.py:4-12`; `ProjectViewSet.perform_create`; `StartProject.tsx` |
| FR-015 | An owner or staff user shall update a project while normal clients cannot write moderation, aggregate or AI fields. | Verified and implemented | `ProjectPermission`; `ProjectSerializer.read_only_fields`, `projects/serializers.py:131-138` |
| FR-016 | An owner or staff user shall soft-delete through the normal project API. | Verified and implemented | `projects/views.py:137-146`; `Project.deleted_at` |
| FR-017 | Staff shall verify/activate, reject/fail, or set an allowed operational project status. | Partially implemented | normal actions `projects/views.py:148-243`; admin actions `projects/admin_views.py:85-139`; admin path lacks equivalent audit/notification/throttle |
| FR-018 | Staff shall manage project images/documents and categories. | Verified and implemented | admin viewsets and `adminProjectsService.ts:207-312`; admin UI |
| FR-019 | Project financial fields shall enforce coherent ranges, including goal > 0, minimum > 0 and ≤ goal, ROI policy, and valid dates. | Partially implemented | goal/minimum/duration positive checks exist at `projects/serializers.py:149-169`; cross-field/model constraints are absent |
| FR-020 | A project-detail view count shall have a documented counting rule that avoids presenting refetches as unique people. | Partially implemented | every eligible retrieve increments at `projects/views.py:92-101`; no deduplication rule |

### 4.4 Investment records and funding totals

| ID | Requirement | Status | Repository evidence and qualification |
|---|---|---|---|
| FR-021 | An authorized investor-role user shall create a pending investment record for an active, verified project with a positive amount meeting the minimum. | Partially implemented | project/status/minimum validation exists at `investments/serializers.py:34-53`; any authenticated role may create, and zero bypasses the truthiness check |
| FR-022 | Normal clients shall not directly set investment status, expected/actual return or return-received time. | Verified and implemented | `InvestmentSerializer`, `investments/serializers.py:11-32` |
| FR-023 | An investor shall see own investments; an entrepreneur shall see investments in owned projects; staff shall see all. | Verified and implemented | `investments/views.py:21-34` |
| FR-024 | An investor may cancel only an owned pending record; staff may confirm only a pending record through the dedicated actions. | Verified and implemented | `investments/views.py:80-153` |
| FR-025 | A non-staff investor shall not alter amount, method, transaction metadata or notes after submission unless a defined correction workflow authorizes it. | Partially implemented | current owner object permission and serializer allow edits, including after confirmation |
| FR-026 | Project funded amount and investor count shall derive only from confirmed records and resynchronize after relevant saves/deletes. | Verified and implemented | `investments/services.py:12-36`; `signals.py:21-44`; backend tests exist |
| FR-027 | A transition into confirmed shall publish a project update when Redis is available; loss of Redis shall not prevent database state. | Partially implemented | publish service catches Redis error; SSE/polling exists; not operationally run in this audit |
| FR-028 | Live updates shall notify clients about every aggregate-changing event or cause regular reconciliation regardless of SSE connection health. | Partially implemented | only “became confirmed” publishes; client polling starts only after SSE error |
| FR-029 | Confirmed-payment details shall be visible only under an approved privacy policy and project relationship rule. | Partially implemented | `/payments/` requires authentication but any authenticated user can access a known non-deleted project slug |
| FR-030 | Investment confirmation shall not be described as provider-confirmed money unless an external payment/receipt verification workflow supplies evidence. | Planned/future work | no provider, webhook, receipt or settlement code |

### 4.5 Milestones and repayments

| ID | Requirement | Status | Repository evidence and qualification |
|---|---|---|---|
| FR-031 | An owner/staff user shall manage project milestone descriptive data. | Backend-only | `MilestoneViewSet`, `investments/views.py:156-195`; staff UI only |
| FR-032 | Milestone status, completion and funding release shall change through an explicit authorized workflow with percentage/amount constraints. | Planned/future work | normal serializer makes fields read-only; no non-admin transition action or aggregate constraint |
| FR-033 | Related investors/owners and staff shall retrieve repayment records scoped to their involvement. | Backend-only | `RepaymentViewSet`, `investments/views.py:198-247` |
| FR-034 | Repayment schedules, amounts, paid status and transaction proof shall be server-authoritative. | Partially implemented | workflow fields are read-only normally, but either related party can create/edit amount/schedule/method/notes; no payment engine |

### 4.6 Messaging and notifications

| ID | Requirement | Status | Repository evidence and qualification |
|---|---|---|---|
| FR-035 | An authenticated user shall search active users and create/reuse a direct conversation. | Verified and implemented | `messaging/views.py:114-132,189-205`; service `get_or_create_direct_conversation`; UI/service |
| FR-036 | Only conversation participants shall list/retrieve messages, send, mark read, mute or archive. | Verified and implemented | participant-filtered querysets and checks in messaging views/services |
| FR-037 | Only the sender shall edit or soft-delete a message; deleted body shall not be returned. | Verified and implemented | `messaging/views.py:255-296`; `MessageSerializer.get_body`; backend tests |
| FR-038 | Project conversations shall be created only when both parties have an approved relation to the selected visible project. | Partially implemented | current serializer checks existence only at `messaging/serializers.py:121-148` |
| FR-039 | Messaging shall reject self-conversation and malformed pagination with a controlled 4xx response. | Partially implemented | service raises `ValueError`; create path does not catch it; raw `int()` at `messaging/views.py:214-224` |
| FR-040 | A user shall list owner-scoped in-app notifications, obtain unread count, mark one/all read and persist preferences. | Verified and implemented | notification views/services, `notificationService.ts`, DashboardLayout/Settings; current frontend tests passed |
| FR-041 | Notification email or push shall be described as active only when delivery is implemented and verified. | Planned/future work | email task explicitly disabled; no push |

### 4.7 Administration, audit and support

| ID | Requirement | Status | Repository evidence and qualification |
|---|---|---|---|
| FR-042 | Staff shall CRUD users while preventing self-lockout and last-active-administrator removal. | Verified and implemented | `AdminUserViewSet`, `users/admin_views.py`; admin tests |
| FR-043 | Staff shall CRUD projects/assets/categories/investments/milestones/repayments through authenticated admin APIs. | Verified and implemented | `core/admin_urls.py`; admin services/pages and tests |
| FR-044 | Security- and finance-relevant changes shall create sanitized, immutable, queryable audit events. | Partially implemented | model/service/read API and sanitizer exist; event coverage incomplete and rows are not tamper-evident |
| FR-045 | A contact-form success state shall mean that the request was actually persisted or delivered. | Frontend-only or fixture-backed | `ContactPage.tsx:107-116` only records success |
| FR-046 | KYC submission, private storage, review, decision, retention and deletion shall follow an approved policy. | Planned/future work | fields/admin flags only |
| FR-047 | AI classification/recommendation shall require an implemented model/provider, invocation, review and evaluation process. | Backend-only | database/admin storage fields only |

## 5. Non-functional requirements

| ID | Requirement | Status | Evidence/gap |
|---|---|---|---|
| NFR-001 | Every protected operation shall enforce authorization on the backend independent of route visibility. | Partially implemented | permissions are widespread; payment/event/project-conversation gaps remain |
| NFR-002 | Administrative authority shall be based on server-controlled `is_staff`, not client-supplied role. | Verified and implemented | user model/serializers/views; admin tests |
| NFR-003 | Access tokens shall be short-lived; refresh tokens shall rotate and old tokens shall be blacklisted. | Verified and implemented | `settings/base.py:102-109` |
| NFR-004 | Browser credential storage shall be protected against XSS, with a documented token-storage/CSP decision. | Partially implemented | local storage is used; no CSP configuration found |
| NFR-005 | Authentication and high-risk endpoints shall have configurable rate limits backed by production-suitable shared cache. | Configured but not operationally verified | throttle classes/rates exist; multi-instance cache deployment not verified |
| NFR-006 | Public/API responses shall minimize personal, financial and document data. | Partially implemented | public serializer is improved; SSE and payment history disclose data |
| NFR-007 | Uploaded files shall enforce size/type limits, private access, malware handling and retention. | Planned/future work | File/ImageFields exist; explicit controls not found |
| NFR-008 | Financial quantities shall preserve decimal precision and enforce model/API invariants. | Partially implemented | DecimalFields exist; zero/cross-field/update issues remain |
| NFR-009 | The UI shall provide loading, empty, error and retry feedback for principal API-backed workflows. | Partially implemented | present in major list/message/notification pages; full route review not user-tested |
| NFR-010 | English and Arabic interfaces shall support logical alignment and RTL/LTR without changing stored codes. | Partially implemented | implemented infrastructure/tests; native visual review needed |
| NFR-011 | Principal workflows shall meet an agreed accessibility target such as WCAG level `[TEAM CONFIRMATION REQUIRED]`. | Not verified | no formal accessibility audit |
| NFR-012 | API list endpoints shall paginate and cap page size. | Verified and implemented | `core/pagination.py`, max 100; messaging uses manual paging |
| NFR-013 | Database-heavy endpoints shall avoid obvious N+1 access by using related-object loading where practical. | Partially implemented | many viewsets use `select_related/prefetch_related`; no query benchmark |
| NFR-014 | System failures shall use structured logging without sensitive content. | Partially implemented | audit sanitization/logger exists; Redis paths use `print`, no centralized logging config |
| NFR-015 | A production deployment shall enforce strong secrets, allowed hosts, TLS, secure cookies/HSTS, database/storage backup and monitoring. | Configured but not operationally verified | minimal `prod.py`; no deployment/backup/monitoring evidence |
| NFR-016 | The project shall have reproducible frontend/backend dependency environments. | Partially implemented | frontend lock exists; Python ranges are unlocked and local Pillow violates declared range |
| NFR-017 | Critical authorization, financial, privacy and workflow rules shall have automated regression tests. | Partially implemented | many static backend tests and 24 passing frontend tests; gaps and no fresh backend run/coverage |
| NFR-018 | Performance, availability, response-time and concurrency targets shall be measured before being claimed. | `[NOT VERIFIED]` | no benchmark/load/production data |

## 6. Business rules

| ID | Business rule | Current status/evidence |
|---|---|---|
| BR-001 | Public account types are investor and entrepreneur only. | Enforced by `RegisterSerializer`. |
| BR-002 | Staff authority is controlled by `is_staff`; `user_type=admin` alone is not authority. | Enforced in current hardened model/serializers. |
| BR-003 | Only entrepreneurs or staff create projects through the normal API. | Enforced. |
| BR-004 | A new normal project is draft/unverified; only staff verification makes it verified/active. | Enforced. |
| BR-005 | Public project list/detail includes active, verified, non-deleted projects only. | Enforced; owner/staff exception for detail. |
| BR-006 | Owner deletion through the normal API is soft; admin REST deletion is hard. | Implemented but inconsistent; policy requires `[TEAM CONFIRMATION REQUIRED]`. |
| BR-007 | Normal clients cannot write project moderation or aggregate fields. | Enforced. |
| BR-008 | A normal investment begins pending and status is server-controlled. | Enforced, but staff admin CRUD can set status. |
| BR-009 | Only confirmed investment rows count toward project funded amount and distinct investor count. | Enforced by aggregate service. |
| BR-010 | `confirmed` means an internal database state, not proven settlement. | Required interpretation; no gateway exists. |
| BR-011 | Only an owned pending investment may be canceled by the investor. | Enforced. |
| BR-012 | Only staff may invoke dedicated confirmation. | Enforced. |
| BR-013 | Investment amount must be positive and at least project minimum. | Not fully enforced because zero bypasses validation. |
| BR-014 | An investor must not change a confirmed financial record without an auditable correction workflow. | Not enforced. |
| BR-015 | Only conversation participants access messages; only sender edits/deletes. | Enforced for persistent messaging APIs. |
| BR-016 | Notification reads/preferences are owner-scoped. | Enforced. |
| BR-017 | Refund, flexible funding, all-or-nothing, fees, returns and disbursement rules are undefined. | `[TEAM CONFIRMATION REQUIRED]`; contradictory UI copy must not govern behavior. |
| BR-018 | KYC and “verified” meaning require an approved review standard. | `[TEAM CONFIRMATION REQUIRED]`; current flags do not establish legal identity assurance. |

## 7. Use cases and user stories

### 7.1 Use-case catalog

| ID | Use case | Primary actor | Preconditions | Outcome/status |
|---|---|---|---|---|
| UC-001 | Browse projects | Visitor | None | Active/verified projects shown; implemented |
| UC-002 | Register and log in | Visitor | Valid credentials/data | Account/JWT session; implemented |
| UC-003 | Maintain profile/language/password | User | Authenticated | Partial account maintenance |
| UC-004 | Submit project | Entrepreneur/staff | Authenticated and authorized | Draft project; implemented |
| UC-005 | Review project | Staff | Staff account, existing project | Verify/reject/status; partial consistency |
| UC-006 | Record intended investment | Authenticated user | Active verified project | Pending record; role/zero gaps |
| UC-007 | Confirm/cancel investment | Staff/investor | Pending owned record | Status change and totals/notification |
| UC-008 | View dashboards/transactions | Role account | Authenticated | Derived records/charts; some misleading/fixture data |
| UC-009 | Message another user | Authenticated user | Search result/participant | Persistent direct conversation |
| UC-010 | Read/manage notifications | Authenticated user | Existing notification | Owner-scoped state/preferences |
| UC-011 | Administer records | Staff | Staff account | CRUD; implemented, incomplete audit coverage |
| UC-012 | Contact support | Visitor | Form data | Recorded only; no delivery |

### 7.2 Key flows

#### UC-004: Submit and moderate a project

1. Entrepreneur completes the five-step client form.
2. Client posts multipart data to `/api/v1/projects/`.
3. Backend derives the owner from `request.user`.
4. Project remains draft/unverified.
5. Staff reviews through the admin UI.
6. Staff verifies, rejects, or changes status.
7. **Exception:** the admin-prefixed moderation path does not currently emit the same audit/notification/throttle behavior as the normal staff action.

#### UC-006/007: Record and confirm an investment

1. Authenticated user opens an active, verified project.
2. Client posts project UUID, amount and `bank_transfer`.
3. Backend creates a pending record and in-app notifications.
4. Staff later confirms a pending record or investor cancels an owned pending record.
5. Confirmed totals are recalculated.
6. Entry into confirmed schedules a Redis event after commit.
7. **Boundary:** no money, receipt or provider is verified.

#### UC-009: Direct messaging

1. User searches active users by name/business.
2. User selects another user.
3. Backend creates or reuses a stable direct conversation.
4. Participants list and post messages.
5. Recipient obtains a generic in-app notification.
6. Sender may edit/soft-delete through backend endpoints, although the current UI does not expose those controls.

### 7.3 User stories

- **US-001:** As a visitor, I want to browse only approved public projects so that draft/private content is not exposed.
- **US-002:** As an entrepreneur, I want to submit and maintain my own project so that staff can review it.
- **US-003:** As a staff reviewer, I want one consistent moderation path with notifications and audit records.
- **US-004:** As an investor, I want an intended contribution recorded as pending without implying that payment settled.
- **US-005:** As a project owner, I want confirmed totals derived from authoritative records.
- **US-006:** As a user, I want private messages visible only to participants.
- **US-007:** As a user, I want notification preferences to persist.
- **US-008:** As a data subject, I want uploaded identity/documents protected and retained only under an approved policy.
- **US-009:** As an examiner, I want every implemented claim traced to code and tests.

## 8. Acceptance criteria

| AC ID | Related requirement | Acceptance criterion | Current result |
|---|---|---|---|
| AC-001 | FR-001/002 | Anonymous list/detail never returns a draft, unverified or deleted project. | Source and static backend tests support; backend not freshly run |
| AC-002 | FR-003 | Public detail omits email, phone, KYC, private files and verification notes. | Source/test exists |
| AC-003 | FR-006 | Registering with `admin` or staff fields returns validation error/no privilege. | Source/test exists |
| AC-004 | FR-007-009 | Login, rotation and logout preserve only valid session tokens. | Source/tests; frontend token/logout tests passed |
| AC-005 | FR-014-017 | Entrepreneur creates draft; staff verifies active; ordinary user cannot moderate. | Source/static tests support |
| AC-006 | FR-021 | Zero, negative or below-minimum amount is rejected. | **Not met:** zero may pass |
| AC-007 | FR-022/024 | Client status field is ignored/rejected; only staff dedicated confirm changes pending to confirmed. | Met on normal API |
| AC-008 | FR-025 | Confirmed amount/method cannot be directly edited by investor. | **Not met** |
| AC-009 | FR-026 | Aggregate equals sum of confirmed amounts and distinct confirmed investors after saves/deletes. | Source/static tests support |
| AC-010 | FR-029 | Unrelated users cannot retrieve payment details or private project event data. | **Not met** |
| AC-011 | FR-036/037 | Non-participant receives 404/403; sender is server-derived; deleted body is empty. | Source/static tests support |
| AC-012 | FR-040 | Notification list/read/preferences affect only current user. | Source/tests; frontend tests passed |
| AC-013 | FR-044 | All admin/financial changes create sanitized audit events. | **Not met:** partial event coverage |
| AC-014 | FR-045 | Contact success corresponds to stored/delivered request ID. | **Not met:** recorded |
| AC-015 | FR-004 | Language switch updates `lang`, `dir`, persists choice and renders principal Arabic labels. | Current frontend tests passed |
| AC-016 | NFR-017 | Critical suites run in CI with coverage threshold approved by team. | **Not met:** no CI/coverage |
| AC-017 | NFR-015 | Production deployment passes security/configuration/backup/restore checks. | `[NOT VERIFIED]` |

## 9. Data requirements

- UUID identifiers shall be used for current domain entities; public projects also use unique slugs.
- Monetary values shall use fixed decimal storage.
- User email shall be unique and normalized.
- Project public/private field sets shall be explicit.
- Uploaded KYC and project documents shall not be publicly enumerable.
- Soft-deleted messages shall serialize no original body.
- Audit metadata shall exclude credentials, tokens, message bodies and document content.
- Data retention, deletion, export, backups and legal basis are `[TEAM CONFIRMATION REQUIRED]`.
- Website/timezone schema depends on committing and applying `users` migration `0003`; this audit did not apply it.

## 10. API and security requirements

- Base application API: `/api/v1/`; schema/docs: `/api/schema/`, `/api/docs/`.
- Protected calls use `Authorization: Bearer <access>`.
- Public endpoints shall be explicitly identified; default permission shall not substitute for object scope.
- CORS origins shall match the actual frontend origin and be environment-controlled.
- JWT-bearing APIs do not rely on cookies for authentication; CSRF middleware remains relevant to Django session/admin surfaces.
- Production shall reject placeholder secrets and invalid hosts.
- Forwarded IP/request ID headers shall be trusted only behind a configured proxy; current audit logging accepts the first forwarded IP and request IDs can be client-supplied.
- Rate limiting shall use a shared cache for multi-instance operation.
- Password-reset responses shall remain enumeration-safe and email delivery failures shall not leak account existence.

## 11. Usability, performance and deployment requirements

### Usability

- principal workflows shall expose loading, error, empty, retry and success states;
- financial labels shall distinguish “pending record,” “confirmed internal record,” and “settled payment”;
- fixture-backed controls shall be visibly labelled demonstration-only or removed;
- Arabic copy and dense admin pages require native-speaker and responsive visual review;
- accessibility conformance target and evaluation tool are `[TEAM CONFIRMATION REQUIRED]`.

### Performance

- paginated endpoints shall cap result size;
- polling intervals shall be justified and stopped on unmount;
- SSE shall use heartbeat/reconnect/reconciliation appropriate to production;
- exact latency, throughput, concurrent-user and bundle targets are `[TEAM CONFIRMATION REQUIRED]`;
- no performance result is currently claimed.

### Deployment

- production services shall include the built frontend, production API server, database, Redis as needed, static/private media strategy, migrations under controlled release authority, health checks and observability;
- a Celery worker is required only if actual background tasks are enabled;
- environment examples shall use container service names and Vite's actual origin where appropriate;
- backup/restore, secret rotation, TLS/proxy, logging and incident procedures shall be documented;
- current Docker artifacts are configuration evidence, not deployment evidence.

## 12. Known limitations and future requirements

Highest-priority limitations:

1. SSE/payment privacy and project visibility;
2. zero investment and editable confirmed records;
3. incomplete audit and inconsistent moderation paths;
4. fixture-backed financial/security/support UI;
5. missing upload controls and private object-storage policy;
6. schema drift from an untracked migration;
7. no real payment, KYC, AI, email notifications, E2E suite, CI/CD or deployment proof;
8. no current backend execution, coverage, user evaluation, accessibility or performance evaluation.

Future financial/payment work must wait for approved legal/business rules and must not be inferred from current field names.

## 13. Requirement traceability matrix

| Objective | Requirements | UI/routes | API/backend | Data | Test/evidence |
|---|---|---|---|---|---|
| OBJ-01: Gather and structure stakeholder/system requirements | FR-001-047; BR-001-018 | all public/role routes | route/permission inventory | entity dictionary | repository and document audit; stakeholder input `[NOT VERIFIED]` |
| OBJ-02: Design a bilingual role-oriented platform | FR-001-020, FR-035-040; NFR-009-013 | App routes, i18n, project/auth/dashboard/messages/settings pages | users/projects/messaging/notifications APIs | User, Project, Conversation, Notification | localization/admin route tests passed |
| OBJ-03: Develop project and investment-record workflows | FR-014-034, FR-042-044 | project/admin/dashboard/transaction pages | project, investment, admin viewsets/services/signals | Project, Investment, Milestone, Repayment, AuditLog | backend tests exist; no fresh backend run |
| OBJ-04: Evaluate correctness, security and readiness | NFR-001-018; AC-001-017 | error/loading/fixture disclosure review | permissions/security/config audit | privacy/integrity review | 24 frontend tests passed; TypeScript passed; historical backend logs only |

### Selected end-to-end traceability

| Requirement | UI | Service/API | Backend logic | Model | Test |
|---|---|---|---|---|---|
| FR-006 registration | `RegisterPage.tsx` | `authService.register` | `RegisterView`, `RegisterSerializer` | User | `AuthenticationPrivilegeTests` |
| FR-014 project create | `StartProject.tsx` | `projectsService.createProject` | `ProjectViewSet.perform_create` | Project | project/admin tests |
| FR-017 moderation | admin projects pages | admin/normal project actions | both project view modules | Project | moderation/admin tests |
| FR-021 investment create | `ProjectDetails.tsx` | `investmentsService.createInvestment` | serializer/view | Investment | investment tests; zero gap untested |
| FR-026 totals | dashboards/detail | project/investment reads | aggregate service/signals | Investment → Project | signal/totals tests |
| FR-035 messaging | `MessagesPage.tsx` | `messagingService` | messaging views/services | Conversation/Participant/Message | four current frontend tests passed; backend tests exist |
| FR-040 notifications | `DashboardLayout`, Settings | `notificationService` | notification views/services | Notification/Preference | current frontend tests passed; backend tests exist |
| FR-044 audit | no dedicated UI | `GET /audit-logs/` | explicit `audit_log()` calls | AuditLog | audit access/sanitization tests |

