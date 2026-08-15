# Screenshot evidence status and capture checklist

Four verified public screenshots are included. They were captured on 2026-08-15 with the repository's Playwright library driving the installed system Google Chrome, against local Vite and Django development servers. Only public GET/list routes were opened; no form was submitted and no database state was intentionally changed.

| File | Route/language | Notes |
|---|---|---|
| `public-home-en.png` | `/`, English/LTR | Full-page desktop capture. Several animation-driven lower sections remained visually blank at capture time; the hero, platform metrics, CTA band, and footer are visible. |
| `public-home-ar-rtl.png` | `/`, Arabic/RTL | Same full-page viewport after persisting `sahmi.language=ar`; verifies direction and localized hero/footer. |
| `browse-projects-en.png` | `/projects`, English/LTR | Full active-opportunities and successfully-funded sections using current local public project data. |
| `contact-en.png` | `/contact`, English/LTR | Contact hero/details/footer. Animation-driven middle content remained visually blank at capture time. |

The reproducible capture script is `../capture-public-screenshots.mjs`. Authenticated screenshots were deliberately not fabricated, no demonstration records were created, and those screens remain the checklist below.

Recommended captures for Chapters 4–6, using seeded/demo accounts and both English and Arabic where noted:

1. Public home: desktop EN and mobile AR/RTL.
2. Browse Projects: active-opportunities grid, funded-success section, URL filters, and pagination.
3. Project detail at fundraising, fully funded, implementation, and completed states; include funding bar, cost table, timeline, updates/diff, evidence, and repayment schedule.
4. Registration, login, forgot/reset password, and validation states.
5. Entrepreneur dashboard, analytics, investors, messages, notifications, settings, and Fund Disbursement page.
6. Entrepreneur project wizard including cost table, milestones, documents, FAQs, draft restoration, and submission.
7. Entrepreneur edit request submission and pending-review state.
8. Investor dashboard, transactions/detail dialog, messages, notifications, settings, and investment dialog.
9. Admin overview and projects review dialog showing edit diff, cost table, timeline, uploaded-image review metadata/status.
10. Admin investments, milestones, repayments, users, categories, messages, notifications, settings, and fund-request review/release.
11. Fund request states: Requested, Under Review, Approved, Revision Required/Rejected, Released with simulated transaction reference.
12. Milestone completion evidence submission/review and final Completed project page.
13. Contact, privacy, terms, about, and how-it-works pages.
14. API documentation at `/api/docs/` and Django admin only if academically relevant.

For every screenshot, record date/time, commit plus working-tree identifier, role, route, language, viewport, seed record IDs, and whether values are mocked/simulated.
