# Sahmi Report Content and Source Register

**Purpose:** reusable, evidence-bounded material for a future graduation-project writer  
**Not a manuscript:** chapter prose must still be edited into the university template and supported with verified literature  
**Evidence date:** 25 July 2026

## 1. Chapter-by-chapter reusable content

### 1.1 Front matter and abstract

Evidence-safe project description:

> Sahmi is a bilingual, role-oriented web prototype that organizes public project discovery, entrepreneur project submission and staff moderation, internal investment/milestone/repayment records, dashboards, persistent direct messaging, and in-app notifications. The current implementation uses a React/TypeScript single-page frontend and a Django REST Framework backend. The repository implements project and record workflows but does not process or settle real payments, provide complete KYC or AI execution, establish production deployment, or demonstrate user/economic outcomes.

Evidence-safe method summary:

> The study follows a four-phase Research and Development approach: Information Gathering, Prototype Design, Prototype Development, and Evaluation. The available evidence supports repository/document analysis, source-derived design and implementation, current frontend automated checks, and a technical repository audit. Human usability evaluation is not evidenced.

Evidence-safe result summary:

> The audit found a substantial mixed-status prototype: core project/account/communication workflows are implemented, while several settings and financial/security presentations are mocked or incomplete. Current audit evidence records 24 passing frontend tests and a passing TypeScript check. Backend test assets exist but were not freshly executed in that audit. Critical privacy and financial-integrity limitations and absent operational/human evidence prevent a production-readiness claim.

The abstract must not exceed 350 words under the methodology guide. Do not add participant counts, usability scores, market statistics, deployment results, or payment claims.

### 1.2 Chapter 1 — Introduction

Reusable points:

- Sahmi investigates a structured bilingual software prototype for project discovery, submission, moderation, internal contribution records, and communication.
- The project is framed around Palestinian entrepreneurship, but contextual market, banking, trust, fraud, and inclusion claims require authoritative sources.
- The research problem is not merely “build an application”; it is to determine an evidence-traceable set of requirements/architecture, assess implementation extent, and identify readiness limitations.
- Use RQ-01 through RQ-03 and OBJ-01 through OBJ-04 from `00-project-and-academic-context.md`.
- Significance can be argued at prototype/engineering level: traceable requirements, bilingual/RTL design, role boundaries, API/data architecture, and honest distinction between internal records and real financial operation.
- Scope must explicitly exclude money movement, regulatory status, complete KYC, AI execution, production service, and unevidenced human outcomes.

Claims that require sources before use:

- entrepreneurial finance conditions in Palestine;
- availability/limitations of payment providers;
- trust or fraud prevalence;
- crowdfunding/impact-investment adoption or market size;
- benefits of transparency/progress bars/storytelling;
- digital divide, financial inclusion, or socioeconomic impact.

### 1.3 Chapter 2 — Literature Review

Recommended thematic structure:

1. crowdfunding, donation/reward/equity/debt, and impact-funding distinctions;
2. platform trust, verification, information asymmetry, and governance;
3. Palestinian digital/financial/entrepreneurial context;
4. privacy/security in financial or crowdfunding web systems;
5. bilingual and right-to-left usability/accessibility;
6. role-based/API architecture and secure authorization;
7. software-prototype and usability evaluation methods;
8. related platforms and the research gap.

The current manuscript's explanations of Django, HTML, CSS, React, TypeScript, Docker, Trello, and editor tools are implementation background, not a sufficient literature review. Official product documentation may support technical facts but not social-science or market conclusions.

Related-platform comparison may discuss Kickstarter and GoFundMe only after current official availability, fee, funding-model, and country evidence is checked. Do not infer Palestinian availability from memory or the 2014 sample.

### 1.4 Chapter 3 — Research Methodology and System Design

Reusable verified method:

- **Information Gathering:** repository/document analysis and literature review; interviews/workshops/surveys `[NOT VERIFIED]`.
- **Prototype Design:** route inventory, actors, requirements, API contracts, Django data model, role matrix, architecture/ERD/workflow diagrams, bilingual direction strategy.
- **Prototype Development:** React/TypeScript/Vite and Django/DRF implementation; iterative development is visible in artifacts/history. Exact Scrum roles/sprints/Trello practice are `[TEAM CONFIRMATION REQUIRED]`.
- **Evaluation:** current frontend automated checks, static backend test inventory, dated historical logs, traceability, and source-level security/quality audit; no human usability study.

Use the Mermaid sources in `02-requirements-architecture-and-data.md` for architecture, ERD, authentication, project/investment states, and messaging. Label future production topology explicitly as proposed.

Ethics/data treatment:

- no human study can be claimed;
- screenshots should use synthetic data;
- personal/KYC/message/financial data must be excluded/redacted;
- source and intellectual-property permissions follow university policy `[TEAM CONFIRMATION REQUIRED]`.

### 1.5 Chapter 4 — System Implementation

Recommended implementation subsections:

1. verified frontend/backend stack and versions;
2. public routes/project discovery;
3. authentication/profile/password/localization;
4. project submission/edit/soft delete;
5. normal and staff moderation;
6. internal investment records, totals, and SSE;
7. dashboards/analytics;
8. milestone/repayment records;
9. persistent direct messaging;
10. in-app notifications/preferences;
11. staff administration and partial audit;
12. data/API design;
13. Docker/deployment configuration;
14. implemented/partial/mock/future boundary.

Safe statements:

- “Only confirmed internal records contribute to the synchronized project funding total.”
- “A transition into confirmed schedules a Redis publication after the database transaction commits.”
- “Persistent direct messaging is participant-scoped and uses HTTP polling.”
- “Notifications are persistent and in-app; email delivery is disabled.”
- “The public project serializer minimizes owner and document data.”
- “The staff API provides broad CRUD for principal domain records.”

Unsafe statements:

- “A payment is collected/settled/returned.”
- “Live events are private/secure.”
- “All project documents are securely stored.”
- “KYC verifies identity.”
- “AI categorizes projects.”
- “The platform is deployed on DigitalOcean/Nginx.”
- “All workflows are bilingual and accessible.”

### 1.6 Chapter 5 — Testing, Evaluation, Findings, and Discussion

Use exact current results:

- 25 July 2026: `npm test -- --run` — 11 files, 24 tests passed.
- 25 July 2026: `npx --no-install tsc --noEmit` — passed.
- 64 backend test methods exist but were not run in the graduation audit.

Label 58/60 backend and 12/21 frontend historical results with their dates and earlier source state. The mocked-API localization walkthrough is not live integration.

Recommended findings:

1. The current prototype is broader than the old manuscript because persistent messaging, notifications, audit rows, password reset, localization, and rich staff APIs now exist.
2. Internal finance records exist, but money movement/payment verification does not.
3. Critical SSE/payment-history disclosure and investment integrity defects remain.
4. Persistent messaging/notices have clear boundaries: polling, in-app only, and incomplete project-conversation/policy support.
5. The interface mixes real data with simulations.
6. deployment artifacts are configuration, not operation;
7. schema/dependency reproducibility is incomplete;
8. human evaluation is absent.

Discussion must answer each RQ and acknowledge internal, construct, external, and reliability limits described in `03-testing-evaluation-and-findings.md`.

### 1.7 Chapter 6 — Future Work

Future work may derive from:

- endpoint/object privacy and data minimization;
- immutable/corrective financial record design;
- business/legal/payment-provider decisions;
- upload validation/private storage/retention;
- complete audit/logging/monitoring;
- schema/dependency reproducibility;
- removal or implementation of mocked UI;
- real KYC only after policy/legal review;
- real AI only with model/invocation/review/evaluation;
- current backend/E2E/accessibility/load/security/deployment testing;
- approved human evaluation and native Arabic review.

Do not word future work as if it is already in progress or guaranteed.

### 1.8 Chapter 7 — Conclusion

Evidence-safe conclusion:

> Sahmi demonstrates a substantial bilingual, role-oriented academic prototype with traceable public project, account, project-management, internal record, messaging, notification, and administrative components. Its main contribution in the audited state is the integration and documentation of these components, not verified financial operation or measured social impact. The repository also reveals important privacy, financial-integrity, upload, audit, reproducibility, testing, and deployment limitations. Sahmi is therefore defensible as a controlled development-stage prototype with transparent limitations, but not as a production or regulated financial service.

The conclusion must not claim secure payments, guaranteed returns, legal compliance, production readiness, stakeholder acceptance, or socioeconomic impact.

### 1.9 Appendices

Suggested appendices:

- A: repository-verified SRS and status legend;
- B: API catalogue;
- C: ERD/data dictionary;
- D: RBAC/use cases/state diagrams;
- E: test command/result register;
- F: requirement-to-source/test traceability;
- G: synthetic screenshot register;
- H: approved evaluation instrument/raw anonymized data, only if genuinely supplied;
- I: team declaration of mock/limitation disclosure.

## 2. Existing academic and technical source register

### 2.1 Sources that are directly available

| ID | Source as available | Permitted use | Status |
|---|---|---|---|
| SRC-A01 | Naji Shukri Alzaza, *Research Methodology in Information Technology: Student's Handbook*, 2nd ed., Gaza, Palestine, 2020. Title material identifies University of Palestine affiliation; no separate publisher stated. | primary authority for report/research conventions | Complete local PDF; bibliographic style formatting still needs supervisor review |
| SRC-A02 | *Mobile-Based Library Loan Service (MBLLS)*, graduation proposal sample, University of Palestine, 2014. | organization example, especially Chapters 1–3/four phases | supplied document has placeholder author/supervisor; `[SOURCE VERIFICATION REQUIRED]` |
| SRC-A03 | Sahmi project team, `Sahmi_Documentation_Corrected.docx`, 2026. | current internal draft/project history | not an external academic source |
| SRC-A04 | Sahmi source repository, audited working tree, branch/commit/date in this package. | implementation evidence | internal software artifact; dirty working tree |
| SRC-A05 | `docs/graduation-audit/00` through `06`. | academic/repository/security synthesis | internal audit artifacts |
| SRC-A06 | dated implementation/testing/security/localization reports and command logs under `docs/`. | historical development/test provenance | date/source-state qualification required |

### 2.2 Technical references listed by the current Sahmi manuscript

The current manuscript lists the following. They are transcribed exactly enough for identification, not bibliographically submission-ready. Titles, authoring organization, publication/update year, URL, access date, version, and final citation format must be checked `[SOURCE VERIFICATION REQUIRED]`.

| Current no. | Existing entry | Appropriate use |
|---:|---|---|
| 1 | Django Software Foundation, “Django Documentation,” `https://docs.djangoproject.com/en/stable/` | Django behavior/version-specific implementation facts |
| 2 | Encode, “Django REST Framework Documentation,” `https://www.django-rest-framework.org/` | DRF concepts/API behavior |
| 3 | PostgreSQL Global Development Group, “PostgreSQL Documentation,” `https://www.postgresql.org/docs/` | PostgreSQL facts; repository only configures it |
| 4 | Python Software Foundation, “Python Documentation,” `https://docs.python.org/3/` | language/runtime facts |
| 5 | React Team, “React Documentation,” `https://react.dev/` | React implementation facts |
| 6 | MDN Web Docs, “HTML Documentation,” `https://developer.mozilla.org/en-US/docs/Web/HTML` | web standards background |
| 7 | MDN Web Docs, “CSS Documentation,” `https://developer.mozilla.org/en-US/docs/Web/CSS` | CSS background |
| 8 | Tailwind Labs, “Tailwind CSS Documentation,” `https://tailwindcss.com/docs` | styling implementation |
| 9 | MDN Web Docs, “JavaScript Documentation,” `https://developer.mozilla.org/en-US/docs/Web/JavaScript/` | language background |
| 10 | Microsoft, “TypeScript Documentation,” `https://www.typescriptlang.org/docs/` | TypeScript facts |
| 11 | Vite Team, “Vite Documentation,” `https://vite.dev/guide/` | build/dev tool |
| 12 | Google, “Google Docs Editors Help,” `https://support.google.com/docs/` | only if team confirms tool use |
| 13 | Google, “Google Sheets Help,” `https://support.google.com/docs/topic/9054603` | only if team confirms tool use |
| 14 | GitHub, “GitHub Documentation,” `https://docs.github.com/` | version control/repository tooling |
| 15 | TanStack, “TanStack Query Documentation,” `https://tanstack.com/query/latest/docs/framework/react/overview` | frontend server-state |
| 16 | Git, “Git Documentation,” `https://git-scm.com/doc` | version control |
| 17 | Atlassian, “Trello Documentation,” `https://help.trello.com/` | only if team supplies Trello history |
| 18 | Microsoft, “Visual Studio Code Documentation,” `https://code.visualstudio.com/docs/` | development tool, not literature theme |
| 19 | Axios, “Axios Documentation,” `https://axios-http.com/docs/intro` | API client |
| 20 | shadcn, “shadcn/ui Documentation,” `https://ui.shadcn.com/docs` | component library |
| 21 | Docker Inc., “Docker Documentation,” `https://docs.docker.com/` | container configuration |
| 22 | Docker Inc., “Docker Compose Documentation,” `https://docs.docker.com/compose/` | Compose configuration |
| 23 | NGINX Inc., “NGINX Documentation,” `https://nginx.org/en/docs/` | only for proposed architecture; no Nginx config exists |
| 24 | DigitalOcean, “DigitalOcean Docs,” `https://docs.digitalocean.com/` | only for future/proposed deployment unless proof supplied |
| 25 | GitHub, “GitHub Actions Documentation,” `https://docs.github.com/en/actions/` | future; no workflow exists |
| 26 | J. Sutherland and K. Schwaber, “The Scrum Guide,” Scrum.org, 2020, `https://scrumguides.org/` | only for verified Agile practice inside development phase |

These 26 sources are primarily vendor/official technical documentation. They cannot support the core crowdfunding, trust, Palestinian context, privacy, bilingual usability, or evaluation literature by themselves.

### 2.3 Sources in the 2014 proposal

The MBLLS sample contains mobile-library, WAP, mobile-service, and usability literature appropriate to that old proposal. Its citations and its questionnaire are not Sahmi evidence and should not be migrated into Sahmi merely to increase the reference count. If the sample itself is cited for organization, cite the supplied proposal as a structural example with `[SOURCE VERIFICATION REQUIRED]` authorship.

## 3. Required scholarly/authoritative source acquisition

| Theme/claim | Required source type | Current status |
|---|---|---|
| crowdfunding/impact-funding definitions and models | peer-reviewed research, academic books, regulator/international organization | `[SOURCE REQUIRED]` |
| donation/reward/equity/debt distinctions | scholarly/regulatory primary source | `[SOURCE REQUIRED]` |
| trust, verification, information asymmetry, platform governance | peer-reviewed research | `[SOURCE REQUIRED]` |
| Palestinian entrepreneurship/digital finance context | official Palestinian/international statistics and peer-reviewed/local research | `[SOURCE REQUIRED]` |
| payment-provider country availability/fees | current official provider policy plus appropriate local authority | `[SOURCE REQUIRED]` |
| legal meaning of investment, crowdfunding, returns, KYC/AML | competent local legal/regulatory sources and adviser confirmation | `[SOURCE REQUIRED]` / `[TEAM CONFIRMATION REQUIRED]` |
| privacy/security of financial/crowdfunding APIs | primary standards/peer-reviewed/official security guidance | `[SOURCE REQUIRED]` |
| JWT browser storage/CSP | primary standards/official security guidance | `[SOURCE REQUIRED]` |
| file upload/private storage security | primary standards/official security guidance | `[SOURCE REQUIRED]` |
| bilingual/RTL usability/accessibility | peer-reviewed HCI/localization research and accessibility standards | `[SOURCE REQUIRED]` |
| software R&D/prototype evaluation | methodology research; supplied book can anchor structure | partially supplied |
| usability instrument | validated original instrument and permission/licence if applicable | `[SOURCE REQUIRED]`; no instrument approved |
| related-platform fees/availability | current official Kickstarter/GoFundMe pages | `[SOURCE REQUIRED]` |

Do not fabricate DOI, publisher, volume, issue, pages, access date, or author. Do not cite an article that the team has not actually obtained and checked.

## 4. Existing claim-to-source problems

| Existing claim family | Present support | Required treatment |
|---|---|---|
| Palestinian entrepreneurs cannot access international providers/banks | no verified citation in supplied manuscript | `[SOURCE REQUIRED]`; make current and jurisdiction-specific |
| local fundraising commonly uses social media/direct transfer/Jawwal Pay | prose/conceptual figure only | `[SOURCE REQUIRED]` |
| fraud/trust is prevalent | no empirical source | `[SOURCE REQUIRED]` |
| progress bars/transparency/story increase support | no scholarly source | `[SOURCE REQUIRED]` |
| Kickstarter/GoFundMe fees/country rules | platform descriptions but no verified current source details | official-current citations required |
| Sahmi has 230+ projects, $2.4M, 12,000+ users, 89% | hard-coded UI | remove from research claims |
| project review takes 2–3 business days | translation copy only | `[TEAM CONFIRMATION REQUIRED]`; no SLA evidence |
| payments use secure providers/bank-level encryption | UI copy only; no provider | false as implementation claim |
| failed campaign keeps funds | one FAQ string | contradicts refund string; undefined |
| failed campaign receives full refund | another FAQ string | contradicts keep-funds string; undefined |
| all founders/funds/KYC are verified | fields/badges only | misleading; no complete workflow |
| Agile sprints 1–12, deployment, feedback | current manuscript only | `[TEAM CONFIRMATION REQUIRED]`; artifacts absent |
| user feedback/usability success | no protocol/data | `[NOT VERIFIED]` |
| social/economic impact | no outcomes/evaluation | `[NOT VERIFIED]` |

## 5. Existing tables

The current Word manuscript lists:

| Table | Existing title | Recommended disposition |
|---:|---|---|
| 1 | List of Abbreviations and Acronyms | retain/update for R&D, RBAC, JWT, SSE, API, KYC, CI/CD, SRS |
| 2 | Similar Applications Comparison | retain only after current authoritative sources; distinguish product models |
| 3 | Stakeholders and Their Needs | revise to avoid implying interviewed participants |
| 4 | Functional Requirements Summary | replace/derive from repository-verified FR table |
| 5 | Non-functional Requirements Summary | replace/derive from NFR table |
| 6 | Core Data Entities | replace/expand with repository data dictionary |
| 7 | Deployment Configuration Scope | retain with “configured/not verified” labels |
| 8 | Feature Modules and Implementation Status | replace with full status/evidence table |
| 9 | Planned Test Cases | separate executed, static, historical, and future |
| 10 | Planned Acceptance Criteria Traceability | update with AC met/not met/not verified |
| 11 | API Map | replace with current endpoint catalogue |
| 12 | Repository Traceability Matrix | update from current source |

Additional recommended tables:

- RQ–objective–method–evidence alignment;
- current technology versions;
- RBAC matrix;
- security/quality findings;
- exact test evidence;
- limitations/future work;
- citation/source-verification register;
- screenshot evidence register.

## 6. Existing figures and suggested placement

### 6.1 Figures listed in the current manuscript

| Figure(s) | Existing caption/subject | Evidence status | Suggested treatment |
|---|---|---|---|
| 1 | Django | generic logo/technology | omit or place in implementation appendix; cite official source/licence |
| 2 | HTML5 | generic logo | usually omit |
| 3 | CSS3 | generic logo | usually omit |
| 4 | Bootstrap, reviewed but not used | not current stack | remove |
| 5 | JavaScript | generic logo | usually omit |
| 6 | PostgreSQL | configured, not run | implementation/deployment subsection only |
| 7 | Trello | tool use unverified | remove unless team supplies evidence |
| 8 | Google Sheets & Google Docs | tool use unverified | remove unless confirmed |
| 9 | GitLab, legacy | repository uses GitHub | remove or explicitly historical |
| 10 | Visual Studio Code | development tool | optional appendix, not literature |
| 11 | Docker | configured | implementation/deployment |
| 12 | Docker Compose | configured | implementation/deployment |
| 13 | NGINX, not configured | future only | proposed deployment, clearly dashed/not implemented |
| 14 | DigitalOcean, not configured/deployed | future only | remove unless deployment evidence |
| 15 | CI/CD, planned | no workflow | future architecture only |
| 16 | Kickstarter | related system | literature review after source verification |
| 17 | GoFundMe | related system | literature review after source verification |
| 18 | Informal Local Methods | conceptual, local facts unsourced | literature only after sources |
| 19 | Agile | current manuscript methodology | replace with four-phase R&D diagram; Agile nested inside development only if confirmed |
| 20 | Use-case view of stakeholders/interactions | conceptual | Chapter 3, updated to current roles/statuses |
| 21 | Conceptual core domain model | conceptual | replace with repository-derived ERD in Chapter 3/appendix |
| 22 | Target server-controlled investment confirmation/live-update sequence | conceptual/partly implemented | update to show internal confirmation and privacy limitation |
| 23 | Proposed system architecture/integration boundaries | conceptual | split implemented versus proposed |
| 24 | Conceptual public landing/project discovery | conceptual UI | Chapter 4 only if labelled conceptual; prefer current screenshot |
| 25 | Conceptual project detail/contribution | conceptual UI | same; “record contribution,” not payment |
| 26 | Conceptual authentication/onboarding | conceptual UI | same |
| 27 | Conceptual five-step submission wizard | conceptual UI | same |
| 28 | Conceptual admin verification workspace | conceptual UI | same |
| 29 | Conceptual investor portfolio dashboard | conceptual UI | same; disclose internal records/mock sections |
| 30 | Conceptual entrepreneur project/analytics dashboard | conceptual UI | same |
| 31 | Conceptual transaction/repayment monitoring | conceptual UI | same; no money engine |
| 32 | Conceptual messaging/account settings | conceptual UI | mixed real/mock; label |
| 33 | Conceptual Docker deployment topology | configured/proposed mix | replace with explicit development topology and dashed future topology |

### 6.2 Image artifacts found in the repository

| Location | Details | Use status |
|---|---|---|
| `.tmp_figures_24_32/Figure24.png` through `Figure32.png` | nine 1900×1118 extracted conceptual figures; small 950×559 JPG copies also present | generated/extracted duplicates; captions identify them as conceptual |
| `.tmp_sahmi_figures_6b5fd451/` | duplicate extracted images/previews corresponding to Figures 24–32 | do not include twice |
| `Figure24-inspect.png`, `figure24_temp.png` | duplicate 1900×1118 Figure 24 artifacts | redundant |
| `figure24_preview.jpg`, `figure24_preview_q30.jpg` | 950×559 Figure 24 previews | redundant |
| `public/Screenshot 2026-04-13 114024.png` | 433×385 file; no route/date/build/role/data provenance is embedded in documentation | `[NOT VERIFIED]`; team must identify before use |
| `public/sahmi-hero-bg.png` | 1024×1024 decorative hero asset | implementation/design illustration, not evidence |
| `public/sahmi-logo.svg`, `sahmi-wordmark.svg`, `sahmi-icon.svg`, `sahmi-logo-concept.svg` | brand assets | title/interface use subject to team ownership confirmation |
| `Sahmi_Documentation_Corrected.docx` media | 35 embedded images, including technology logos, conceptual diagrams, and UI figures | use captions/provenance/licensing carefully |

The local visual-inspection helper could not open the files because of a Windows sandbox refresh error. Dimensions, paths, embedded-media inventory, and Word captions were inspected. Content that cannot be established from captions remains `[NOT VERIFIED]`.

### 6.3 Mermaid diagrams supplied in the handoff

| Diagram | Source file | Suggested report placement |
|---|---|---|
| implemented logical architecture | `01` and `02` | Chapter 3 design / Chapter 4 implementation |
| repository ERD | `02` | Chapter 3 data design or appendix |
| authentication/refresh sequence | `02` | Chapter 3 security design / appendix |
| project lifecycle | `02` | Chapter 3 workflow |
| investment lifecycle | `02` | Chapter 3/4, with internal-record warning |
| confirmation/aggregate/event sequence | `02` | Chapter 4; disclose SSE privacy finding |
| messaging sequence | `02` | Chapter 4 |
| notification flow | `02` | Chapter 4 |
| configured development topology | `01`/`02` | Chapter 4 deployment configuration |
| proposed production topology | `02` | Chapter 6 only, clearly not implemented |

## 7. Documentation-versus-code contradiction register

| Documentation/interface statement | Current repository evidence | Correct report treatment |
|---|---|---|
| Persistent messaging absent | messaging models/API/UI/tests exist | implemented direct messaging with polling and boundaries |
| Notification APIs absent/static | model/API/preferences/polling UI exist | implemented in-app; email disabled |
| Audit logging absent | AuditLog/service/staff API/tests exist | partial due incomplete event coverage/integrity |
| Public profile/registration can grant staff | current serializers/views/model prevent it | stale old defect; describe current protection |
| Public detail exposes private drafts/docs | current detail/public serializer improves this | stale old defect; retain regression evidence |
| Investor chooses status at normal create | normal serializer makes status read-only | stale; remaining role/zero/mutability gaps |
| Only one backend/frontend test | 64 backend methods; current 24 frontend tests | stale |
| TypeScript currently fails | current audit no-emit check passed | stale |
| Interface English/LTR only | English/Arabic and RTL/LTR exist | stale; full/native review absent |
| Password reset/messaging/notices unavailable | current code implements them | update with operational boundaries |
| Secure provider/bank-level encrypted payments | no provider/webhook/receipt | unsupported; remove |
| Real platform counts/outcomes | hard-coded arrays | mock, not fact |
| Review in 2–3 business days | translation copy only | unverified SLA |
| All founders/KYC/funds verified | fields/badges, no complete process | storage/flag only |
| Failed goals keep funds | UI string | conflicts with refund string; undefined |
| Failed goals refund in full | UI string | conflicts with keep-funds; undefined |
| Agile is the research methodology | book/sample support R&D | four phases control; Agile inside development if evidenced |
| Twelve sprints occurred | current manuscript only | team confirmation required |
| Trello/Google tools used | docs/logos only | team confirmation required |
| DigitalOcean/Nginx deployment | no configuration/live proof | planned/future |
| CI/CD implemented | no workflow | future |
| PostgreSQL is the current database | configured; SQLite default | say configurable/Compose, not current production |
| Real-time chat | messaging uses polling | call persistent HTTP-polling messaging |
| SSE covers all live total changes | only transition into confirmed publishes | partial |
| Admin moderation is one consistent workflow | normal and admin-prefixed paths differ | disclose side-effect gap |
| User schema is migration-reproducible | current website/timezone migration untracked | disclose |
| All Arabic copy complete | localization report notes gaps | partial/native review needed |

## 8. Citation and writing controls for ChatGPT

The future writer should follow these rules:

1. Treat every repository path/symbol as implementation evidence, not an external academic citation.
2. Cite the methodology book for method/report structure, not software feature claims.
3. Cite the 2014 sample only as an organization example, never as Sahmi evaluation evidence.
4. Use official technical documentation only for narrow technology facts.
5. Use peer-reviewed or authoritative primary sources for research/context claims.
6. Verify every URL/bibliographic field before assigning final reference numbers.
7. Ensure every in-text citation appears in the final list and every listed source is used.
8. Choose APA or IEEE only after university confirmation; do not mix styles.
9. Avoid long copied text from any source; paraphrase and cite.
10. Keep `[SOURCE REQUIRED]`, `[SOURCE VERIFICATION REQUIRED]`, and `[TEAM CONFIRMATION REQUIRED]` until resolved.
11. Do not create plausible-looking authors, DOI values, statistics, survey data, or dates.
12. Do not convert a requirement or proposed diagram into an implementation statement.

## 9. Final evidence-to-chapter placement map

| Evidence | Best placement | Qualification |
|---|---|---|
| project purpose/problem/RQs/objectives | Chapter 1 | contextual claims still need literature |
| literature themes/source gaps | Chapter 2 | source acquisition required |
| four-phase R&D | Chapter 3 | verified repository analysis; human collection absent |
| requirements/use cases/RBAC | Chapter 3 / appendix | current source-derived |
| architecture/ERD/states | Chapter 3 | label implemented vs proposed |
| stack/routes/APIs/workflows | Chapter 4 | source verified |
| mock/partial status table | Chapter 4 or appendix | essential product-truth disclosure |
| current 24 frontend tests/TypeScript | Chapter 5 | exact date/environment |
| static backend/historical logs | Chapter 5 | do not call current pass |
| security/quality findings | Chapter 5 discussion/limitations | source audit, not penetration certification |
| absent human evaluation | Chapter 5 limitations | no scores/conclusions |
| future production/payment/KYC/AI/testing | Chapter 6 | not implemented |
| evidence-safe readiness verdict | Chapter 7 | academic prototype only |
| detailed API/data/test/source registers | Appendices | preserve traceability |

