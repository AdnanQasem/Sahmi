# Localization command results

All commands ran from the repository root unless a backend working directory is shown.

| Command | Exit | Result |
|---|---:|---|
| `git status --short --branch` | 0 | Branch/status recorded; existing staged patch and untracked backup preserved. |
| `npm install i18next react-i18next` | 0 | Dependencies installed; npm reported pre-existing audit advisories. |
| `backend\..\venv\Scripts\python.exe manage.py makemigrations users --name add_preferred_language` | 0 | Created users migration 0002. |
| `npx tsc --noEmit` | 0 | Final TypeScript check passed. |
| `manage.py check --settings=config.settings.test` | 0 | No Django system-check issues. |
| `manage.py makemigrations --check --dry-run --settings=config.settings.test` | 0 | No missing migrations. |
| `manage.py migrate --noinput --settings=config.settings.test` | 0 | All migrations, including users 0002, applied to the disposable in-memory database. |
| `manage.py test apps.users.tests.PreferredLanguageTests --settings=config.settings.test -v 2` | 0 | 2 preference API tests passed. |
| `manage.py test --settings=config.settings.test -v 1` | 0 | 60 backend tests passed; test-only short JWT-key warnings were emitted. |
| Focused localization/integration Vitest command | 1 | Initial sandbox/config access failure; rerun outside sandbox. |
| Focused localization/integration Vitest reruns | 1 | Found and fixed malformed dashboard JSX, an outdated notification expectation, and a jsdom-incompatible animated form fixture. |
| `npm test` | 0 | Final result: 10 files, 21 tests passed. React Router future-flag warnings only. |
| `npm run build` | 1 | First passes found two JSX transform errors introduced during string replacement; both were corrected. |
| `npm run build` | 0 | Final production build passed; existing Browserslist-age and >500 kB chunk warnings remain. |
| `node scripts/localization-smoke.mjs` | 1 | First run blocked by missing Chromium; browser install timed out after 304 seconds but installed full Chromium. |
| `node scripts/localization-smoke.mjs` | 1 | Second run found a mobile selector targeting the hidden desktop link; selector scoped to the mobile menu. |
| `node scripts/localization-smoke.mjs` | 0 | Desktop/mobile bilingual walkthrough passed. |
| `git diff --check` | 0 | No whitespace errors; Git emitted Windows line-ending conversion warnings. |

## Notes

- The browser smoke uses mocked API responses and a local production preview; it does not mutate backend data.
- The production bundle warning is not localization-specific and was not addressed as unrelated refactoring.
- No credentials or secrets were added to source or reports.