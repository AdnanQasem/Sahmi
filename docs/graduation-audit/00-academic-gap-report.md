# Sahmi Academic Structure and Evidence Gap Report

**Audit date:** 25 July 2026  
**Academic authority:** Naji Shukri Alzaza, *Research Methodology in Information Technology*, second edition (2020)  
**Organization example:** *Mobile-Based Library Loan Service (MBLLS)* proposal sample, University of Palestine (2014)  
**Current project document:** `Sahmi_Documentation_Corrected.docx`  
**Repository snapshot:** branch `feature/backend-messaging-security-hardening`, commit `7a6cb1e57eb76c6fecfde015a1097c41ac69f6d3`, with a materially dirty working tree  
**Evidence convention:** `[NOT VERIFIED]`, `[SOURCE REQUIRED]`, and `[TEAM CONFIRMATION REQUIRED]` identify information that cannot be established from the supplied references and repository.

## 1. Reference-document access and review

All three required references were accessible and read in full before this audit was drafted.

| Reference | Location reviewed | Completeness | Use in this audit |
|---|---|---:|---|
| Current Sahmi graduation document | `Sahmi_Documentation_Corrected.docx` in the repository root | Complete | Preserved useful Sahmi-specific wording, then checked technical claims against the working tree |
| Alzaza methodology book | `research-methodology-in-it-2020_241121_202116.pdf` in the local Downloads folder | Complete: 98 pages | Primary authority for front matter, proposal/report structure, research questions, objectives, R&D, evaluation, references, and appendices |
| Doctors' 2014 proposal sample | `proposal-sample.doc` in the local Downloads folder | Complete: 40 pages | Writing and chapter-organization example, particularly Chapters 1–3 and its four R&D phases |

The methodology book is authoritative where the documents differ. The 2014 sample illustrates organization; it is not evidence about Sahmi and does not establish the validity of its cited evaluation instrument for this project.

## 2. Governing academic model

The methodology book treats an information-technology graduation project as more than a software build. It connects:

1. a defined research problem;
2. answerable research questions;
3. corresponding objectives;
4. a defensible research and development method;
5. implementation evidence;
6. evaluation;
7. findings and discussion; and
8. conclusions that answer the questions without exceeding the evidence.

The 2014 sample operationalizes this pattern through:

1. Information Gathering;
2. Platform Design;
3. Platform Development; and
4. Evaluation.

That four-phase Research and Development model is appropriate for Sahmi. Agile sprints may explain iteration inside **Platform Development**, but Agile is a software delivery approach and must not replace the academic research methodology.

## 3. Structural comparison

| Academic element | Methodology book expectation | 2014 sample | Current Sahmi document | Gap and required treatment |
|---|---|---|---|---|
| Title page | Institution, program, title, authors, supervisor, date | Present | Present | Names, student numbers, supervisors, official title, degree/program wording, and year require `[TEAM CONFIRMATION REQUIRED]`. |
| Certification/approval | Front-matter approval/certification | Present in sample style | Missing | Add official university form or marker `[TEAM CONFIRMATION REQUIRED]`. |
| Permission to use | Listed in recommended front matter | Not clearly established in extracted sample | Missing | Add only if required by the faculty; wording requires supervisor confirmation. |
| Dedication | Optional institutional convention | Present/typical sample style | Missing | Optional; team choice. |
| Acknowledgements | Recommended front matter | Present | Missing | Add team-authored text; do not invent contributors. |
| English abstract | Purpose, method, results, significance; concise | Present | Present | Rewrite because its implementation and test claims are stale. Do not report usability findings that do not exist. |
| Arabic abstract | Book expects bilingual abstracts, while one checklist describes Arabic as optional | Present/expected locally | Missing | Resolve the book's internal inconsistency with the supervisor; safest submission treatment is to include Arabic. `[TEAM CONFIRMATION REQUIRED]` |
| Table of contents | Required and synchronized | Present | Present | Regenerate after restructuring. |
| Lists of tables/figures | Required where used | Present | Present | Existing figures are conceptual, not screenshots; captions must say so. Regenerate numbering. |
| Abbreviations/glossary | Optional but useful | Used | Abbreviations present | Update for R&D, RBAC, JWT, SSE, API, KYC, CI/CD, and SRS. |
| Chapter 1 | Background, motivation, problem, questions, objectives, significance, scope | Strong example | Background/problem/objectives/scope exist; research questions and significance are absent or implicit | Add explicit RQs, motivation/significance, beneficiaries, boundaries, and question–objective mapping. |
| Chapter 2 | Critical literature review grounded in scholarly sources | Organized by related work | Mostly technology descriptions and platform summaries | Replace product-documentation-heavy treatment with a sourced thematic review. Retain stack details for implementation, not as the core literature review. |
| Chapter 3 | Research method, participants/data, development method, evaluation method, ethics | Four R&D phases | Agile is the selected methodology | Replace with four-phase R&D; nest Agile sprints only within Platform Development. Disclose that interviews/surveys/usability evaluation are not evidenced. |
| Design | Methodology should connect requirements to design | Platform Design phase | Mostly Chapter 4 | Move/bridge architecture, use cases, data model, and platform rationale into Chapter 3; detailed technical design may remain in an appendix. |
| Implementation/results | Report what was actually built | Proposal only anticipates it | Chapter 5 exists | Update to the present working tree and classify backend-only, fixture-backed, configured, and future behavior. |
| Testing/evaluation | Executed technical and/or user evaluation, method and findings | Evaluation planned with usability dimensions/questionnaire | Chapter 6 is stale and largely planned | Current frontend results may be reported exactly; dated backend results must be labelled historical. No user study, survey, sample, or usability result may be claimed. |
| Findings/discussion | Interpret results against questions/objectives/literature | Not a completed final report | Missing as a distinct evidence-based chapter | Add repository findings and limitations. Human usability findings remain `[NOT VERIFIED]`. |
| Future work | Derived from limitations | Briefly anticipated | Distributed through gaps | Consolidate into a dedicated chapter and do not describe it as implemented. |
| Conclusion | Answers RQs/objectives | Proposal conclusion only | Chapter conclusions, no final evidence-aligned conclusion | Add final conclusion with no production, payment, security, or impact guarantees. |
| References | Every citation represented; consistent APA or IEEE | Conventional numbered references | Mostly vendor documentation; research claims are weakly sourced | Add scholarly/domain sources and verify every bibliographic field. Keep vendor docs only for technical facts. |
| Appendices | Instruments, detailed artifacts, supporting evidence | Questionnaire appendix | API/traceability appendices exist | Add SRS/traceability, test log, selected screenshots, ethics/evaluation instrument, and team evidence as applicable. |

## 4. Chapter-by-chapter gap analysis

### 4.1 Front matter

The current document begins with a title page and English abstract, then contents and lists. Missing or unresolved items are:

- certification/approval page;
- permission-to-use statement if required;
- acknowledgement and optional dedication;
- Arabic abstract;
- declaration/originality wording if required by the university;
- final pagination and synchronized contents;
- confirmation that the listed program, contributors, student identifiers, supervisors, and year are official;
- an abstract based on current evidence.

The current abstract says persistent messaging, notification APIs, and audit logging are absent. Those statements are now contradicted by `backend/apps/messaging/`, `backend/apps/notifications/`, `backend/apps/audit/`, their routes, and corresponding frontend services. Conversely, the abstract correctly warns that payment processing, AI execution, operational deployment, and several recorded workflows are absent.

### 4.2 Chapter 1: Introduction

Useful material to preserve:

- the intended Palestinian entrepreneurship context;
- the trust, discoverability, and structured-record problem;
- the platform focus;
- the distinction between internal investment records and real money movement.

Required corrections:

- add explicit research questions;
- align every question with one or more objectives;
- add a separate significance section;
- distinguish stakeholders from actual research participants;
- remove or source claims about regional payment access, fraud prevalence, platform fees, and market demand;
- do not state that stakeholder interviews, requirements workshops, or market surveys occurred without records;
- define the platform boundary: Sahmi is not verified as a regulated financial intermediary, custodian, payment processor, or deployed service.

Recommended aligned framework:

| ID | Research question | Objective | Permitted evidence |
|---|---|---|---|
| RQ-01 | What repository-verifiable requirements and architecture support a bilingual, role-oriented project funding-record platform? | OBJ-01 gather and structure requirements; OBJ-02 design the platform | SRS, routes, models, APIs, UI, architecture diagrams |
| RQ-02 | To what extent does the Sahmi platform implement project discovery, submission, moderation, investment records, dashboards, messaging, and notifications? | OBJ-03 develop and trace the platform | Source evidence and current frontend test execution |
| RQ-03 | What technical, security, testing, usability, and operational limitations remain before real-world use? | OBJ-04 evaluate the platform | Repository audit, static tests, current frontend test result, historical backend logs labelled as such |

Any question about user satisfaction, adoption, economic impact, usability score, or market acceptance cannot presently be answered and must either be reframed as future evaluation or supported by approved study evidence.

### 4.3 Chapter 2: Literature Review

The current chapter devotes substantial space to Django, HTML, CSS, React, Trello, Google Docs, GitHub, Docker, Nginx, and DigitalOcean. Vendor documentation can establish what those technologies are, but it is not a sufficient academic literature review.

Missing scholarly themes include:

- crowdfunding and impact-investment models;
- trust, information asymmetry, and platform verification;
- financial inclusion and the relevant Palestinian context;
- privacy and security in financial or crowdfunding systems;
- usability of bilingual and right-to-left systems;
- role-based access and secure API design;
- platform evaluation in information-systems research.

Claims needing real sources include:

- Palestinian access to Stripe, PayPal, or international bank accounts;
- GoFundMe/Kickstarter country availability and fee implications;
- use of Jawwal Pay or informal social-media fundraising;
- asserted fraud/trust prevalence;
- effects of progress bars, transparency, or project storytelling on contributions;
- any market size, adoption, impact, or financial-inclusion claim.

Mark each as `[SOURCE REQUIRED]` until a primary, scholarly, regulator, or official provider source is verified. A product help page may support a provider's current policy, but it should not stand in for peer-reviewed discussion.

There are also contradictory product statements in the interface itself:

- How It Works says projects may keep funds after missing a goal (`src/i18n/locales/en/common.json`, around `how.faqs`), while Contact FAQ says contributions are returned in full (`contact.faqs`).
- The repository implements neither automated disbursement nor refunds.

Both claims must be removed from the academic description or labelled future business rules requiring legal and team approval.

### 4.4 Chapter 3: Research Methodology and System Design

The current Chapter 3 makes Agile the selected methodology and asserts sprint ranges, deployment, and feedback collection. No Trello export, sprint records, deployment record, participant protocol, completed feedback dataset, or ethics approval was found in the repository.

Required replacement:

1. **Information Gathering**
   - repository and document analysis are verified;
   - interviews, questionnaires, observation, and stakeholder workshops are `[NOT VERIFIED]`;
   - participant identities, sample, consent, and dates are `[TEAM CONFIRMATION REQUIRED]`.
2. **Platform Design**
   - verified design evidence includes route structure, components, API contracts, Django models, and conceptual figures;
   - existing figures must be labelled conceptual where they are not screenshots.
3. **Platform Development**
   - React/TypeScript and Django/DRF implementation is verified;
   - Agile sprints may describe team practice only after the team supplies dated records;
   - otherwise describe iterations without invented sprint numbers.
4. **Evaluation**
   - the current frontend Vitest and TypeScript checks are technical evaluation evidence;
   - backend source tests and dated logs are evidence of test assets and historical executions, not a fresh current pass;
   - no human usability evaluation is evidenced.

The 2014 sample's questionnaire/Likert organization may inspire an instrument, but no questions, participant results, means, percentages, charts, or conclusions may be copied or invented. A new instrument requires supervisor approval and an ethical data process.

### 4.5 Chapter 4: System Implementation

The existing Chapter 5 contains useful repository-grounded explanations, but many statements describe an older code state. At minimum, revise:

- public admin self-escalation is no longer present in `RegisterSerializer`, `UserSerializer`, or `MeView`;
- categories are staff-only for writes;
- public project detail now restricts draft/unverified access to owner/staff;
- investment status is server-controlled in the normal serializer;
- persistent messaging, notification APIs/preferences, password reset, audit records, and rich admin REST APIs now exist;
- bilingual English/Arabic resources and RTL/LTR switching now exist;
- Settings profile update, password change, and notification preferences have backend connections, while its 2FA, sessions, wallet, providers, billing, invoices, KYC display, and several verification badges remain recorded;
- the entrepreneur investor page and entrepreneur dashboard message preview remain hard-coded;
- the contact form only delays and reports success locally;
- payment-provider, receipt, refund, and money-transfer functionality remains absent;
- AI fields are storage fields, not an AI implementation;
- email notifications are disabled, while password-reset email is only operational if SMTP is correctly configured.

### 4.6 Chapter 5: Testing, Evaluation, Findings, and Discussion

The current document says there is one meaningful backend test, one trivial frontend test, a failing TypeScript check, and no persistent messaging/notification tests. This is stale.

Current evidence on 25 July 2026:

- `npm test -- --run`: **11 files and 24 tests passed**;
- `npx --no-install tsc --noEmit`: **passed**;
- backend test files contain 64 discovered `test_` methods across users, projects, investments, messaging, notifications, audit, and admin APIs;
- backend tests were **not executed in this audit**, because Django's test setup applies migrations and the audit rules prohibit running migrations;
- repository logs report earlier backend and frontend passes, but they precede additional working-tree changes and are historical evidence only;
- Playwright configuration imports `lovable-agent-playwright-config`, which is not declared in `package.json`, and no E2E test case was found.

Missing evaluation:

- no current backend execution;
- no coverage report;
- no payment, load, penetration, accessibility, cross-browser, or production test;
- no verified user acceptance or usability study;
- no real deployment monitoring;
- no evidence for performance targets or security guarantees.

Findings must therefore use bounded language such as “the source implements,” “the frontend test suite passed in the audited environment,” and “not operationally verified.”

### 4.7 Chapters 6 and 7: Future Work and Conclusion

Future work should follow from verified limitations:

- enforce project/payment-event privacy;
- restrict investment creation by business role and prevent investor modification after submission;
- validate positive investment amounts and model-level financial constraints;
- define trusted repayment/milestone workflows;
- implement real payment verification only after legal and provider decisions;
- remove misleading fixture-backed financial/security UI;
- add upload validation, malware scanning strategy, private object storage, and retention rules;
- complete audit coverage and structured logging;
- repair container/environment inconsistencies and add frontend/worker/reverse-proxy/CI configuration;
- conduct approved usability/accessibility evaluation;
- verify literature sources and local legal context.

The conclusion may state that Sahmi is a substantial bilingual development-stage platform. It may not state that it securely processes payments, guarantees returns, has proven social/economic impact, is production-ready, is legally compliant, or has been accepted by users.

## 5. Unsupported, stale, or contradictory claims

| Claim or claim family | Current evidence | Classification/action |
|---|---|---|
| Persistent messaging is absent | Messaging models, participant-scoped APIs, UI and tests exist | Stale; update to **Verified and implemented**, with limitations |
| Notification APIs are absent/static only | Notification model, APIs, preferences, polling UI and tests exist | Stale; update to **Verified and implemented**; email delivery disabled |
| Audit logging is absent | `AuditLog`, service, API, admin and tests exist | Stale; update to **Partially implemented** because event coverage is incomplete |
| Public registration/profile can grant admin/staff | Current serializers make role/staff server-controlled | Stale old defect; document the fix, not the defect |
| Public detail exposes private draft/document data | Current detail query and public serializer protect these fields | Stale old defect; retain regression requirement |
| Investor chooses status at creation | Normal serializer makes status read-only | Stale; remaining risks concern amount validation and post-create edits |
| Only one backend and one frontend test | Many current tests exist; 24 frontend tests passed in this audit | Stale |
| TypeScript currently fails | Fresh no-emit check passed | Stale |
| Interface is English/LTR only | English/Arabic i18n and direction switching exist | Stale; native-language completeness still unverified |
| Secure provider/bank-level encrypted payments | No provider call, webhook, receipt, custody, refund, or disbursement code | **Frontend claim not found in backend**; remove |
| 230+ projects, $2.4M, 12,000+ users, 89% | Hard-coded arrays in `HomePage.tsx:61-63` and `AboutPage.tsx:78-80` | **Frontend-only or fixture-backed**; no academic use |
| Review within 2–3 business days | Translation copy only; no SLA logic or evidence | `[TEAM CONFIRMATION REQUIRED]` |
| All founders/KYC/funds verified | Fields/badges exist, but no complete KYC workflow | Misleading; classify as **Partially implemented/storage only** |
| Goal failure keeps funds | UI copy only | Contradicts refund copy and no payment implementation |
| Goal failure refunds in full | UI copy only | Contradicts keep-funds copy and no refund implementation |
| Trello was used and sprints 1–12 occurred | No repository evidence | `[TEAM CONFIRMATION REQUIRED]` |
| Google Docs/Sheets were used | No repository evidence | `[TEAM CONFIRMATION REQUIRED]` |
| DigitalOcean/Nginx/CI/CD deployment | No repository configuration or live-deployment evidence | **Planned/future work** |
| User feedback/evaluation collected | No protocol, participants, raw data, instrument or approval | `[NOT VERIFIED]` |
| Legal ownership/compliance/regulatory suitability | No legal evidence | `[SOURCE REQUIRED]` and `[TEAM CONFIRMATION REQUIRED]` |

## 6. Citation and reference audit

The current numbered list is predominantly official technology documentation. This is useful for implementation definitions but insufficient for the research problem and literature review.

Required actions:

- add the methodology book to the reference list;
- verify complete bibliographic data for the 2014 sample if it is cited;
- select one style, preferably the university-required APA or IEEE style;
- ensure every in-text citation appears in the reference list and every listed reference is actually cited;
- add access dates only if the selected style requires them;
- use scholarly/primary sources for research claims and official provider/regulator sources for current availability or rules;
- do not cite the repository as proof of social, market, or user outcomes;
- mark every unresolved item `[SOURCE VERIFICATION REQUIRED]` in the draft;
- run a plagiarism/originality review under university policy `[TEAM CONFIRMATION REQUIRED]`.

## 7. Material requiring team or supervisor confirmation

1. Official project title, degree/program, authors, student IDs, supervisor names, and submission date.
2. Required front-matter forms and whether an Arabic abstract is mandatory.
3. Whether Trello, Google Docs/Sheets, interviews, observation, workshops, or specific sprint records were actually used.
4. The intended meaning of “investor”: contributor/supporter, equity investor, lender, or another legal relationship.
5. Intended funding model, fees, refund policy, disbursement rule, return calculation, and currency.
6. Whether Sahmi has or seeks legal/regulatory review and who owns project and user data.
7. Intended KYC process, decision authority, retention, deletion, and privacy notice.
8. Whether staff verification means document review, identity review, business validation, or only an internal status flag.
9. Any real hosting, domain, deployment, SMTP, Redis, PostgreSQL, monitoring, or backup evidence.
10. Evaluation participants, consent/ethics, instrument, sample, dates, raw data, analysis, and supervisor approval.
11. Screenshots that may be included and whether they use synthetic/non-personal data.
12. Final citation style and verified scholarly sources.

## 8. Academic readiness conclusion

The current Sahmi document contains useful technical analysis and unusually candid platform limitations, but it is not ready for final submission. Its academic method is misclassified as Agile, its research questions and significance are missing, its literature base is inadequate, its implementation/test description is stale, and no human evaluation is evidenced.

The correct submission posture is:

- **ready as an audited development-stage platform baseline;**
- **not ready as a final academic report until sources, front matter, team facts, and evaluation decisions are resolved;**
- **not ready for production or real financial operation.**

