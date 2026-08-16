# Sahmi Project and Academic Context

**Handoff snapshot:** 25 July 2026  
**Repository authority:** current working tree on branch `feature/backend-messaging-security-hardening`, HEAD `7a6cb1e57eb76c6fecfde015a1097c41ac69f6d3`  
**Academic authority:** Naji Shukri Alzaza, *Research Methodology in Information Technology: Student's Handbook*, second edition, 2020  
**Organization example:** *Mobile-Based Library Loan Service (MBLLS)* proposal sample, University of Palestine, 2014  
**Current Sahmi manuscript:** `Sahmi_Documentation_Corrected.docx`

This file supplies the academic and project context needed by a writer who cannot inspect the repository. It is not a final manuscript. Technical implementation claims must be checked against `01-complete-system-knowledge.md` and `02-requirements-architecture-and-data.md`.

## 1. Evidence labels and source hierarchy

Use these labels without weakening or removing them:

| Label | Meaning |
|---|---|
| **Verified and implemented** | Current source contains the frontend/backend/data behavior and the relevant access rules. This does not prove production operation. |
| **Partially implemented** | Some layers or rules exist, but a material workflow, control, integration, or UI is absent or defective. |
| **Frontend-only or fixture-backed** | The interface exists but no authoritative backend workflow persists or performs the represented action. |
| **Backend-only** | Model/API behavior exists but the main frontend does not expose a complete workflow. |
| **Configured but not operationally verified** | Configuration exists, but the service or environment was not exercised and no operational result is available. |
| **Planned/future work** | Intended capability is not implemented. |
| **Claimed in documentation but not found in code** | A project document or interface makes a claim that the working tree does not support. |
| `[NOT VERIFIED]` | The supplied material does not establish the fact or result. |
| `[SOURCE REQUIRED]` | A factual academic, market, legal, social, or technical claim needs a real source. |
| `[TEAM CONFIRMATION REQUIRED]` | Only the team, supervisor, or university can settle the information. |

When sources conflict, apply this order:

1. The current working tree governs what Sahmi implements.
2. The methodology book governs report conventions and research alignment, subject to current official university rules.
3. The 2014 proposal is an organization and writing example only.
4. The existing Sahmi manuscript and older SRS are reusable drafts, not implementation authorities.
5. Historical logs prove only what was run at their recorded date and source state.

## 2. Project identity, purpose, and bounded problem

### 2.1 Name and working description

The repository and current manuscript call the project **Sahmi**. The name is described in the existing SRS as meaning “my share” in Arabic. A precise, evidence-safe working description is:

> Sahmi is a bilingual, role-oriented web platform for discovering project campaigns, submitting and moderating project records, recording intended investments, presenting role-specific dashboards, and supporting persistent in-app communication.

The descriptive draft title used in the existing audit is:

> *Sahmi: A Bilingual Role-Oriented Project Funding-Record and Communication Platform*

That is not established as the official registered title and remains `[TEAM CONFIRMATION REQUIRED]`.

### 2.2 Intended purpose

The supplied project material positions Sahmi as a way to connect Palestinian entrepreneurs and their projects with investors or supporters seeking transparent project information. The repository implements a structured platform around:

- public discovery of active, verified project records;
- investor and entrepreneur accounts;
- entrepreneur project submission and staff moderation;
- internal investment, milestone, and repayment records;
- role-oriented dashboards;
- direct messaging and in-app notifications; and
- administrative record management.

The implementation does **not** prove that Sahmi transfers money, validates legal ownership, performs regulated investment, guarantees a return, verifies identity to a legal standard, or produces social/economic impact. “Investor,” “investment,” “payment,” “return,” and “repayment” are current domain labels; their legal and commercial meaning is `[TEAM CONFIRMATION REQUIRED]`.

### 2.3 Evidence-safe problem statement

The existing manuscript describes fragmented discoverability, trust, transparency, and communication around Palestinian project funding. Those contextual claims require literature and local evidence. An academically safe problem statement is:

> The project investigates how a bilingual, role-oriented web platform can organize project discovery, project submission and moderation, internal contribution records, dashboards, and communication within a traceable software architecture. The present study also identifies which capabilities are actually implemented and which technical, security, evaluation, and operational limitations prevent the platform from being represented as a production financial platform.

Do not state as fact, without verified sources:

- the size or growth of Palestinian crowdfunding or entrepreneurship markets;
- prevalence of fraud, failed fundraising, or public distrust;
- Palestinian access to Stripe, PayPal, international banking, or other providers;
- use or effectiveness of Jawwal Pay, social-media fundraising, or direct transfers;
- platform fee comparisons, provider availability, or country restrictions;
- that Sahmi solves financial inclusion or has generated economic/social outcomes; or
- that stakeholders requested or accepted the implemented design.

Use `[SOURCE REQUIRED]` until each claim has an authoritative, current source.

## 3. Academic reference documents

### 3.1 Methodology book

Available reference:

> Naji Shukri Alzaza, *Research Methodology in Information Technology: Student's Handbook*, 2nd ed., Gaza, Palestine, 2020. The title pages identify the author as Associate Professor of Mobile Technology, Software Engineering Department, Faculty of Applied Engineering and Urban Planning, University of Palestine. No separate commercial publisher is stated.

Relevant guidance extracted from the complete book:

- Information-technology research connects theoretical investigation, software development, and evaluation. The book explicitly warns that development without evaluation has no usability evidence.
- Research and Development (R&D) is an appropriate research type for a software platform.
- A proposal should align title, background, motivation, problem, research questions, objectives, significance, scope, literature review, methodology, conclusion, and abstract.
- Research questions must be answerable by the method and aligned with objectives.
- A software-development method may be described inside the development part of the research method; it does not replace the academic method.
- Evaluation design should identify the scenario, participants, instrument, and analysis when a user study is actually conducted.
- The recommended bachelor-thesis main body is 50–70 pages; more than 70 should be avoided when length reflects repetition or overreach (Appendix D, §3.1, printed p. 87).
- The recommended main body contains Introduction, Literature Review, Methodology, Results, and Discussion of Results/Future Work/Conclusion. Sahmi's seven-chapter structure below is a defensible expansion of those elements.
- The front-matter order in Appendix D §3.7 (printed p. 92) is title page, certification, permission to use, English abstract, Arabic abstract, acknowledgements, contents, lists, optional glossary/abbreviations, body, references, and appendices.
- The same book is internally inconsistent: §3.7 lists the Arabic abstract as optional, while §3.7.4 says abstracts “in both” languages must be included. The current university/supervisor rule controls `[TEAM CONFIRMATION REQUIRED]`.
- An abstract should identify purpose, method, results/findings, and significance, and must not exceed 350 words (§3.7.4, printed pp. 93–94).
- Acknowledgements should not exceed 250 words (§3.7.6, printed p. 95).
- The title page should contain the report title, faculty, bachelor degree, author names, month/year, and copyright notation. The methodology guide says the supervisor name should not appear on the title page (§3.7.1, printed p. 93); the university's current template may supersede this.
- A signed certification form and permission-to-use statement are expected by the guide.
- A4, 80 g/m², one-sided printing is specified; body text is double-spaced, while notes, long quotations, bibliography, figure legends, and appendices are single-spaced.
- Minimum left margin is 4 cm, other margins at least 2.5 cm, and the first page of a chapter has a 5 cm top margin.
- Prefatory pages use Roman numerals; the body and remaining pages use consecutive Arabic numerals in the upper-right corner.
- Tables and figures are numbered and referenced consistently. Captions and lists must match the final content.
- Every cited, mentioned, or used reference must appear in the reference list. The guide permits APA or IEEE; the required style is `[TEAM CONFIRMATION REQUIRED]`.
- Appendices use consecutive capital letters and remain in the overall page sequence.
- Research ethics, intellectual property, permission to reproduce, and accurate scholarly language are responsibilities of the team and supervisor.
- The guide discusses three/four printed copies and a 15-minute defense presentation. These are historical guide statements, not proof of the university's 2026 rules; verify them.

### 3.2 Doctors' 2014 proposal sample

Available reference:

> *Mobile-Based Library Loan Service (MBLLS)*, proposal sample, University of Palestine, 2014. The supplied document uses placeholder author/supervisor wording; full authorship and bibliographic details are `[SOURCE VERIFICATION REQUIRED]`.

The complete 40-page sample demonstrates:

- Chapter 1: background, motivation, problem statement, research questions, objectives, significance, and scope;
- Chapter 2: a themed literature review and related work;
- Chapter 3: an adapted System Development Research Methodology with:
  1. Information Gathering;
  2. Platform Design;
  3. Platform Development; and
  4. Evaluation;
- references and an appendix containing a proposed questionnaire.

The sample may guide Sahmi's chapter flow and four-phase naming. It is **not** evidence about Sahmi. Do not import its mobile-library problem, WAP technology, respondents, questionnaire, Likert results, usability dimensions, or citations into the Sahmi report without an independently approved and executed Sahmi study.

### 3.3 Current Sahmi manuscript

`Sahmi_Documentation_Corrected.docx` is a 55-page draft with:

- a title page and contributor/supervisor list;
- an English abstract;
- Chapter 1 Introduction;
- Chapter 2 Literature Review;
- Chapter 3 Project Methodology, currently framed as Agile and twelve sprints;
- Chapter 4 System Analysis and Design;
- Chapter 5 Implementation and Interface Design;
- Chapter 6 Testing and Quality Assurance;
- 26 predominantly technical web references;
- Appendix A API map; and
- Appendix B traceability matrix.

Useful project-specific text can be reused after verification. The manuscript is stale in several areas: it says persistent messaging, notification APIs, and audit logging are absent, while the current repository contains all three; it also treats Agile as the academic method and refers to unevidenced sprints, feedback, and deployment.

## 4. Official academic information presently found

The following appears on the current Sahmi manuscript's title page. It is transcribed, not independently confirmed:

| Item | Extracted value | Status |
|---|---|---|
| Institution | University of Palestine | `[TEAM CONFIRMATION REQUIRED]` |
| Faculty/program lines | “Software Engineering and Artificial Intelligence” and “Software Engineering” | The relationship between faculty, department, programme, and degree is unclear; `[TEAM CONFIRMATION REQUIRED]` |
| Project name | Sahmi | Present in repository and manuscript; official registered wording still `[TEAM CONFIRMATION REQUIRED]` |
| Document type | Graduation Project | `[TEAM CONFIRMATION REQUIRED]` |
| Contributor | Adnan Qasem — 120211953 | `[TEAM CONFIRMATION REQUIRED]` |
| Contributor | Ahmed Qudaih — 120210025 | `[TEAM CONFIRMATION REQUIRED]` |
| Contributor | Moomen Jibril — 120210102 | `[TEAM CONFIRMATION REQUIRED]` |
| Contributor | Abdullah Alotti — 120211678 | `[TEAM CONFIRMATION REQUIRED]` |
| Contributor | Mohammed Almadhoun — 120210381 | `[TEAM CONFIRMATION REQUIRED]` |
| Contributor | Ikrayyem Alabadla — 320200012 | `[TEAM CONFIRMATION REQUIRED]`; verify spelling and student number |
| Supervisors | Dr. Eyad Almassri and Dr. Alaa AbuZaiter | `[TEAM CONFIRMATION REQUIRED]`; verify titles and official spellings |
| Year | 2026 | `[TEAM CONFIRMATION REQUIRED]`; month/date absent |

No official faculty template, signed certification page, declaration, permission-to-use wording, examiner names, defence date, submission month, course code, or approved title was found.

## 5. Required report structure

Use this structure unless the supervisor supplies a different mandatory template:

### Front matter

1. University-approved title page
2. Certification/approval page
3. Declaration/originality and permission-to-use pages if required
4. Dedication, optional
5. Acknowledgements
6. English abstract, no more than 350 words
7. Arabic abstract, subject to supervisor confirmation; safest current posture is to include it
8. Table of contents
9. List of tables
10. List of figures
11. List of abbreviations and optional glossary

### Main body

1. **Chapter 1: Introduction**
   - background;
   - motivation;
   - problem statement;
   - research questions;
   - research objectives;
   - significance;
   - scope and limitations;
   - report organization.
2. **Chapter 2: Literature Review**
   - crowdfunding/impact-funding concepts;
   - trust, verification, transparency, and information asymmetry;
   - Palestinian/local context;
   - privacy and security for financial/platform systems;
   - bilingual and RTL usability;
   - role-oriented web/API architecture;
   - related platforms and research gap.
3. **Chapter 3: Research Methodology and System Design**
   - R&D approach;
   - Information Gathering;
   - Platform Design;
   - Platform Development, including any documented Agile iteration;
   - Evaluation;
   - actors, requirements, architecture, data, security design, and ethics.
4. **Chapter 4: System Implementation**
   - verified stack;
   - public and role interfaces;
   - authentication/localization;
   - project, investment-record, messaging, notification, audit, and admin modules;
   - implemented architecture and configured deployment;
   - explicit implemented/partial/fixture boundary.
5. **Chapter 5: Testing, Evaluation, Findings, and Discussion**
   - current executed technical checks;
   - historical results clearly dated;
   - unexecuted tests;
   - repository findings;
   - discussion by research question/objective;
   - validity and evaluation limitations;
   - no invented human results.
6. **Chapter 6: Future Work**
   - security/integrity;
   - product-truth and UI;
   - payment/legal decisions;
   - KYC/files/privacy;
   - testing, operations, accessibility, and human evaluation.
7. **Chapter 7: Conclusion**
   - evidence-bounded summary;
   - direct answers to RQs;
   - objective achievement;
   - platform—not production—verdict.

### End matter

8. References
9. Appendices, including detailed SRS/traceability, API/ERD diagrams, test evidence, screenshot register, approved evaluation instrument/data if any, and team declarations.

## 6. Research questions and objectives

The following framework is evidence-aligned and avoids unsupported user-outcome claims:

| ID | Research question | Aligned objectives | Evidence that can answer it |
|---|---|---|---|
| RQ-01 | What repository-verifiable requirements and architecture support a bilingual, role-oriented project funding-record platform? | OBJ-01, OBJ-02 | SRS, routes, models, serializers, permissions, frontend services, architecture and ERD |
| RQ-02 | To what extent does the Sahmi platform implement project discovery, submission, moderation, investment records, dashboards, messaging, notifications, and administration? | OBJ-02, OBJ-03 | Current source, feature/evidence map, frontend test result, static backend test assets |
| RQ-03 | What technical, security, testing, usability, and operational limitations remain before real-world use? | OBJ-04 | Repository audit, security findings, test boundaries, configuration review, missing-evidence register |

Recommended objectives:

| ID | Objective | Evidence status |
|---|---|---|
| OBJ-01 | Identify and organize the functional, non-functional, data, security, and stakeholder requirements for the platform. | Repository/document analysis verified; stakeholder elicitation history `[NOT VERIFIED]` |
| OBJ-02 | Design a bilingual, role-oriented architecture, interface structure, API, and data model for the platform. | Design can be derived from current source and diagrams |
| OBJ-03 | Develop and trace the implemented public, account, project, internal investment-record, communication, notification, and administrative workflows. | Substantially implemented with statuses documented in the handoff |
| OBJ-04 | Evaluate the platform's source-level correctness and readiness using available automated checks, traceability, and security/quality analysis, while recording absent human and operational evidence. | Repository audit and current frontend checks exist; human/production evaluation absent |

Do not introduce an RQ about satisfaction, usability score, adoption, market acceptance, economic impact, or financial performance unless the team provides an approved method, raw evidence, and analysis.

## 7. Scope

### 7.1 In scope for the study

- responsive React single-page interface;
- English and Arabic resources with LTR/RTL switching;
- visitor, investor, entrepreneur, and staff interaction boundaries;
- public project discovery;
- account registration, login, profile/language/password actions, and password-reset code;
- entrepreneur project submission/edit/soft deletion;
- staff project review and administration;
- internal investment, milestone, and repayment records;
- confirmed-record aggregate calculation and a Redis-backed SSE mechanism;
- persistent direct messaging and in-app notifications;
- partial audit logging;
- API, data, Docker, settings, and test artifacts;
- source-level evaluation and limitations.

### 7.2 Out of scope or not established

- real payment authorization, capture, settlement, receipts, refunds, escrow, disbursement, banking, custody, or money movement;
- legal equity, debt, donation, reward, ownership, return, and tax rules;
- complete KYC/AML, identity assurance, consent, privacy, retention, deletion, or regulatory compliance;
- AI classifier/recommender execution or evaluation;
- production hosting, live domain, production database, monitoring, backups, disaster recovery, or service-level results;
- operational email notifications; password-reset delivery depends on unverified SMTP;
- completed accessibility, penetration, load, concurrency, cross-browser, or E2E evaluation;
- completed interviews, surveys, usability sessions, user acceptance, or measured impact.

### 7.3 Geographic and language boundary

The project is framed around Palestine and provides English/Arabic UI support. The repository does not itself prove local market conditions, legal applicability, complete Arabic quality, or acceptance by Palestinian users. Those require sources and/or evaluation.

## 8. Four-phase R&D methodology

Agile may be mentioned only as an internal development practice if the team can document it. The academic method remains:

### Phase 1 — Information Gathering

Verified inputs:

- current repository and Git evidence;
- existing Sahmi manuscript, SRS, README files, architecture/API/test documents;
- methodology book;
- 2014 proposal sample;
- source-derived requirements and limitations.

Not evidenced:

- interviews, observation, focus groups, workshops, questionnaires, market research, Trello records, or formal requirements approvals;
- participant identities, recruitment, consent, dates, protocols, or raw notes.

If the team confirms such work, report the real method, dates, roles, ethical handling, and retained evidence. Otherwise describe this phase as document, repository, and literature analysis.

### Phase 2 — Platform Design

Verified design evidence:

- React route and page structure;
- design tokens and bilingual direction behavior;
- REST URL structure;
- Django models, serializers, permissions, and state fields;
- source-derived ERD, RBAC, workflow, and sequence diagrams;
- conceptual figures in the current manuscript.

The repository contains multiple conflicting generated design-system files. Actual `src/index.css`, Tailwind configuration, components, and pages are the implementation authority.

### Phase 3 — Platform Development

Verified:

- React/TypeScript/Vite frontend;
- Django/DRF backend;
- iterative changes documented by Git history and dated implementation reports;
- current implemented, partial, fixture-backed, backend-only, and configured capabilities.

Not verified:

- the exact “Sprint 1” through “Sprint 12” history asserted by the current manuscript;
- use of Trello, Google Docs/Sheets, a formal Scrum team, sprint reviews, deployment feedback, or completed stakeholder feedback.

Use neutral “iterative development” wording unless the team supplies dated sprint artifacts. If Agile is confirmed, place it inside this phase.

### Phase 4 — Evaluation

Available evidence:

- a prior audit run on 25 July 2026 reported 11 frontend test files and 24 passing Vitest tests;
- the same audit reported a passing TypeScript no-emit check;
- 64 backend `test_` methods exist in current source;
- backend tests were not run in that audit because its rules prohibited migration-applying test setup;
- dated historical reports record earlier backend/frontend/build/smoke/localization executions against earlier working-tree states;
- source-level requirements, architecture, security, and traceability analysis.

Unavailable:

- a current backend pass;
- current E2E, production, payment, load, accessibility, penetration, or deployment results;
- coverage percentage;
- participants, approved instrument, survey/usability scores, task completion data, or user acceptance.

The current report may evaluate the platform technically and discuss repository findings. It may not claim human usability or operational effectiveness.

## 9. Evaluation and conclusion boundaries

Permitted findings include:

- the source implements a substantial bilingual, role-oriented platform;
- implementation is mixed: some workflows are persistent, some are partial/backend-only, and some interfaces are fixture-backed;
- the current frontend test suite passed in the audited environment on the recorded date;
- source-level privacy, financial-integrity, upload, audit, configuration, and schema-reproducibility gaps exist;
- the platform is not ready for real financial/personal-document use;
- user evaluation and production operation remain unverified.

Not permitted:

- “users found the system easy to use”;
- “the platform is secure,” “bank-grade,” or compliant;
- “all tests passed” without narrowing the statement to the exact suite/date;
- any percentage, participant count, satisfaction score, response time, throughput, uptime, adoption, or impact result not supplied as evidence;
- “payments are processed,” “investments are settled,” or “refunds are automatic”;
- “deployed on DigitalOcean/Nginx” or “CI/CD is implemented”;
- “KYC verified,” except as the literal state of an internal flag with no legal-assurance claim.

## 10. Academic contradictions that must remain visible

| Conflict | Required treatment |
|---|---|
| Methodology guide calls Arabic abstract optional in §3.7 but mandatory in §3.7.4 | Ask supervisor/current university; include a reviewed Arabic abstract unless told otherwise |
| Current Sahmi Chapter 3 uses Agile as the research methodology | Replace with four-phase R&D; nest verified Agile practices only under development |
| Current manuscript claims twelve sprints, feedback collection, and deployment | Keep `[NOT VERIFIED]` until artifacts are supplied |
| Current manuscript says messaging, notification APIs, and audit logging are absent | Update: messaging and in-app notifications are implemented; audit is partial |
| Current UI says failed-goal projects may keep funds, while other copy promises full return | No refund/disbursement engine exists; treat both as contradictory future business rules |
| Marketing claims secure provider/bank-level payment | No provider exists; classify as unsupported UI copy |
| Existing SRS uses “investment” and “payment” as if monetary operation is established | Define them as internal records unless legal/business/provider evidence is supplied |
| Multiple design-system masters specify incompatible colors/fonts/categories | Use the actual CSS/components as implementation evidence; generated design notes are historical alternatives |

## 11. Front-matter placeholders still unresolved

Do not invent the following:

- official university/faculty/department/program/degree wording;
- official project title and registration number;
- final author order, spellings, student numbers, and contributions;
- supervisor/examiner titles and spellings;
- submission month/date, defence date, and academic year;
- certification/declaration/permission wording;
- acknowledgements, dedication, funding/conflict declarations;
- Arabic abstract approval;
- citation style and university formatting template;
- ethics/consent statement;
- copyright holder and reuse address.

The direct questions needed to resolve these items are in `05-team-input-required.md`.

