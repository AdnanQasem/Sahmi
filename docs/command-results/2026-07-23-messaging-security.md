# Command Results — 2026-07-23

| Command | Exit | Result |
|---|---:|---|
| `git status --short --branch; git branch --show-current; git rev-parse HEAD` | 0 | Branch and starting SHA captured; existing uncommitted work identified. |
| `..\venv\Scripts\python.exe manage.py check` (initial) | 1 | Failed: missing `is_participant` import. Fixed service/export and adjacent runtime bugs. |
| `..\venv\Scripts\python.exe manage.py check` (rerun) | 0 | No system issues. |
| `..\venv\Scripts\python.exe manage.py makemigrations --check --dry-run` (initial) | 1 | Interactive notification owner rename prompt. Regenerated explicitly as a data-preserving rename. |
| `cmd /c "echo y| ..\venv\Scripts\python.exe manage.py makemigrations notifications messaging audit --name messaging_notifications_security"` | 0 | Created audit, messaging, and notification migrations. |
| `..\venv\Scripts\python.exe manage.py test apps.messaging apps.notifications apps.users apps.audit --noinput` (initial) | 1 | Exposed duplicate action routing, unread/send failures, stale field references. Fixed and reran. |
| `..\venv\Scripts\python.exe manage.py test apps.messaging --noinput` | 0 | 19 passed. |
| `..\venv\Scripts\python.exe manage.py test apps.notifications.tests.NotificationThrottleTests --noinput` | 0 | 1 passed after fixing scoped throttle enforcement. |
| `..\venv\Scripts\python.exe manage.py test apps.investments apps.projects --noinput` | 0 | 14 passed. |
| `..\venv\Scripts\python.exe manage.py test --noinput` | 0 | Full backend: 58 passed. |
| `..\venv\Scripts\python.exe manage.py test apps.messaging apps.notifications apps.users apps.audit apps.investments apps.projects --noinput` | 0 | Final focused backend: 46 passed. |
| `..\venv\Scripts\python.exe manage.py makemigrations --check --dry-run --noinput` | 0 | No changes detected. |
| `..\venv\Scripts\python.exe manage.py migrate --settings=config.settings.test --noinput` | 0 | All migrations applied to disposable in-memory SQLite. |
| `..\venv\Scripts\python.exe manage.py spectacular --file ..\docs\openapi-schema-after.yaml --validate` | 0 | Schema generated; 0 errors, 22 warnings (16 unique). |
| `npm test -- --run src/test/messages.test.tsx src/test/notifications.test.tsx src/test/preferences.test.tsx src/test/logout.test.ts src/test/token-rotation.test.ts` | 0 | 5 files, 8 tests passed. |
| `npm test -- --run` | 0 | Full frontend: 7 files, 12 tests passed. |
| `npx tsc --noEmit` | 0 | TypeScript passed. |
| `npm run build` (sandboxed) | 1 | Environment denied esbuild config traversal. Reran with approved escalation. |
| `npm run build` (first escalated) | 1 | Found mixed `??`/`||` syntax; fixed. |
| `npm run build` (final) | 0 | Production build succeeded; 3056 modules transformed. |
| Disposable DB API smoke via `manage.py shell < sahmi_smoke_tmp.py` | 0 | Printed `SMOKE_OK login send persistence unread unauthorized notifications preferences logout_blacklist`. |
| `git diff --check` | 0 | No whitespace errors. |

Temporary smoke scripts and disposable database files were explicitly removed after verification.