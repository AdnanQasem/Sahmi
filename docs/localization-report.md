# Localization implementation report

## Scope and repository state

- Branch: `feature/backend-messaging-security-hardening`
- Starting SHA: `7eb06750969f7424a0b91c1dbb20235708751b94`
- Existing staged `docs/backend-repair-start.patch` and untracked `ahmi-backups` were preserved and excluded from this work.

## Implemented

- Added `i18next` and `react-i18next`, organized English/Arabic resources, document `lang`/`dir` synchronization, and a keyboard-accessible global switcher.
- Visitor choice is stored immediately in `localStorage` under `sahmi.language`.
- Added server-controlled `User.preferred_language` (`en`/`ar`), migration, authenticated profile API support, login/startup synchronization, cached-user startup fallback, and settings-page persistence.
- Localized the shared navigation/footer and the principal landing, browsing, project detail, authentication, project create/edit, investor/entrepreneur dashboard, transaction, message, notification, and settings states and controls.
- Added translated display mapping for project/investment statuses, payment methods, and notification types without changing API or database values.
- Added shared `Intl` helpers for dates, numbers, percentages, and currencies and applied them to cards, transaction details, messages, project details, and dashboards.
- Added RTL behavior for document flow, Arabic system fonts, logical start/end alignment, sidebar/mobile drawer movement, directional icons, technical LTR fields, and user message `dir="auto"` handling.
- Added structured API status/code translation fallback while preserving useful backend validation text.

## Browser walkthrough

The production build was exercised headlessly at desktop (1440×900) and mobile (390×844) widths. API calls were intercepted with disposable responses; no repository or development database records were changed. The walkthrough covered landing, project browsing, login, About, Contact, How It Works, investor dashboard, entrepreneur dashboard, project form, messages, notifications, and settings in Arabic, then switched back to English and verified LTR.

## Migrations

- `backend/apps/users/migrations/0002_add_preferred_language.py`

The migration adds a non-null two-character field with default `en`, preserving existing rows.

## Remaining localization risks

Complete Arabic coverage is not claimed. The major workflows and shared states were reviewed, but some long-form secondary marketing/card copy on About, Contact, and How It Works, several deep account/billing demonstration labels in Settings, and page-specific administrative CRUD labels remain English. Time-zone place names, currency codes, emails, IDs, API values, and user-authored content intentionally remain unchanged. A native-speaker copy review and additional visual QA of dense admin tables/charts are still recommended.

## Business logic

Stored enum codes, route paths, API field names, numeric values, and business rules were not changed. The only backend data-model change is the language preference field.