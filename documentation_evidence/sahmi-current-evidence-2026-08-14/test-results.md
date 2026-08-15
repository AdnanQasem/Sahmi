# Sahmi verification results — 2026-08-14

All commands were run against the current working tree, not a clean checkout of `HEAD`.

| Check | Command | Result |
|---|---|---|
| Frontend unit/component tests | `npm test -- --run` | PASS — 20 files, 53 tests, 22.75 s reported by Vitest (26 s wall time) |
| Frontend production build | `npm run build` | PASS — 3,110 modules transformed; 39.65 s reported (42.2 s wall time) |
| Frontend lint | `npm run lint` | **FAIL** — 83 findings: 34 errors and 49 warnings. Four errors are in project/config source; most remaining errors come from ESLint scanning `venv/` third-party JavaScript because it is not ignored. |
| Backend tests | `..\venv\Scripts\python.exe manage.py test apps --settings=config.settings.test` from `backend/` | PASS — 111 tests, 38.150 s reported (53 s wall time); Django system check found 0 issues |
| Migration drift | `manage.py makemigrations --check --dry-run --settings=config.settings.test` | PASS — `No changes detected` |
| Local development DB migration state | `manage.py showmigrations --plan` | All listed migrations applied, through projects 0009, investments 0006, notifications 0005, and users 0004 |
| OpenAPI generation/validation | `manage.py spectacular --file .../openapi-schema.yml --validate` | Schema produced, but with 54 warnings (33 unique) and 16 errors (4 unique); therefore the bundled schema is useful but partial |

## Non-failing warnings observed

- Vitest printed React Router v7 future-flag warnings in several component tests.
- Vite warned that `caniuse-lite` is 14 months old.
- Vite warned that the main minified JS chunk is larger than 500 kB: 1,799.40 kB (497.74 kB gzip).
- Backend tests warned that the test HMAC key is 18 bytes, below the 32-byte SHA-256 recommendation. This concerns the configured test secret, not a failed test.
- OpenAPI could not infer serializers for the password-reset request/confirm, contact, and notification-stream APIViews and reported serializer method/enum warnings. Consult source code for those endpoints.
- Project/config lint errors: empty-interface rule in `src/components/ui/command.tsx:24` and `src/components/ui/textarea.tsx:5`, explicit `any` in `src/pages/dashboard/InvestorDashboard.tsx:90`, and CommonJS `require` in `tailwind.config.ts:110`. ESLint also reports Fast Refresh and hook-dependency warnings. The lint configuration does not exclude `venv/`, producing 30 additional errors from Django/drf-spectacular vendor/template JavaScript.

## Coverage and E2E status

No coverage command/script or threshold is configured in `package.json` or `backend/requirements.txt`, and no coverage percentage was generated. Playwright configuration/fixture files exist, but no Playwright test specifications were found. The Playwright-managed Chromium binary was absent, so no E2E suite could run. Public screenshots were later captured successfully by directing Playwright to the installed system Google Chrome; no browser was downloaded.
