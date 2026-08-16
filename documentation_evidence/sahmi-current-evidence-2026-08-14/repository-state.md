# Repository state used for this evidence package

- Initial inspection date: 2026-08-14 (Asia/Hebron)
- Baseline commit verified: `dd6a4aede05d1e1ecb0ce9e7d4ff9de3bd0a0507`
- Short commit: `dd6a4ae`
- Commit time: `2026-08-15T13:06:03+03:00`
- Commit subject: `Finally.`
- Scope: application source and migrations at this commit

The application was first inspected while its changes were uncommitted. Those same changes, including the evidence package's first version, were then committed as `dd6a4ae`. Immediately after that commit, `git status --porcelain=v1` returned no entries. No application-source difference was introduced between the recorded test runs and the commit.

This metadata file, the handoff, checksum manifest, and rebuilt ZIP were refreshed after the commit so they can name `dd6a4ae`. That unavoidable self-reference means these evidence-only refreshes differ from the copy stored in `dd6a4ae`; the application implementation itself remains clean and reproducible at that commit.

## Repository presentation cleanup after the baseline

The following non-runtime artifacts were removed before sharing the repository: `.tmp_figures_24_32/`, `.tmp_sahmi_figures_6b5fd451/`, four root Figure 24 preview/inspection files, `ahmi-backups`, `docs/backend-repair-start.patch`, `.agent/`, `.claude/`, `bun.lock`, and `bun.lockb`. `.gitignore` now prevents these local/generated artifacts from returning. The ignored local `.agents/` directory could not be removed because Windows denied access, but it is empty, untracked, ignored, and will not appear through a Git repository link.

No React/Django application source, migration, automated test, current evidence artifact, substantive documentation, or npm dependency lockfile was removed by this cleanup. Every removed tracked item remains recoverable from commit `dd6a4ae`.
