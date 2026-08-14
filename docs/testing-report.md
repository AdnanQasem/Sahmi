# Testing Report

## Passing verification

- Django system check: exit 0.
- Migration consistency check: exit 0, no changes detected.
- All migrations applied to an in-memory disposable database: exit 0.
- Focused backend suite: 46 tests passed, exit 0.
- Full backend suite: 58 tests passed, exit 0.
- OpenAPI generation/validation: exit 0, 0 schema errors; warnings documented separately.
- TypeScript `--noEmit`: exit 0.
- Focused frontend suite: 8 tests passed, exit 0.
- Full frontend suite: 12 tests passed, exit 0.
- Production build: exit 0.
- Manual API smoke: exit 0 and `SMOKE_OK` for login, send, reload persistence, unread/read, participant denial, notifications, preferences, logout blacklist.

## Focused coverage added

Backend tests cover role escalation, participant access, sender spoofing, deleted-message privacy, notification/preference ownership, JWT rotation/blacklist/logout, public project privacy, investment authorization and totals, rate limiting, and audit access/sanitization.

Frontend tests cover loading conversations, sending, duplicate prevention, notifications, mark one/all read, saving preferences, logout cleanup, and rotated refresh-token storage.

## Non-failing warnings

- JWT tests warn that the development fallback key is shorter than the recommended HMAC length.
- Vitest reports React Router v7 future-flag warnings.
- Vite reports stale Browserslist data and a bundle chunk over 500 kB.
- OpenAPI reports serializer-method type-hint and enum naming warnings, with zero errors.