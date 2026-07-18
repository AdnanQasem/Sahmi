# Software Requirements Specification: Sahmi

Version: 1.0  
Date: 2026-06-27  
System: Sahmi digital impact-investment and crowdfunding platform  
Repository basis: React/Vite frontend and Django REST Framework backend in this workspace

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification defines the functional and non-functional requirements for Sahmi, a platform that connects impact-driven investors and supporters with verified Palestinian entrepreneurs and projects.

The document is intended for product owners, developers, designers, testers, administrators, deployment engineers, and stakeholders who need a shared specification for implementation, validation, and future planning.

### 1.2 Product Scope

Sahmi provides a public project-discovery experience, authenticated investor and entrepreneur workflows, role-based dashboards, project funding, project verification, investment tracking, and supporting backend APIs.

The current repository includes:

- A React 18, TypeScript, Vite frontend.
- Tailwind CSS and shadcn/Radix UI components.
- React Router based public and protected routes.
- React Query based API state management.
- A Django REST Framework backend.
- JWT authentication with refresh tokens.
- User, project, category, investment, milestone, repayment, and notification models.
- Admin registration for core models.
- Redis-backed server-sent event publishing for confirmed investments.
- Docker support for backend, PostgreSQL, and Redis.

The broader product specification also includes planned capabilities that are partially implemented or not yet implemented, including full payment processing, persistent messaging, notification APIs, AI project classification, recommendations, audit logging, KYC workflows, external email delivery, S3 storage, and richer admin reporting.

### 1.3 Definitions

| Term | Definition |
| --- | --- |
| Sahmi | The platform being specified. The name means "my share" in Arabic. |
| Visitor | A non-authenticated user browsing public pages and projects. |
| Investor | A user who contributes capital to projects and tracks investments. |
| Supporter | Public-facing wording sometimes used for investors/backers. |
| Entrepreneur | A project owner who submits and manages funding campaigns. |
| Admin | A staff user who manages verification, platform data, and oversight. |
| Project | A funding campaign submitted by an entrepreneur. |
| Investment | A monetary contribution by an investor to a project. |
| Confirmed Investment | An investment with status `confirmed`; only these count toward funding totals. |
| Milestone | A project execution target with dates, deliverables, and funding release data. |
| Repayment | A scheduled or actual return/payment associated with an investment. |
| KYC | Know Your Customer verification for identity/legal compliance. |
| SSE | Server-sent events used for one-way live project updates. |
| ROI | Return on investment. |

### 1.4 References

- `README.md`
- `backend/README.md`
- `sahmi_backend_prompt_1.md`
- `src/App.tsx`
- `src/services/*.ts`
- `backend/apps/**`
- `package.json`
- `backend/requirements.txt`
- `backend/docker-compose.yml`

## 2. Overall Description

### 2.1 Product Perspective

Sahmi is a web application with a separated frontend and backend:

- The frontend is a single-page application served by Vite and routed by React Router.
- The backend exposes REST APIs under `/api/v1/`.
- The frontend expects the backend base URL from `VITE_API_BASE_URL`, defaulting to `http://localhost:8000/api/v1/`.
- The backend exposes OpenAPI schema at `/api/schema/` and Swagger UI at `/api/docs/`.
- The backend stores media locally in development and is intended to support external object storage in production.

### 2.2 User Classes

| User Class | Description | Main Capabilities |
| --- | --- | --- |
| Visitor | Unauthenticated user | View marketing pages, browse public verified active projects, view project details, register, log in, submit contact form UI. |
| Investor | Authenticated user with `user_type=investor` | Browse projects, submit investment requests, view investor dashboard, track transactions, view portfolio metrics, access investor settings/messages UI. |
| Entrepreneur | Authenticated user with `user_type=entrepreneur` | Submit projects, edit/delete owned projects, view entrepreneur dashboard, track funding and analytics, view investor/message/settings UI. |
| Admin | Authenticated staff/admin user | Access admin dashboard, create/read/update/delete platform data, verify projects, access investor and entrepreneur dashboards where route permissions allow. |

### 2.3 Operating Environment

Frontend:

- React 18
- TypeScript
- Vite 5
- Tailwind CSS
- Radix UI/shadcn components
- React Router DOM
- TanStack React Query
- Axios
- Framer Motion
- Recharts
- Sonner/toast UI

Backend:

- Python 3.13 container baseline
- Django 4.2 to below 5.3
- Django REST Framework
- Simple JWT
- django-filter
- drf-spectacular
- PostgreSQL 16 in Docker Compose
- Redis 7 in Docker Compose
- Celery configured with Redis
- Gunicorn for production container command

### 2.4 Design and UX Identity

The interface must present Sahmi as a trustworthy, polished, impact-focused fintech/crowdfunding product. The current design system uses:

- Primary teal, secondary blue, accent amber, success green, warning orange, destructive red.
- Inter as the base font and Outfit for selected headings.
- Light and dark theme tokens.
- Rounded cards, dashboards, data tables, charts, progress bars, badges, and role-specific sidebars.
- Public pages with hero imagery from `public/sahmi-hero-bg.png`.
- Brand assets in `public/sahmi-logo.svg`, `public/sahmi-wordmark.svg`, `public/sahmi-icon.svg`, and related files.

### 2.5 Constraints

- The frontend must work with the backend response envelope for most DRF responses: `{ success, data, message }` or `{ success, error, message }`.
- Authentication uses JWT bearer tokens stored in browser local storage.
- Public project listings must show only active, verified, non-deleted projects.
- Project detail routes use project slugs.
- Project creation and update must support multipart form data for cover image upload.
- Funding totals must be derived from confirmed investments.
- Current payment gateway integration is not implemented; `bank_transfer`, `card`, and `paypal` are data-level options.
- Some frontend dashboard pages currently include static/mock content and must be integrated with backend APIs before production use.

### 2.6 Assumptions and Dependencies

- Users have modern browsers with JavaScript enabled.
- Backend and frontend are deployed with compatible CORS settings.
- Redis is available for live SSE investment events and Celery.
- PostgreSQL is used in production; SQLite may be used for local development and tests.
- Email, payment gateway, AI classification, object storage, and monitoring providers are future dependencies unless explicitly configured.

## 3. System Features and Functional Requirements

### 3.1 Public Website and Navigation

FR-001: The system shall provide a public homepage introducing Sahmi as a Palestinian innovation and impact funding platform.  
FR-002: The homepage shall display calls to explore projects and, where allowed, start a project.  
FR-003: The homepage shall display platform statistics, how-it-works content, featured projects, trust points, testimonials, and final calls to action.  
FR-004: The system shall provide public pages for About, Contact, and How It Works.  
FR-005: The global navigation shall include Home, Explore Projects, How It Works, About, Contact, Log In, Sign Up, Dashboard, Log Out, and Start Project when applicable.  
FR-006: The footer shall include platform links, support links, legal links, social placeholders, and brand positioning.

### 3.2 Authentication and Session Management

FR-010: Users shall be able to register with full name, email, password, and account type.  
FR-011: Registration shall support investor and entrepreneur account types from the frontend.  
FR-012: The backend shall support `investor`, `entrepreneur`, and `admin` user types.  
FR-013: Registration shall require full name and a password that passes Django password validators.  
FR-014: Registration shall normalize email to lowercase and use email as username if no username is supplied.  
FR-015: After successful registration, the backend shall return access token, refresh token, and user profile data.  
FR-016: The current frontend registration flow shall display success and redirect to login after account creation.  
FR-017: Users shall log in with email and password.  
FR-018: Login shall reject missing email, missing password, invalid credentials, and disabled accounts.  
FR-019: The frontend shall store `accessToken`, `refreshToken`, and user data in local storage after login.  
FR-020: The frontend API client shall attach `Authorization: Bearer <token>` to authenticated requests.  
FR-021: When an API request receives HTTP 401, the frontend shall attempt token refresh once using the refresh token.  
FR-022: If refresh fails, the frontend shall clear stored auth data and redirect to `/login`.  
FR-023: Users shall be able to log out, clearing local auth state.  
FR-024: Authenticated users shall be able to fetch their profile through `auth/me/`.  
FR-025: Authenticated users shall be able to patch profile fields supported by the user serializer.  
FR-026: Authenticated users shall be able to change password by providing current password, new password, and confirmation.  
FR-027: Password change shall validate current password, matching confirmation, and Django password validation rules.

### 3.3 Role-Based Access

FR-030: Protected routes shall redirect unauthenticated users to login with the original route in navigation state.  
FR-031: Investor dashboard routes shall allow investors and admins.  
FR-032: Entrepreneur dashboard routes shall allow entrepreneurs and admins.  
FR-033: Start Project shall allow entrepreneurs and admins only.  
FR-034: Project edit routes shall require authentication and backend owner/admin authorization.  
FR-035: `/dashboard` shall redirect investors to `/dashboard/investor` and entrepreneurs/admins to `/dashboard/entrepreneur`.

### 3.4 Project Discovery

FR-040: Visitors and authenticated users shall browse projects at `/projects`.  
FR-041: Project list cards shall display title, description, category, founder, image, goal, raised amount, supporters, days left, and funding percent.  
FR-042: Public project listing API responses shall include only non-deleted projects with `status=active` and `is_verified=true` for non-staff users.  
FR-043: The project list shall support search by title, short description, description, and location.  
FR-044: The project list shall support category filtering by category slug.  
FR-045: The project list shall support ordering by created date, goal amount, funded amount, expected ROI, and investor count.  
FR-046: The frontend shall expose sorting options for trending, newest, most funded, and ending soon.  
FR-047: The project list shall display loading, error, empty, retry, and clear filter states.  
FR-048: The homepage shall display up to three featured projects ordered by investor count.

### 3.5 Project Details

FR-050: Users shall view project details at `/projects/:slug`.  
FR-051: Project details shall display cover image, category, verification badge, status, title, founder, location, funding progress, goal, investors, days left, minimum investment, and expected ROI.  
FR-052: Project details shall include tabs for Overview, Story, Funding Plan, Recent Payments, Updates, Team, and FAQ.  
FR-053: Overview shall display the project description and transparency report.  
FR-054: Funding Plan shall display progress, goal, minimum investment, and campaign duration.  
FR-055: Recent Payments shall display confirmed payments/backers for the project.  
FR-056: Team shall display founder information.  
FR-057: Empty states shall appear for missing updates and FAQ entries.  
FR-058: Project detail retrieval shall increment `view_count`.  
FR-059: Project owners and admins shall see Edit Project and Delete Project controls.  
FR-060: Users shall be able to copy/share the current project URL from the project detail page.

### 3.6 Project Creation

FR-070: Entrepreneurs and admins shall submit projects through a five-step wizard.  
FR-071: The wizard steps shall be Basic Info, Project Story, Funding Goal, Media, and Review.  
FR-072: Basic Info shall collect title, category, short description, and location.  
FR-073: Project Story shall collect full story and optional risks/challenges.  
FR-074: Funding Goal shall collect goal amount, minimum investment, expected ROI, campaign duration, and optional funding breakdown.  
FR-075: Media shall collect optional cover image and video URL.  
FR-076: Review shall require acceptance of terms and commitment to supporter updates.  
FR-077: The frontend shall validate required fields before advancing steps.  
FR-078: The backend shall validate goal amount, minimum investment, and funding period are greater than zero.  
FR-079: Project creation shall submit multipart form data.  
FR-080: Created projects shall belong to the authenticated entrepreneur/admin.  
FR-081: Created projects shall default to draft/unverified until admin verification.  
FR-082: If no end date is provided, backend shall calculate end date from start date plus funding period days.  
FR-083: On successful submission, the frontend shall notify the user and navigate to the entrepreneur dashboard.

### 3.7 Project Editing and Deletion

FR-090: Authenticated project owners and admins shall edit project details.  
FR-091: Edit Project shall prefill existing title, category, short description, description, location, goal amount, minimum investment, expected ROI, funding period, video URL, and cover image replacement control.  
FR-092: Project updates shall support multipart form data.  
FR-093: When funding period changes without explicit end date, backend shall recalculate end date.  
FR-094: Project deletion shall be a soft delete by setting `deleted_at`.  
FR-095: Soft-deleted projects shall be excluded from normal project querysets.  
FR-096: The frontend shall confirm deletion before requesting delete.

### 3.8 Project Verification and Admin Oversight

FR-100: Admin/staff users shall be able to verify a project through `POST /api/v1/projects/{slug}/verify/`.  
FR-101: Verification shall set `is_verified=true`, `status=active`, `verified_by`, `verified_at`, and optional `verification_notes`.  
FR-102: Admin users shall be able to manage users, projects, categories, investments, milestones, and repayments in Django admin.  
FR-103: Project admin lists shall support filtering by status, verification, and category, and searching by title, short description, and entrepreneur email.  
FR-104: Category admin shall support slug prepopulation from name.  
FR-105: The target product shall provide richer admin APIs for project rejection, KYC verification, reports, and audit logs.

### 3.9 Investment Flow

FR-110: Authenticated users shall be able to create investments.  
FR-111: Investment creation shall save the authenticated user as investor.  
FR-112: Investment creation shall require project, amount, and payment method.  
FR-113: The frontend project details page shall submit contributions with payment method `bank_transfer`.  
FR-114: Investment amount shall be at least the project's minimum investment.  
FR-115: Investment status shall default to `pending`.  
FR-116: Investment statuses shall include `pending`, `confirmed`, `canceled`, and `completed`.  
FR-117: Payment methods shall include `card`, `bank_transfer`, and `paypal`.  
FR-118: Expected return shall be calculated as `amount * project.expected_roi / 100` when the investment is saved and expected return is not already set.  
FR-119: Investors shall see their own investments.  
FR-120: Entrepreneurs shall see investments for their own projects.  
FR-121: Staff shall see all investments.  
FR-122: Non-staff users shall only mutate investments where they are the investor.  
FR-123: The system shall reject unauthenticated investment requests.  
FR-124: The project detail page shall prompt unauthenticated visitors to log in before contributing.  
FR-125: On successful contribution request, the frontend shall clear the amount field, show a success toast, and refresh project data.

### 3.10 Funding Totals and Live Updates

FR-130: Only confirmed investments shall contribute to a project's funded amount and investor count.  
FR-131: When an investment is created, updated, deleted, or changes project/status, backend signals shall resynchronize related project totals after transaction commit.  
FR-132: When an investment becomes confirmed, the backend shall publish an `investment_confirmed` event to Redis.  
FR-133: The project events endpoint shall stream SSE messages for project-specific investment updates.  
FR-134: The frontend project details page shall connect to the project SSE endpoint.  
FR-135: On investment confirmation events, the frontend shall update cached project funded amount, investor count, funding percent, and recent payments.  
FR-136: The frontend shall highlight newly confirmed payments for a short period.  
FR-137: If SSE fails, the frontend shall fall back to polling and periodically refresh project and payment data.

### 3.11 Investor Dashboard

FR-140: Investors and admins shall access `/dashboard/investor`.  
FR-141: The investor dashboard shall display total invested, active investments, expected returns, and available projects.  
FR-142: The investor dashboard shall build portfolio performance by month from investment data.  
FR-143: The investor dashboard shall build allocation by project category from investments.  
FR-144: The investor dashboard shall show recent transactions with project, amount paid, payment method, status, date/time, and details control.  
FR-145: The investor dashboard shall show watched/live projects from backend project data.  
FR-146: The investor dashboard shall include calls to explore and invest in projects.  
FR-147: Investor dashboard data shall refresh periodically.

### 3.12 Investor Transactions

FR-150: Investors and admins shall access `/dashboard/investor/transactions`.  
FR-151: The transactions page shall show portfolio performance summary including total paid, expected return, and projected ROI.  
FR-152: The transactions page shall highlight latest activity.  
FR-153: The transactions page shall support searching transaction records by project name, category, transaction ID, payment method, and status.  
FR-154: The transactions page shall support filtering by all, pending, confirmed, completed, and canceled.  
FR-155: Transaction lists shall open a transaction details dialog.  
FR-156: Empty and no-match states shall be displayed.

### 3.13 Entrepreneur Dashboard

FR-160: Entrepreneurs and admins shall access `/dashboard/entrepreneur`.  
FR-161: The entrepreneur dashboard shall display total projects, active projects, total funding raised, and pending review count.  
FR-162: The entrepreneur dashboard shall display funding raised over time using investment data.  
FR-163: The entrepreneur dashboard shall display investors per month using investment data.  
FR-164: The entrepreneur dashboard shall list the entrepreneur's projects with status, category, investor count, days left, views, and funding progress.  
FR-165: Entrepreneurs shall be able to navigate to create, edit, and view project pages from the dashboard.  
FR-166: The dashboard shall show pending review indicators for unverified projects.  
FR-167: The dashboard shall show recent investor activity based on investment records.  
FR-168: Current recent message previews are static UI and shall be replaced by persistent messaging data before production.

### 3.14 Entrepreneur Analytics

FR-170: Entrepreneurs and admins shall access `/dashboard/entrepreneur/analytics`.  
FR-171: Analytics shall display total raised, average funding progress, investor reach, and average transaction.  
FR-172: Analytics shall support timeframes `1M`, `3M`, `6M`, `1Y`, and `ALL`.  
FR-173: Analytics shall show funding momentum grouped by day, week, or month depending on timeframe.  
FR-174: Analytics shall show active project funding progress.  
FR-175: Analytics shall show project interaction funnel metrics for views, investor interest, and confirmed payments.  
FR-176: Analytics shall show top project performance by raised versus goal.  
FR-177: Analytics shall list projects with visibility, status, progress, investors, and views.

### 3.15 Entrepreneur Investors Page

FR-180: Entrepreneurs and admins shall access `/dashboard/entrepreneur/investors`.  
FR-181: The page shall show investor network KPIs, filters, search, selected investor detail, and messaging/export controls.  
FR-182: Current investor records on this page are mock/static and shall be replaced by backend-derived investor aggregation before production.  
FR-183: The target backend shall provide entrepreneur-scoped investor lists with total invested, project count, last investment, status/tier, project associations, and contact permissions.

### 3.16 Messaging

FR-190: Investors and entrepreneurs shall access role-specific messages pages.  
FR-191: The messages UI shall support conversation list, search, filters for all/unread/starred, conversation selection, project badges, online/last seen indicators, message bubbles, read status, attachments UI controls, and send action.  
FR-192: Current conversations and messages are local mock data.  
FR-193: The target product shall persist conversations, messages, attachments, read receipts, project associations, and participant permissions in backend APIs.  
FR-194: The target product shall restrict conversations to relevant participants such as investors and project owners unless admin access is required.

### 3.17 Settings, Account, Security, Notifications, and Billing

FR-200: Investors and entrepreneurs shall access role-specific settings pages.  
FR-201: Settings shall include sections for Profile, Account, Security, Notifications, and Billing.  
FR-202: Profile UI shall show avatar initials, full name, email, role badge, verification badge, phone, location, website, and bio fields.  
FR-203: Account UI shall show primary email, phone, language, timezone, and verification level controls.  
FR-204: Security UI shall include password fields, visibility toggles, strength indicators, two-factor controls, connected devices/sessions, and provider connection UI.  
FR-205: Notifications UI shall include toggles for email, push, marketing, project updates, investor messages, and funding milestones.  
FR-206: Billing UI shall include wallet balance, deposit, withdraw, auto-invest configuration, payment methods, and billing history.  
FR-207: Current settings interactions are mostly local UI simulations except backend support for `auth/me/` and `auth/change-password/`.  
FR-208: The target product shall persist editable profile, notification, security, billing, wallet, and payment method data through backend APIs.

### 3.18 Contact and Support

FR-210: The Contact page shall show email, phone, office location, response-time information, global support information, social links, team members, FAQs, and calls to action.  
FR-211: The Contact page shall include a contact form with name, email, subject, and message.  
FR-212: Current contact form submission is simulated on the frontend.  
FR-213: The target product shall persist or send contact requests through backend/email integration.

### 3.19 Categories

FR-220: Public users shall be able to list project categories.  
FR-221: Categories shall include ID, name, slug, and description.  
FR-222: Categories shall be ordered by name by default.  
FR-223: Admin users shall be able to create, update, and delete categories.  
FR-224: Category slugs shall be generated from names if omitted.

### 3.20 Milestones and Repayments

FR-230: Authenticated users shall access milestones according to permissions.  
FR-231: Staff shall access all milestones.  
FR-232: Non-staff users shall access milestones for projects they own.  
FR-233: Milestones shall include project, title, description, target date, actual completion date, status, deliverables, percentage of project, funding released, and order.  
FR-234: Authenticated users shall access repayments according to permissions.  
FR-235: Staff shall access all repayments.  
FR-236: Investors shall access repayments for their investments.  
FR-237: Entrepreneurs shall access repayments for investments in their projects.  
FR-238: Repayments shall include investment, amount, scheduled date, actual payment date, status, payment method, transaction ID, and notes.  
FR-239: The target product shall generate repayment schedules based on successful funding, milestones, and repayment business rules.

### 3.21 Notifications

FR-240: The backend shall model notifications with user, title, body, created/updated timestamps, and read timestamp.  
FR-241: The dashboard layout shall show role-specific recent notification UI.  
FR-242: Current dashboard notification items are static.  
FR-243: The target product shall expose notification list, unread count, mark read, mark all read, delete, and notification settings APIs.  
FR-244: The target product shall notify users about investment confirmation, project review status, milestone completion, repayment received, project updates, messages, and overdue repayments.

### 3.22 AI Classification and Recommendations

FR-250: The target product shall classify submitted projects using an LLM integration such as Groq.  
FR-251: AI classification shall store category, confidence score, generated summary, and classification timestamp.  
FR-252: AI classification shall support discovery, admin review, and recommendation features.  
FR-253: The target product shall recommend projects to investors based on favorite categories, past investments, risk preference, ROI range, and entrepreneur reputation.  
FR-254: Current models include AI classification fields, but no AI task implementation is present.

### 3.23 Audit Logging

FR-260: The target product shall record audit logs for user changes, project creation, project verification, project status changes, investments, payment transactions, document uploads, and admin actions.  
FR-261: Audit logs shall include user, action, object type, object ID, changes, IP address, user agent, and timestamp.  
FR-262: Current repository does not include an AuditLog model implementation.

### 3.24 Payment Processing

FR-270: The target product shall integrate one or more payment processors such as Stripe, PayPal, or bank transfer workflows.  
FR-271: Payment processing shall create pending investments, confirm or fail transactions, store external transaction IDs, and trigger funding total updates.  
FR-272: Failed payments shall not count toward project totals.  
FR-273: Refunds shall be supported when required by business rules.  
FR-274: Current repository records payment method and transaction ID but does not implement payment gateway calls.

## 4. External Interface Requirements

### 4.1 Frontend Routes

| Route | Access | Description |
| --- | --- | --- |
| `/` | Public | Homepage |
| `/projects` | Public | Browse verified active projects |
| `/projects/:id` | Public | Project detail by slug |
| `/start-project` | Entrepreneur/Admin | Project creation wizard |
| `/projects/:id/edit` | Authenticated, backend owner/admin | Edit project |
| `/about` | Public | About page |
| `/contact` | Public | Contact page and form UI |
| `/how-it-works` | Public | How It Works page |
| `/login` | Public when logged out | Login page |
| `/register` | Public when logged out | Register page |
| `/dashboard` | Authenticated | Role redirect |
| `/dashboard/investor` | Investor/Admin | Investor overview dashboard |
| `/dashboard/investor/transactions` | Investor/Admin | Investor transactions |
| `/dashboard/investor/settings` | Investor/Admin | Settings |
| `/dashboard/investor/messages` | Investor/Admin | Messages UI |
| `/dashboard/entrepreneur` | Entrepreneur/Admin | Entrepreneur overview dashboard |
| `/dashboard/entrepreneur/analytics` | Entrepreneur/Admin | Entrepreneur analytics |
| `/dashboard/entrepreneur/settings` | Entrepreneur/Admin | Settings |
| `/dashboard/entrepreneur/messages` | Entrepreneur/Admin | Messages UI |
| `/dashboard/entrepreneur/investors` | Entrepreneur/Admin | Investor network UI |
| `*` | Public | Not found page |

Linked but currently not routed in `App.tsx`:

- `/forgot-password`
- `/terms`
- `/privacy`

### 4.2 Backend API Base

Default frontend API base:

```text
http://localhost:8000/api/v1/
```

Backend documentation:

```text
/api/schema/
/api/docs/
```

### 4.3 API Response Envelope

Successful enveloped responses:

```json
{
  "success": true,
  "data": {},
  "message": null
}
```

Error enveloped responses:

```json
{
  "success": false,
  "error": {},
  "message": "Request failed."
}
```

Some auth views currently use raw JSON renderer and may return non-enveloped DRF/JWT payloads. The frontend API client can unwrap both plain and enveloped responses.

### 4.4 Auth API

| Method | Endpoint | Access | Requirement |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register/` | Public | Create user and return JWT auth payload |
| POST | `/api/v1/auth/login/` | Public | Authenticate by email/password and return JWT auth payload |
| POST | `/api/v1/auth/refresh-token/` | Public | Refresh access token |
| GET | `/api/v1/auth/me/` | Authenticated | Return current user |
| PATCH | `/api/v1/auth/me/` | Authenticated | Partially update current user |
| POST | `/api/v1/auth/change-password/` | Authenticated | Change current password |

### 4.5 Projects and Categories API

| Method | Endpoint | Access | Requirement |
| --- | --- | --- | --- |
| GET | `/api/v1/categories/` | Public | List categories |
| POST | `/api/v1/categories/` | Admin | Create category |
| GET | `/api/v1/categories/{id}/` | Public | Retrieve category |
| PUT/PATCH | `/api/v1/categories/{id}/` | Admin | Update category |
| DELETE | `/api/v1/categories/{id}/` | Admin | Delete category |
| GET | `/api/v1/projects/` | Public | List active verified projects for non-staff |
| POST | `/api/v1/projects/` | Entrepreneur/Admin | Create project |
| GET | `/api/v1/projects/{slug}/` | Public | Retrieve project detail and increment views |
| PUT/PATCH | `/api/v1/projects/{slug}/` | Owner/Admin | Update project |
| DELETE | `/api/v1/projects/{slug}/` | Owner/Admin | Soft delete project |
| POST | `/api/v1/projects/{slug}/verify/` | Admin | Verify and activate project |
| GET | `/api/v1/projects/my/` | Authenticated | List own projects, or all for staff |
| GET | `/api/v1/projects/{slug}/payments/` | Public | List confirmed project payments |
| GET | `/api/v1/projects/{slug}/events/` | Public | Stream project SSE updates |

Project list filters:

- `status`
- `is_verified`
- `category`
- `location`
- `min_goal`
- `max_goal`
- `search`
- `ordering`
- `page`
- `page_size`

### 4.6 Investments, Milestones, and Repayments API

| Method | Endpoint | Access | Requirement |
| --- | --- | --- | --- |
| GET | `/api/v1/investments/` | Authenticated scoped | List visible investments |
| POST | `/api/v1/investments/` | Authenticated | Create investment for current user |
| GET | `/api/v1/investments/{id}/` | Investor/Project owner/Admin | Retrieve investment |
| PUT/PATCH | `/api/v1/investments/{id}/` | Investor/Admin | Update investment |
| DELETE | `/api/v1/investments/{id}/` | Investor/Admin | Delete investment |
| GET | `/api/v1/milestones/` | Authenticated scoped | List milestones |
| POST | `/api/v1/milestones/` | Authenticated | Create milestone, subject to future stricter owner/admin rules |
| GET | `/api/v1/repayments/` | Authenticated scoped | List repayments |
| POST | `/api/v1/repayments/` | Authenticated | Create repayment, subject to future stricter owner/admin rules |

Investment filters:

- `project`
- `status`
- `payment_method`
- `ordering`

Milestone filters:

- `project`
- `status`
- `ordering`

Repayment filters:

- `investment`
- `status`
- `scheduled_date`
- `ordering`

### 4.7 Planned API Endpoints

The target product should add or complete:

- `POST /api/v1/auth/logout/`
- `POST /api/v1/auth/verify-email/`
- `POST /api/v1/auth/resend-verify-email/`
- `POST /api/v1/auth/forgot-password/`
- `POST /api/v1/auth/reset-password/`
- `POST /api/v1/users/me/avatar/`
- `POST /api/v1/users/me/kyc/`
- `GET /api/v1/portfolio/`
- `GET /api/v1/portfolio/performance/`
- `GET /api/v1/notifications/`
- `GET /api/v1/notifications/unread/`
- `POST /api/v1/notifications/{id}/read/`
- `POST /api/v1/notifications/read-all/`
- `GET/PUT /api/v1/notifications/settings/`
- `GET/POST /api/v1/messages/`
- `GET/POST /api/v1/conversations/`
- `GET /api/v1/search/`
- `GET /api/v1/trending/`
- `GET /api/v1/recommended/`
- `POST /api/v1/admin/projects/{id}/reject/`
- `POST /api/v1/admin/users/{id}/verify-kyc/`
- `GET /api/v1/admin/reports/transactions/`
- `GET /api/v1/admin/reports/users/`
- `GET /api/v1/admin/audit-logs/`

## 5. Data Requirements

### 5.1 Shared Base Model

All domain models inheriting `UUIDTimestampModel` shall include:

- `id`: UUID primary key
- `created_at`: auto-created timestamp
- `updated_at`: auto-updated timestamp

### 5.2 User

User fields:

- `id`
- `username`
- `email`
- `password`
- `full_name`
- `phone_number`
- `user_type`: `investor`, `entrepreneur`, `admin`
- `profile_picture`
- `bio`
- `country`
- `city`
- `is_verified`
- `is_kyc_verified`
- `kyc_document`
- `kyc_verified_at`
- `investor_tier`: `bronze`, `silver`, `gold`, `platinum`
- `total_invested`
- `total_returned`
- `average_roi`
- `risk_preference`: `low`, `medium`, `high`
- `business_name`
- `business_registration_number`
- `business_established_date`
- `business_address`
- `total_funded`
- `total_repaid`
- `reputation_score`
- Django auth fields such as `is_active`, `is_staff`, `is_superuser`, `date_joined`, and `last_login`

User business rules:

- Email shall be unique.
- Email shall be the login identifier.
- Username shall default to email if omitted.
- Admin user type shall set staff access on save.
- User serializer read-only fields shall include verification flags and financial aggregates.

### 5.3 ProjectCategory

Fields:

- `id`
- `name`
- `slug`
- `description`
- `created_at`
- `updated_at`

Business rules:

- Name shall be unique.
- Slug shall be unique.
- Slug shall default to slugified name.
- Categories shall order by name.

### 5.4 Project

Fields:

- `id`
- `entrepreneur`
- `title`
- `slug`
- `description`
- `short_description`
- `category`
- `location`
- `location_governorate`
- `goal_amount`
- `funded_amount`
- `minimum_investment`
- `expected_roi`
- `funding_period_days`
- `start_date`
- `end_date`
- `status`: `draft`, `active`, `closed`, `successful`, `failed`, `paused`
- `is_verified`
- `verified_by`
- `verified_at`
- `verification_notes`
- `business_plan`
- `financial_projections`
- `ownership_proof`
- `cover_image`
- `video_url`
- `ai_classified_category`
- `ai_confidence_score`
- `ai_classification_at`
- `ai_generated_summary`
- `milestone_count`
- `repayment_status`: `on_track`, `delayed`, `completed`
- `total_repaid`
- `next_repayment_date`
- `view_count`
- `investor_count`
- `rating`
- `reviews_count`
- `deleted_at`
- `created_at`
- `updated_at`

Derived serializer fields:

- `days_left`
- `funding_percent`
- `category_detail`
- `images`
- `supporting_documents`

Business rules:

- Title max length shall be 100.
- Short description max length shall be 200.
- Slug shall default to slugified title if omitted.
- `goal_amount` shall be greater than zero.
- `minimum_investment` shall be greater than zero.
- `funding_period_days` shall be greater than zero.
- `funded_amount`, `investor_count`, and `funding_percent` shall be driven by confirmed investments.
- Public list shall exclude deleted, unverified, inactive projects for non-staff users.
- Deletion shall be soft.

### 5.5 ProjectImage

Fields:

- `id`
- `project`
- `image`
- `alt_text`
- `created_at`
- `updated_at`

### 5.6 ProjectDocument

Fields:

- `id`
- `project`
- `file`
- `title`
- `created_at`
- `updated_at`

### 5.7 Investment

Fields:

- `id`
- `investor`
- `project`
- `amount`
- `quantity`
- `investment_date`
- `status`: `pending`, `confirmed`, `canceled`, `completed`
- `transaction_id`
- `payment_method`: `card`, `bank_transfer`, `paypal`
- `expected_return`
- `actual_return`
- `return_received_at`
- `notes`
- `created_at`
- `updated_at`

Business rules:

- Amount shall be at least project minimum investment.
- Expected return shall be calculated from project expected ROI when not supplied.
- Confirmed investments shall synchronize project funded amount and investor count.
- Investment list visibility shall be scoped to investor, project entrepreneur, or staff.

### 5.8 Milestone

Fields:

- `id`
- `project`
- `title`
- `description`
- `target_date`
- `actual_completion_date`
- `status`: `pending`, `in_progress`, `completed`, `delayed`
- `deliverables`
- `percentage_of_project`
- `funding_released`
- `order`
- `created_at`
- `updated_at`

### 5.9 Repayment

Fields:

- `id`
- `investment`
- `amount`
- `scheduled_date`
- `actual_payment_date`
- `status`: `pending`, `paid`, `overdue`, `canceled`
- `payment_method`
- `transaction_id`
- `notes`
- `created_at`
- `updated_at`

### 5.10 Notification

Fields:

- `id`
- `user`
- `title`
- `body`
- `read_at`
- `created_at`
- `updated_at`

Target model expansion should include notification type, related object, email sent status, and delivery preferences.

## 6. Business Rules

BR-001: Only authenticated users may create investments.  
BR-002: Only entrepreneurs and admins may create projects.  
BR-003: Only project owners and admins may mutate projects.  
BR-004: Only admins may verify projects.  
BR-005: A verified project shall become active.  
BR-006: Project list discovery shall prioritize verified, active, non-deleted projects.  
BR-007: Confirmed investment amounts shall define project funded amount.  
BR-008: Project investor count shall count distinct investors with confirmed investments.  
BR-009: Project funding percent shall be `funded_amount / goal_amount * 100`.  
BR-010: Project view count shall increment when project detail is retrieved.  
BR-011: Investment requests below minimum investment shall be rejected.  
BR-012: Expected return shall be based on expected ROI, not on total repayment history.  
BR-013: Soft-deleted projects shall not appear in normal querysets.  
BR-014: User email shall be unique and lowercased on registration.  
BR-015: Admin user type shall be staff-enabled.  
BR-016: Refresh token failure shall log users out on the frontend.  
BR-017: Target payment confirmation shall be the only gateway event that changes an investment to confirmed.

## 7. Security Requirements

SR-001: The backend shall use JWT authentication for API access.  
SR-002: Access tokens shall expire after 30 minutes in the current implementation.  
SR-003: Refresh tokens shall expire after 7 days in the current implementation.  
SR-004: Passwords shall be hashed through Django's authentication system.  
SR-005: Password changes shall require the current password.  
SR-006: Authenticated API requests shall use bearer tokens.  
SR-007: Production configuration shall enforce HTTPS redirect, secure session cookies, secure CSRF cookies, and HSTS.  
SR-008: CORS allowed origins shall be configurable by environment.  
SR-009: Project mutations shall be restricted to project owner or staff.  
SR-010: Investment visibility shall be restricted to investor, project entrepreneur, or staff.  
SR-011: Category writes shall be restricted to admin users.  
SR-012: The target product shall implement KYC document submission, KYC admin verification, and appropriate privacy controls.  
SR-013: The target product shall implement rate limiting for anonymous and authenticated users.  
SR-014: The target product shall protect against brute force login attempts.  
SR-015: The target product shall avoid exposing sensitive user data in public project details.  
SR-016: The target product shall audit admin and financial actions.

## 8. Non-Functional Requirements

### 8.1 Performance

NFR-001: Project list and detail queries shall use `select_related` and `prefetch_related` for entrepreneur, category, images, and documents.  
NFR-002: Investment list queries shall use `select_related` for investor, project, and project entrepreneur.  
NFR-003: Pagination shall default to 12 items per page and support `page_size` up to 100.  
NFR-004: Dashboard data refresh intervals shall not overload the API.  
NFR-005: Live project updates shall use SSE when Redis is available and polling fallback when it is not.  
NFR-006: Target production should cache categories, public project lists, project details, and dashboard aggregates where appropriate.

### 8.2 Reliability

NFR-010: The system shall handle backend loading, error, empty, and retry states in the frontend.  
NFR-011: Investment total synchronization shall run after database transaction commit.  
NFR-012: Redis/SSE failures shall not break project details; the frontend shall fall back to polling.  
NFR-013: The target system shall include monitoring and alerting for backend errors, payment failures, and background task failures.

### 8.3 Usability

NFR-020: Navigation shall be responsive across desktop and mobile.  
NFR-021: Forms shall show field-level validation errors when available.  
NFR-022: Destructive project deletion shall require confirmation.  
NFR-023: Dashboards shall present metrics in scannable cards, charts, badges, and tables.  
NFR-024: Empty states shall guide users toward the next useful action.  
NFR-025: Toasts shall communicate success and failure for key actions.

### 8.4 Accessibility

NFR-030: Interactive controls shall use semantic buttons, links, inputs, and labels where practical.  
NFR-031: Mobile navigation shall provide an accessible menu toggle label.  
NFR-032: Visual status indicators shall include text labels, not only colors.  
NFR-033: Target production shall pass keyboard navigation and screen reader checks for core flows.

### 8.5 Compatibility

NFR-040: The frontend shall run in current major desktop and mobile browsers.  
NFR-041: The backend shall run locally with SQLite or Docker Compose and in production with PostgreSQL.  
NFR-042: Environment configuration shall not require code changes.

### 8.6 Maintainability

NFR-050: Backend business logic shall remain in serializers, services, models, or signals rather than frontend-only calculations when authoritative.  
NFR-051: Shared UI components shall remain reusable and consistent with existing shadcn/Radix patterns.  
NFR-052: API changes shall be reflected in TypeScript service interfaces.  
NFR-053: OpenAPI documentation shall remain available and current.

## 9. Integration Requirements

IR-001: Frontend shall integrate with backend APIs through Axios.  
IR-002: Frontend shall integrate with React Query for API state, caching, invalidation, and polling.  
IR-003: Backend shall integrate with Redis for SSE publishing and Celery broker/result backend.  
IR-004: Backend shall integrate with PostgreSQL for production persistence.  
IR-005: Backend Docker Compose shall provide `api`, `db`, and `redis` services.  
IR-006: Target product shall integrate with a payment processor.  
IR-007: Target product shall integrate with email delivery provider for verification, notifications, and support.  
IR-008: Target product shall integrate with S3-compatible object storage for media and documents.  
IR-009: Target product shall integrate with Groq or another LLM provider for AI project classification.  
IR-010: Target product shall integrate with monitoring/error tracking such as Sentry.

## 10. Deployment and Configuration Requirements

DR-001: Backend local setup shall support virtual environment installation from `backend/requirements.txt`.  
DR-002: Backend shall support `python manage.py migrate`, `createsuperuser`, and `runserver 8000`.  
DR-003: Frontend shall support `npm run dev`, `npm run build`, `npm run lint`, and `npm run test`.  
DR-004: Docker Compose shall expose backend on 8000, PostgreSQL on 5432, and Redis on 6379.  
DR-005: Production backend shall run with Gunicorn binding to `0.0.0.0:8000`.  
DR-006: Required environment variables shall include Django secret, debug flag, allowed hosts, CORS origins, database URL, Redis URL, and any future provider keys.  
DR-007: Media files shall be served locally only in debug mode; production shall use external storage or web server configuration.

## 11. Testing and Quality Requirements

TQ-001: Frontend unit tests shall run with Vitest and jsdom.  
TQ-002: Frontend test setup shall use `src/test/setup.ts`.  
TQ-003: Playwright configuration exists and shall be used for end-to-end validation when flows are implemented.  
TQ-004: Backend tests shall validate investment confirmation syncing project totals and publishing events.  
TQ-005: Target backend test coverage shall include models, serializers, permissions, views, investment flow, project verification flow, repayment flow, and auth flow.  
TQ-006: Target test coverage should reach at least 80 percent for backend critical paths.  
TQ-007: API contract tests shall validate response envelope handling and frontend service expectations.  
TQ-008: Security tests shall validate role-based access and object-level permissions.

## 12. Current Implementation Gaps and Risks

GAP-001: Forgot password, terms, and privacy routes are linked but not registered in the frontend router.  
GAP-002: Contact form submission is simulated and does not call a backend.  
GAP-003: Messages are mock frontend data and are not persisted.  
GAP-004: Entrepreneur investor network data is mock frontend data.  
GAP-005: Dashboard notification data is static UI, not backend-backed.  
GAP-006: Settings page mostly simulates profile, security, notification, wallet, billing, session, and provider actions.  
GAP-007: Payment processing is not integrated with a gateway.  
GAP-008: Investment confirmation currently depends on status changes, likely through admin/API, not payment webhooks.  
GAP-009: AI classification fields exist on projects, but classification tasks are not implemented.  
GAP-010: Notification model exists, but notification API/routes are not exposed.  
GAP-011: Audit logging is planned but not implemented.  
GAP-012: KYC fields exist, but KYC submission and admin verification endpoints are not implemented.  
GAP-013: Reviews, project updates, documents API actions, and recommendation APIs are planned but not implemented.  
GAP-014: Public project detail API currently allows retrieval of any non-deleted project by slug; target production should restrict unverified/draft detail visibility to owner/admin unless intentionally public.  
GAP-015: Milestone and repayment write permissions are broad authenticated access in the current implementation and should be tightened to owner/admin/staff rules before production.  
GAP-016: Auth views use raw JSON rendering while other API views use the standard envelope; this is supported by the frontend but should be standardized for API consistency.  
GAP-017: Access tokens and refresh tokens are stored in local storage, which increases XSS exposure; production security review should consider hardened storage and CSP.

## 13. Acceptance Criteria Summary

AC-001: A visitor can browse public pages and view active verified projects.  
AC-002: A visitor can register as investor or entrepreneur.  
AC-003: A registered user can log in, maintain a session, refresh access tokens, and log out.  
AC-004: An entrepreneur can submit a project with required data and optional media.  
AC-005: An admin can verify a project and make it active.  
AC-006: A verified active project appears in public project listings.  
AC-007: An authenticated investor can submit an investment request at or above the minimum amount.  
AC-008: A confirmed investment updates project funded amount and investor count.  
AC-009: A project detail page receives or polls funding updates and displays recent confirmed payments.  
AC-010: An investor can view dashboard metrics and transactions scoped to their own investments.  
AC-011: An entrepreneur can view dashboard metrics and project management data scoped to their own projects.  
AC-012: Project owners and admins can edit and soft delete projects.  
AC-013: Non-owners cannot mutate projects they do not own.  
AC-014: API list responses are paginated and support documented filters and ordering.  
AC-015: Backend API documentation is available through Swagger/OpenAPI.  
AC-016: Docker Compose can run the backend with PostgreSQL and Redis.  
AC-017: Unit tests for existing investment synchronization pass.

## 14. Future Roadmap Requirements

The following capabilities are part of the target product direction and should be specified in detail before implementation:

- Full payment processor integration and webhook handling.
- Refund and failed-payment flows.
- Persistent wallet and billing ledger.
- Persistent messaging and attachments.
- Notification APIs and email delivery.
- Email verification and password reset.
- KYC upload and admin verification workflow.
- Project updates/news posts.
- Project reviews and ratings.
- Project documents API with verification.
- AI classification and recommendations.
- Admin reports and audit logs.
- Investor favorites/watched projects persistence.
- Portfolio performance APIs instead of frontend-only aggregation.
- Production object storage for media and documents.
- Monitoring, logging, rate limiting, and abuse protection.

## 15. Traceability Matrix

| Area | Primary Frontend Files | Primary Backend Files |
| --- | --- | --- |
| Routing | `src/App.tsx` | `backend/config/urls.py` |
| Auth | `src/hooks/useAuth.tsx`, `src/services/authService.ts`, `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx` | `backend/apps/users/*` |
| Projects | `src/services/projectsService.ts`, `src/pages/BrowseProjects.tsx`, `src/pages/ProjectDetails.tsx`, `src/pages/StartProject.tsx`, `src/pages/EditProject.tsx` | `backend/apps/projects/*` |
| Investments | `src/services/investmentsService.ts`, dashboards, project details | `backend/apps/investments/*` |
| Dashboards | `src/pages/dashboard/*`, `src/components/dashboard/*` | projects and investments APIs |
| Live Updates | `src/pages/ProjectDetails.tsx` | `backend/apps/projects/views.py`, `backend/apps/investments/services.py`, `backend/apps/investments/signals.py` |
| Styling | `src/index.css`, `tailwind.config.ts`, `src/components/ui/*` | Not applicable |
| Deployment | `package.json`, Vite config | `backend/Dockerfile`, `backend/docker-compose.yml`, settings modules |
| Tests | `vitest.config.ts`, `src/test/*`, `playwright.config.ts` | `backend/apps/investments/tests.py`, `backend/pytest.ini` |

