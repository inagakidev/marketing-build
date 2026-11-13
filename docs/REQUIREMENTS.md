# Briefing Inteligente — Requirements Document

> **Version:** 2.0  
> **Date:** 2026-11-13  
> **Status:** V1 target requirements; pending decisions identified  
> **Reference product:** `PRODUCT.md`  
> **Companion documents:** `docs/ARCHITECTURE.md` and `docs/ROADMAP.md`

This document translates the vision in `PRODUCT.md` into functional requirements, business rules, non-functional requirements and acceptance criteria.

## How to read this document

The platform is evolving from a briefing and diagnosis MVP into a strategic marketing management platform. This document therefore distinguishes:

- **Known current state:** capabilities described in the previous MVP documentation. It doesn't mean they were revalidated in the code in this revision.
- **V1 target:** capabilities needed to fulfill the complete strategic journey.
- **Priority:** importance for the V1 delivery, not a statement that the requirement is already implemented.

Priorities:
- **Must:** required for the V1 main journey.
- **Should:** important for consistent operation; may be delivered in a later V1 increment.
- **Could:** desirable improvement, subject to validation and capacity.
- **Won't:** out of current scope.

Acceptance criteria must be verifiable. When a decision hasn't been made yet, the requirement states **Pending decision**, without inventing behavior.

---

## 1. Goal and scope

### 1.1 Goal

Allow marketing teams to manage the strategic journey of clients and projects in a single environment: briefing collection, diagnosis, human analysis, recommendations, prioritization, planning, execution, indicator tracking and results evaluation.

### 1.2 V1 functional scope

1. Organization, authentication, members, roles and permissions.
2. Client registry and contextual history.
3. Projects/campaigns, owners and collaborators.
4. Creation and lifecycle of briefings and public links.
5. Adaptive form, autosave and resume.
6. Deterministic, versioned and explainable diagnosis.
7. Human analysis, recommendations and prioritization.
8. Approval and assisted conversion of recommendations into objectives, actions and tasks.
9. Strategic plans, execution and review.
10. Indicators, measurements, evidence and results.
11. Documents and contextual internal communication.
12. Dashboards, reports and controlled external sharing.
13. Templates, duplication and configurable recurrence.
14. Security, privacy, auditing, backup and observability.

### 1.3 Out of V1 scope

- Full CRM and sales automation.
- Campaign, ad or social media publishing automation.
- Full self-service portal for clients.
- Generative AI as an autonomous authority for diagnosis, prioritization or decisions.
- Large-scale external integrations.
- Native mobile app.
- Per-client white-label, billing and marketplace.
- Microservices, GraphQL or event sourcing without architectural justification.
- Unrestricted business-rule builder.
- External benchmarking without reliable, comparable data.

### 1.4 Delivery guideline

V1 must cover the strategic journey end to end, but may deliver each module with controlled initial depth. Simplification must not break the connection between briefing, diagnosis, recommendations, plan, execution and results.

---

## 2. Actors, roles and authorization

### 2.1 Actors

| Actor | Authentication | Scope |
|---|---|---|
| Organization administrator | Authenticated account | Configures organization, members, roles, permissions and parameters |
| Leader | Authenticated account | Follows team and projects, distributes responsibilities and performs permitted approvals |
| Member | Authenticated account | Works on projects and activities they were given access to |
| Client/respondent | Link token | Answers the briefing without creating an account |
| Client report recipient | Shared link | Views only the authorized report |
| System | Internal context | Runs rules, calculations, notifications and authorized routines |

### 2.2 Authorization requirements

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| AUTH-01 | Authenticate members through a trusted authentication provider. | Must | Private routes require a valid session on the server. |
| AUTH-02 | Don't offer unrestricted public sign-up of members or organizations in V1. | Must | Provisioning happens by invitation or authorized admin action. |
| AUTH-03 | Each member belongs to an organization through an explicit membership. | Must | The organizational context is validated on every operation. |
| AUTH-04 | Support conceptual roles of administrator, leader and member. | Must | Each role has defined and tested permissions. |
| AUTH-05 | Allow the administrator to configure which roles can perform sensitive actions. | Must | Protected approvals and changes respect the configuration. |
| AUTH-06 | Apply authorization on the server and in the data layer, not only in the UI. | Must | Direct requests without permission return 403 or a not-found response, per policy. |
| AUTH-07 | Allow a main owner and collaborators per project. | Must | Assignments are persisted and shown on the project. |
| AUTH-08 | Restrict actions by project scope when applicable. | Must | A member without access neither reads nor changes the project. |
| AUTH-09 | Record author, date and context of relevant actions. | Must | Auditable events carry the actor's identity and the affected entity. |
| AUTH-10 | Support multiple roles per member, if allowed by configuration. Deferred: V1 uses one role per member (D9). | Should | Permission combination follows a documented and tested rule. |
| AUTH-11 | Allow inviting, revoking access and deactivating members. | Must | A deactivated member loses access without erasing authorship history. |
| AUTH-12 | Prevent removing a member from erasing authorship or history. | Must | Records keep a historical reference, even after deactivation. |

**Decided (D8–D11, `docs/DECISIONS.md`):** project access is by individual assignment (PD-13); each member has exactly one role per organization (PD-02); leaders see every project in the organization; only administrators invite, deactivate or change the role of members.

### 2.3 Permission matrix — Phase 1 (PD-01)

Organization role × action. "Participant" means the member is the project's main owner or a collaborator. Actions from later phases (diagnosis approval, priority changes, measurement validation, reports) are added to this matrix when their phase is refined, configurable by the administrator per AUTH-05.

| Action | Administrator | Leader | Member |
|---|:-:|:-:|:-:|
| Configure the organization | Yes | No | No |
| Invite, deactivate or reactivate members | Yes | No | No |
| Change a member's role | Yes | No | No |
| View clients | All | All | Only clients of projects they participate in |
| Create or edit a client | Yes | Yes | No |
| Delete a client | Yes (policy depends on PD-12) | No | No |
| Create a project | Yes | Yes | No |
| View a project | All | All | Only as participant |
| Edit a project; create, revoke or regenerate briefing links | Yes | Yes | Only as participant |
| Assign the main owner and collaborators | Yes | Yes | Only as main owner |
| Close or reopen a project (with justification) | Yes | Yes | Only as main owner |
| Read the audit log | Yes | No | No |

Rules:

- Owners and collaborators must be active members of the same organization (PROJ-02).
- A deactivated member loses every permission immediately; authorship stays in history (AUTH-11, AUTH-12).
- Denied access to a record outside the member's scope returns not-found, so its existence isn't revealed (AUTH-06).
- Every cell above has a negative test (`docs/guidelines/QUALITY.md`).
- The organization always keeps at least one active administrator: demoting or deactivating the last one is refused (EP-04.5).
- No one deactivates their own access; another administrator does it (EP-04.5).

---

## 3. Organization, clients and projects

### 3.1 Organization and isolation

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| ORG-01 | Every business entity belongs to an organization. | Must | Core records have a mandatory organizational link. |
| ORG-02 | V1 may start with one organization, but the model must support multiple independent organizations. | Must | Isolation doesn't depend on UI-only filters. |
| ORG-03 | Queries and mutations validate the active organization and the member's authorization. | Must | Tests prove one organization can't access another's data. |
| ORG-04 | Settings and templates belong to the organization, unless a catalog is explicitly global. | Must | Settings don't leak across organizations. |

### 3.2 Clients

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| CLI-01 | Create a client with essential data and optional fields. | Must | Required fields are validated; the client is associated with the organization. |
| CLI-02 | Edit client data according to permission. | Must | Changes persist and enter the history when relevant. |
| CLI-03 | Archive a client without destroying its strategic history. | Must | An archived client no longer appears in active lists, but its projects remain viewable by authorized users. |
| CLI-04 | List, search, filter and paginate clients. | Should | Search and filters are stable and respect organization/permissions. |
| CLI-05 | Associate multiple projects with the same client. | Must | Client detail lists its projects and their statuses. |
| CLI-06 | Show a consolidated view of the relationship. | Must | History shows authorized meetings, notes, decisions, documents, projects and results. |
| CLI-07 | Record a meeting, note, interaction or decision. | Must | The record has type, content, author and date; it can be associated with client and project. |
| CLI-08 | Don't require a fixed team on the client record. | Must | Owners and collaborators are defined on the project. |

### 3.3 Projects and campaigns

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| PROJ-01 | Create a project/campaign linked to a client. | Must | The project has organization, client, name and status. |
| PROJ-02 | Define a main owner and collaborators. | Must | Owner and collaborators are active members of the organization. |
| PROJ-03 | Record the project's description, context, period and status. | Must | Fields are queryable and appear in the detail view. |
| PROJ-04 | Associate briefings, diagnoses, recommendations, plans, documents and reports with the project. | Must | Related elements are reachable from the project, respecting permission. |
| PROJ-05 | Allow more than one briefing per project. | Must | Each briefing keeps its own lifecycle and version. |
| PROJ-06 | Distinguish the project's operational status from the status of its objectives. | Must | A project isn't considered complete just because tasks were closed. |
| PROJ-07 | Close a project through a review and approval flow. | Must | Closing requires reviewing objectives, results and a final report. |
| PROJ-08 | Reopen a closed project with permission and justification. | Should | Reopening records author, date and reason. |
| PROJ-09 | Allow complementary projects linked to the client. | Must | Projects coexist without overwriting other projects' history. |

---

## 4. Briefings and public experience

### 4.1 Creation and lifecycle

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| BRF-01 | Create a briefing associated with a client and project. | Must | A briefing can't exist without a valid organization, client and project. |
| BRF-02 | Generate a public link with an opaque, unique token. | Must | The token isn't derived from an ID, name, email or predictable data. |
| BRF-03 | Configure link validity. | Must | An expired link blocks form reads and writes. |
| BRF-04 | Revoke and regenerate the link. | Must | The old token stops working immediately after revocation/regeneration. |
| BRF-05 | Allow copying and sharing the link manually. | Must | The full link is shown only to authorized members. |
| BRF-06 | Distinguish invalid, expired, revoked and submitted links. | Must | Each state shows an appropriate response and message. |
| BRF-07 | Allow multiple briefings per client and per project. | Must | Each instance has independent answers, status, diagnosis and version. |
| BRF-08 | Prevent public editing after submission. | Must | Autosave and resubmission don't change data after closing. |
| BRF-09 | Keep a history of creation, submission, expiration, revocation and regeneration. | Must | Events are viewable by authorized users. |
| BRF-10 | Version the catalog applied to each briefing. | Must | Future catalog changes don't alter the questions of briefings already started. |

### 4.2 Adaptive form

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FORM-01 | Show welcome, steps, estimated time and a saving notice. | Must | The respondent understands purpose, progress and how it works. |
| FORM-02 | Organize questions into sections and steps. | Must | Navigation is clear on mobile and desktop. |
| FORM-03 | Show conditional questions through data-driven rules. | Must | Questions appear only when their conditions are true. |
| FORM-04 | Allow answer types defined by the catalog. | Must | Short text, long text, single choice and multiple choice work. |
| FORM-05 | Validate answers by type, options and defined limits. | Must | Incompatible answers are rejected on the server. |
| FORM-06 | Save answers automatically. | Must | Changes persist and network failures are communicated to the respondent. |
| FORM-07 | Resume filling in using the same valid link. | Must | Previously saved answers are restored. |
| FORM-08 | Require required questions only when visible. | Must | Questions from branches not shown don't block submission. |
| FORM-09 | Ignore answers to questions that became invisible. | Must | Hidden answers don't feed the diagnosis or final validation. |
| FORM-10 | Allow review before submission. | Must | The respondent can go back and correct answers before confirming. |
| FORM-11 | Show a confirmation after a completed submission. | Must | Confirmation only appears after successful persistence. |
| FORM-12 | Prevent incomplete submission. | Must | The server validates all visible required questions before closing the briefing. |
| FORM-13 | Make the form accessible by keyboard and screen reader. | Must | The main flow can be completed without a mouse. |
| FORM-14 | Avoid exposing notes, internal data and diagnosis in the public payload. | Must | Inspecting API responses reveals no internal data. |

### 4.3 Form rules preserved from the MVP

- Visibility is defined by data, not by conditionals scattered across the UI.
- A question only depends on earlier answers in catalog order.
- Invisible answers don't take part in the diagnosis.
- Required questions are only required when visible.
- Clearing an answer removes the current value.
- There must be one current answer per question and briefing.
- Submission is an atomic transition.
- Idempotent resubmission doesn't duplicate the diagnosis.
- The token is a credential: strong, opaque, expiring and revocable.
- The public payload contains only the data needed to answer.

---

## 5. Deterministic diagnosis

### 5.1 Requirements

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| DIA-01 | Run the diagnosis from valid, visible answers. | Must | Same answers and same rules version produce the same result. |
| DIA-02 | Keep a deterministic engine in V1, without depending on generative AI. | Must | The diagnosis can be reproduced in an automated test. |
| DIA-03 | Evaluate the categories Positioning, Audience, Offer, Digital presence and Current marketing. | Must | Each category returns a status and evaluation data. |
| DIA-04 | Run the registered, versioned signal rules. | Must | Each rule has a test and documented conditions. |
| DIA-05 | Classify signals by severity. | Must | Severity and applied penalty are persisted. |
| DIA-06 | Trace signals back to the answers that originated them. | Must | Each signal holds valid references to the briefing's answers. |
| DIA-07 | Distinguish missing data from a negative result. | Must | A category without required data is shown as insufficient, not red. |
| DIA-08 | Show an explanation for a category without enough data. | Must | The panel states which required answers are missing. |
| DIA-09 | Preserve the diagnosis generated on submission. | Must | A historical result doesn't change by reading or refreshing a screen. |
| DIA-10 | Allow explicit, authorized reprocessing. | Must | Reprocessing records rules version, actor, date and result. |
| DIA-11 | Preserve previous versions or reprocessing history. | Must | It's possible to identify which result each run produced. |
| DIA-12 | Allow human analysis and notes on the diagnosis. | Must | Notes are associated with the project/diagnosis and have an author. |
| DIA-13 | Allow review and approval of the diagnosis/briefing according to permission. | Must | Only authorized roles can approve; the action is audited. |

### 5.2 Current engine parameters

The MVP documentation records the following parameters. They should be treated as versioned configuration, not immutable values:

- Starting score per category: 100.
- Light penalty: 15.
- Moderate penalty: 25.
- Strong penalty: 40.
- Green: 80–100.
- Yellow: 50–79.
- Red: 0–49.
- Gray: insufficient required data.

The calculation and the signal combination rule must be preserved, or changed only through a documented decision and regression tests.

---

## 6. Recommendations and prioritization

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| REC-01 | Generate recommendations through deterministic rules and context. | Must | Recommendations consider relevant signals, answers and categories. |
| REC-02 | Record the origin of each recommendation. | Must | A recommendation points to the rules, signals and evidence that motivated it. |
| REC-03 | Group recommendations by diagnosis category. | Must | The user can browse recommendations by category. |
| REC-04 | Group recommendations into strategic objectives. | Must | Each recommendation can be related to an objective. |
| REC-05 | Allow human editing and customization. | Must | Changes preserve the original suggestion and history. |
| REC-06 | Calculate priority combining severity, impact, urgency and effort. | Must | The system shows the criteria considered and the calculated result. |
| REC-07 | Allow an authorized member to suggest a priority change. | Must | The request records the suggested value and justification. |
| REC-08 | Require confirmation by a person with permission. | Must | Effective priority only changes after approval. |
| REC-09 | Preserve the originally calculated priority. | Must | History allows comparing original and current priority. |
| REC-10 | Avoid duplicate or conflicting recommendations in the same context. | Should | Deduplication rules are applied and tested. |
| REC-11 | Version recommendation rules. | Must | It's possible to know which version generated each recommendation. |

**Pending decision:** priority formula and weights; impact/urgency/effort scale; tie-breaking criteria; deduplication policy; behavior when new rules replace old recommendations.

---

## 7. Planning, objectives and execution

### 7.1 Plans

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| PLAN-01 | Create one main strategic plan per project. | Must | A project has at most one active main plan, per the defined rule. |
| PLAN-02 | Allow complementary plans linked to the project. | Must | A complementary plan keeps its link to the project and related objectives. |
| PLAN-03 | Organize the plan into strategic objectives. | Must | Objectives have position, status and context in the plan. |
| PLAN-04 | Convert approved recommendations into proposed objectives and actions. | Must | The system presents suggestions before creating execution records. |
| PLAN-05 | Suggest tasks, owners, priorities and deadlines when there's enough data. | Should | Suggestions are editable and not confirmed automatically. |
| PLAN-06 | Require human review before creating commitments. | Must | No suggested task enters execution without confirmation. |
| PLAN-07 | Allow duplicating plans/templates. | Should | Duplication states which data will be copied and which will be reset. |

### 7.2 Objectives

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| OBJ-01 | Create an objective with name, description, owner and status. | Must | The objective belongs to a plan and project. |
| OBJ-02 | Relate the objective to recommendations and diagnosis. | Must | The user can trace the objective's strategic origin. |
| OBJ-03 | Define the associated target and indicators. | Must | The target has a defined value, unit and context. |
| OBJ-04 | Track the status and progress of related actions. | Must | Operational progress is shown separately from the result. |
| OBJ-05 | Keep a change history. | Must | Relevant changes record author, date and previous/new values. |
| OBJ-06 | Review an objective that didn't reach its target. | Must | The team can review the objective and actions, recording a justification. |
| OBJ-07 | Present automatic, rule-based adjustment suggestions. | Should | The suggestion is explainable and requires human approval. |
| OBJ-08 | Archive a cancelled or replaced objective. | Must | The record keeps reason, owner, date and impact. |
| OBJ-09 | Distinguish a completed objective from an achieved objective. | Must | Operational status doesn't automatically imply the target was met. |

### 7.3 Actions and tasks

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| TASK-01 | Create actions linked to objectives. | Must | An action has a related objective and project. |
| TASK-02 | Split actions into tasks. | Must | A task belongs to an action and keeps strategic context. |
| TASK-03 | Assign an owner and collaborators. | Must | Assignments only accept authorized members. |
| TASK-04 | Define priority, deadline, description and status. | Must | Fields are shown in the detail view and in lists. |
| TASK-05 | Record updates and status history. | Must | Relevant changes have an author and date. |
| TASK-06 | Allow comments and mentions on tasks. | Should | Comments respect project access and notify the people mentioned. |
| TASK-07 | Filter tasks by owner, project, status, priority and deadline. | Should | Filters don't expose tasks outside the user's scope. |
| TASK-08 | Don't calculate strategic success from completed tasks alone. | Must | Dashboards and reports show operational and strategic metrics separately. |

### 7.4 Project closing

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| CLOSE-01 | Start the closing flow with a review of objectives. | Must | The system shows the status of objectives and indicators. |
| CLOSE-02 | Record results, evidence and learnings. | Must | Closing contains a summary of results and notes. |
| CLOSE-03 | Require approval by an authorized role. | Must | The project only moves to closed after a valid approval. |
| CLOSE-04 | Generate the project's final report. | Must | The report brings together objectives, actions, indicators, results and decisions. |
| CLOSE-05 | Preserve history after closing. | Must | Data remains viewable according to the retention policy. |

---

## 8. Indicators, measurements and evidence

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| MET-01 | Associate indicators with objectives. | Must | An indicator never lacks strategic context. |
| MET-02 | Define name, description, unit, initial value and target. | Must | Essential fields are validated. |
| MET-03 | Configure the update method per indicator. | Must | The selected method is shown and respected by the flow. |
| MET-04 | Allow manual updates in V1. | Must | An authorized member records a new measurement. |
| MET-05 | Don't impose a mandatory global update frequency. | Must | An indicator can be updated whenever the team decides. |
| MET-06 | Allow an authorized member to record a result. | Must | The record identifies author and date. |
| MET-07 | Require validation by an authorized owner. | Must | A measurement can stay pending until validated. |
| MET-08 | Keep a measurement history. | Must | Previous values aren't overwritten without history. |
| MET-09 | Attach evidence and notes. | Must | Evidence stays associated with the measurement and respects permissions. |
| MET-10 | Compare initial situation, target and observed result. | Must | The view shows all three values when available. |
| MET-11 | Record the team's qualitative evaluation. | Must | The evaluation has an author and date. |
| MET-12 | Avoid automatic causal inference. | Must | Reports distinguish temporal correlation from proven impact. |
| MET-13 | Allow future integration for automatic updates. | Could | The architecture doesn't couple the domain to a specific provider. |

**Pending decision:** catalog of indicator types, numeric/text formats, handling of changed targets, units, validation and approval permissions.

---

## 9. History, documents and communication

### 9.1 Client history

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| HIST-01 | Record meetings, notes, interactions and decisions. | Must | Each record has type, content, author, date and association. |
| HIST-02 | Show projects and results in the client history. | Must | An authorized user views the contextual timeline. |
| HIST-03 | Allow relating a record to a client and a project. | Must | The record appears in the related contexts. |
| HIST-04 | Preserve history when the owner or team changes. | Must | Original authorship remains identifiable. |

### 9.2 Documents

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| DOC-01 | Attach a document to a client or project. | Must | The file has an association and metadata. |
| DOC-02 | Record category, description, author and date. | Must | Metadata is queryable. |
| DOC-03 | Restrict viewing and download by permission. | Must | A user without access can't get the file through a direct URL. |
| DOC-04 | Validate file type and size. | Must | Upload rejects disallowed formats or sizes. |
| DOC-05 | Record document removal/replacement. | Should | History keeps the event and the person responsible. |

### 9.3 Internal communication

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| COM-01 | Allow comments on projects, objectives and tasks. | Must | A comment keeps context and authorship. |
| COM-02 | Allow mentioning members. | Should | A mention notifies an authorized recipient. |
| COM-03 | Notify relevant events. | Should | Notifications respect preferences and permissions. |
| COM-04 | Show an activity center. | Should | The user views relevant events within their scope. |
| COM-05 | Don't send private content to a recipient without access to the context. | Must | Authorization is checked before notifying or opening a link. |

---

## 10. Dashboards and reports

### 10.1 Dashboards by role

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| DASH-01 | Show an overview for the administrator. | Must | Shows the organization's clients, projects, team, approvals and indicators. |
| DASH-02 | Show a team/projects view for the leader. | Must | The leader sees only authorized teams and projects. |
| DASH-03 | Show a work view for the member. | Must | The member sees accessible projects, tasks, objectives and pending items. |
| DASH-04 | Differentiate activities, deliverables, results and impact. | Must | Metrics aren't aggregated as if they were equivalent. |
| DASH-05 | Allow filters by period, client, project and member. | Should | Filters update all related components. |

### 10.2 Reports

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| REP-01 | Generate an operational report. | Must | Shows the status of projects, tasks, owners and deadlines. |
| REP-02 | Generate a strategic report. | Must | Shows diagnosis, recommendations, objectives and results. |
| REP-03 | Generate a performance report. | Must | Shows indicators, targets, measurements and evidence. |
| REP-04 | Filter reports by period, client, project and member. | Should | Filters respect authorization. |
| REP-05 | Offer tables, charts, comparisons and export. | Should | Displayed data matches the selected filter and period. |
| REP-06 | Share a specific report with a client. | Must | Sharing exposes only the selected, authorized content. |
| REP-07 | Allow expiring and revoking a share. | Must | A revoked/expired link no longer shows the report. |
| REP-08 | Audit creation of and access to shares, when technically possible. | Should | Sharing events are recorded. |

**Pending decision:** sharing mechanism (PDF, protected link or both), recipient authentication, default validity, revocation, content scope and view logging.

---

## 11. Templates, customization and recurrence

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| TMP-01 | Create and reuse project/campaign templates. | Should | A template can start a new project without copying improper personal data. |
| TMP-02 | Duplicate a project, selecting the content to copy. | Should | The user reviews inherited data before confirming. |
| TMP-03 | Configure project recurrence. | Should | The recurrence rule is visible and can be paused/cancelled. |
| TMP-04 | Customize fields, statuses and categories. | Must | Changes respect permissions and domain validations. |
| TMP-05 | Customize briefing, diagnosis and report templates. | Should | A template has a version and doesn't change instances already started. |
| TMP-06 | Preserve the integrity of existing projects after a template change. | Must | A change doesn't silently modify projects in progress. |
| TMP-07 | Define inheritance and reset behavior on duplication. | Must | The system states what will be copied, reset or requested again. |

**Pending decision:** whether recurrence creates projects automatically or suggests creating them; how template changes affect existing instances; which fields are mandatory and which are customizable.

---

## 12. Security, privacy and auditing

### 12.1 Security

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| SEC-01 | Validate the session on every private route on the server. | Must | Access tests without a session return 401. |
| SEC-02 | Apply authorization by organization, role and scope. | Must | Tests cover allowed and denied access. |
| SEC-03 | Isolate data between organizations in the data layer. | Must | Negative tests prove isolation. |
| SEC-04 | Protect public links with high-entropy tokens. | Must | The token isn't enumerable or derived from personal data. |
| SEC-05 | Implement link expiration and revocation. | Must | A blocked token neither reads nor changes data. |
| SEC-06 | Apply rate limiting on public and sensitive routes. | Must | Excess returns 429 with a retry policy. |
| SEC-07 | Validate inputs on the server. | Must | Invalid payloads are rejected before persisting. |
| SEC-08 | Protect mutations against CSRF and origin abuse. | Must | Unauthorized origins are blocked. |
| SEC-09 | Keep secrets exclusively on the server. | Must | No secret appears in bundles, logs or public payloads. |
| SEC-10 | Apply security headers and content policies. | Must | CSP, HSTS, Referrer-Policy and other headers are tested. |
| SEC-11 | Protect shared files and reports. | Must | Unauthorized URLs don't grant access to the content. |
| SEC-12 | Record relevant security events. | Must | Authentication failures, permission changes and shares are traceable. |

> Note: these requirement IDs (SEC-01…SEC-12) are distinct from the historical audit findings with the same prefix in `docs/PHASE-0-AUDIT.md`.

### 12.2 Privacy and LGPD

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| PRIV-01 | Show a privacy notice on the form. | Must | The respondent receives clear information about purpose and contact channel. |
| PRIV-02 | Define the legal basis per processing purpose. | Must | Don't treat consent as a universal basis. |
| PRIV-03 | Collect only necessary data. | Must | Optional fields and purpose are documented. |
| PRIV-04 | Define retention per data category. | Must | Policy and disposal/anonymization routine are verifiable. |
| PRIV-05 | Allow handling access and export requests. | Must | Related data can be exported in a readable format. |
| PRIV-06 | Allow correction, deletion or anonymization per applicable obligation. | Must | The operation is authorized, audited and respects legal retention. |
| PRIV-07 | Protect personal data in logs and monitoring. | Must | Logs don't store free-text answers, phone, email or private notes without need. |
| PRIV-08 | Document vendors and sub-processors. | Must | Services that process data are identified. |
| PRIV-09 | Record consent when it's the applicable legal basis. | Should | The record keeps notice version, purpose, date and evidence. |

### 12.3 Auditing

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| AUD-01 | Audit changes to permissions, clients, projects and briefings. | Must | The event records actor, date, entity and action. |
| AUD-02 | Audit approvals, priority changes and objective changes. | Must | The event records previous/new values and justification. |
| AUD-03 | Audit measurements and result validations. | Must | The record's author and validator are identifiable. |
| AUD-04 | Preserve history after archiving. | Must | Archiving doesn't erase the audit trail. |
| AUD-05 | Restrict reading and changing audit logs. | Must | Only authorized roles access the logs. |

---

## 13. Non-functional requirements

### 13.1 Security and isolation

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | Authorization on the server and in the data layer. | 100% of private operations covered. |
| NFR-02 | Organizational isolation. | Zero cross-access in automated tests. |
| NFR-03 | Public token. | Minimum entropy of 120 bits. |
| NFR-04 | Secrets. | No secrets in client code or logs. |
| NFR-05 | Public route protection. | Rate limit, validation and origin policy. |
| NFR-06 | Dependencies. | Periodic audits and fixing critical/high vulnerabilities before production. |

### 13.2 Privacy

| ID | Requirement | Target |
|---|---|---|
| NFR-07 | Data minimization. | Collect only data justified by purpose. |
| NFR-08 | Encryption in transit. | TLS mandatory. |
| NFR-09 | Encryption at rest. | Use the database/storage provider's features. |
| NFR-10 | Personal data in logs. | Zero unnecessary PII. |
| NFR-11 | Retention and disposal. | Documented policy and tested routine. |

### 13.3 Performance

| ID | Requirement | Initial target |
|---|---|---|
| NFR-12 | Public form. | LCP under 2.5 s in a 4G reference scenario. |
| NFR-13 | Autosave. | Server response p95 under 500 ms at expected load. |
| NFR-14 | Project loading. | p95 under 1.5 s for the agreed initial volume. |
| NFR-15 | Diagnosis and recommendations. | Execution under 2 s for a typical briefing, without blocking the UI more than necessary. |
| NFR-16 | Listings. | Pagination and filters without loading full collections. |
| NFR-17 | Reports/PDF. | Isolated processing with a timeout; failure doesn't corrupt data. |

Targets must be confirmed with load tests and the deployment environment before becoming an SLA.

### 13.4 Availability and continuity

| ID | Requirement | Target |
|---|---|---|
| NFR-18 | Health check. | Application and database verifiable. |
| NFR-19 | Automatic backup. | Frequency and retention documented. |
| NFR-20 | Recovery. | RPO/RTO defined based on infrastructure and criticality. |
| NFR-21 | Restore test. | Run periodically and recorded. |
| NFR-22 | Observability. | Structured logs, metrics and error tracking without PII. |
| NFR-23 | Migrations. | Versioned, reviewed and applied on deploy. |

Don't assume definitive RPO/RTO without validating the provider's plan and operating cost.

### 13.5 Accessibility and compatibility

| ID | Requirement | Target |
|---|---|---|
| NFR-24 | Accessibility. | WCAG 2.2 AA as the target reference. |
| NFR-25 | Keyboard navigation. | All essential flows operable without a mouse. |
| NFR-26 | Contrast and status. | Color is never the only means of conveying information. |
| NFR-27 | Responsiveness. | Support for screens from 320 px. |
| NFR-28 | Reduced motion. | Respect `prefers-reduced-motion`. |
| NFR-29 | Browsers. | Current versions of the main desktop and mobile browsers. |
| NFR-30 | Language. | User-facing text in pt-BR in V1; texts prepared for future internationalization. |

### 13.6 Quality and maintenance

| ID | Requirement | Target |
|---|---|---|
| NFR-31 | Isolated domain core. | Business rules don't depend directly on Next.js, Prisma or Supabase. |
| NFR-32 | Unit tests. | Strong coverage of deterministic rules and invariants. |
| NFR-33 | Integration tests. | Cover transactions, authorization, persistence and isolation. |
| NFR-34 | E2E tests. | Cover the main journey per profile and the public flow. |
| NFR-35 | CI. | Lint, typecheck, tests and build mandatory. |
| NFR-36 | Documentation. | Product, requirements, architecture and roadmap updated along with changes. |
| NFR-37 | Definition of Done. | Acceptance criteria, security, accessibility and operations verified before deploy. |

---

## 14. Data and integrity requirements

### 14.1 V1 conceptual entities

| Entity | Responsibility |
|---|---|
| `Organization` | Isolation and configuration boundary |
| `User` / `Membership` | Identity, organization membership and access state |
| `Role` / `Permission` | Roles and authorization |
| `Client` | Client record and context |
| `ClientActivity` | Meetings, notes, interactions and decisions |
| `Project` | Project/campaign and assignments |
| `Briefing` | Collection instance linked to a project |
| `Question` / `QuestionVersion` | Question catalog and version |
| `Answer` | Briefing answers |
| `Diagnosis` / `DiagnosisRun` | Result and versioned run |
| `Signal` | Deterministic diagnosis evidence |
| `Recommendation` | Strategic suggestion and origin |
| `PriorityChange` | Priority change request and approval |
| `Plan` | Main or complementary plan |
| `Objective` | Strategic objective |
| `Action` | Action linked to the objective |
| `Task` | Operational unit of execution |
| `Indicator` | Indicator definition and target |
| `Measurement` | Historical indicator measurement |
| `Evidence` | Evidence of results |
| `Document` | Contextual client/project file |
| `Comment` / `Mention` / `Notification` | Contextual communication |
| `Report` / `ShareLink` | Report and controlled external access |
| `Template` | Versioned reusable template |
| `AuditEvent` | Audit trail |

This is a conceptual map, not a mandatory physical schema. Relationships, cardinalities, constraints and migration strategy must be defined in `docs/ARCHITECTURE.md` and in the migrations.

### 14.2 Integrity rules

- All business entities belong to an organization.
- An answer belongs to a briefing and to a valid question in the catalog version.
- A diagnosis stores the catalog and rules version used.
- Signals point to answers from the same briefing.
- Recommendations preserve their sources and rules version.
- Objectives, actions and tasks preserve their hierarchical links.
- Measurements are historical; updates don't erase previous values.
- Approvals and priority changes record actor, date and justification.
- Deletion/archiving must respect referential integrity, retention and auditing.
- Composite operations that change status and related data must be transactional.

---

## 15. Integrations and contracts

### 15.1 Strategy

V1 starts standalone. The architecture must allow future connectors but must not anticipate a generic integration platform without validated use cases.

Possible future integrations:
- file storage;
- calendar;
- communication;
- CRM;
- project management tools;
- marketing and analytics platforms.

Credentials must be protected, events and failures recorded, and domain logic must not depend directly on third-party APIs.

### 15.2 API contracts

Detailed contracts should be defined as modules are implemented. Every route must declare:
- method and purpose;
- required authentication;
- organization and authorization scope;
- input format and validation;
- output format;
- expected errors;
- side effects and audit events;
- pagination limits and rate limit.

Don't keep in this document a list of routes that represents only the old MVP as if it were the definitive contract of the expanded platform.

---

## 16. V1 journey acceptance criteria

### 16.1 Organization and team

- [ ] An authorized administrator can configure the organization.
- [ ] The administrator can provision, invite and deactivate members.
- [ ] Roles and permissions are enforced on the server.
- [ ] A user doesn't access another organization's data.
- [ ] Leaders and members see only projects within their scope.

### 16.2 Client and project

- [ ] An authorized user creates a client.
- [ ] An authorized user creates a project associated with the client.
- [ ] The project has a main owner and collaborators.
- [ ] The client history shows permitted activities, documents, projects and results.

### 16.3 Briefing and diagnosis

- [ ] A user creates a briefing associated with the project.
- [ ] The client answers without creating an account.
- [ ] The form adapts questions, saves and resumes answers.
- [ ] Submission validates answers, closes the link and generates the diagnosis.
- [ ] The diagnosis explains signals, categories and insufficient data.
- [ ] The diagnosis preserves the rules and catalog version.
- [ ] The team reviews and approves according to permission.

### 16.4 Recommendations and planning

- [ ] The system generates traceable, contextual recommendations.
- [ ] The team can edit recommendations.
- [ ] Priority considers severity, impact, urgency and effort.
- [ ] A priority change requires justification and approval.
- [ ] An approved recommendation can be converted, with assistance, into an objective, actions and tasks.
- [ ] The team reviews and confirms before creating commitments.

### 16.5 Execution and results

- [ ] The project has a main strategic plan.
- [ ] Objectives have an owner, status, targets and indicators.
- [ ] Actions and tasks are linked to objectives.
- [ ] Authorized members update tasks and record measurements.
- [ ] Owners validate results.
- [ ] The history of measurements and evidence is preserved.
- [ ] The team can review objectives that didn't reach their targets.
- [ ] Cancelled/replaced objectives are archived with justification.

### 16.6 Relationship and reports

- [ ] The team records meetings, decisions and notes.
- [ ] Documents are associated with the client/project and protected by permission.
- [ ] Comments and mentions respect access.
- [ ] Dashboards vary by role.
- [ ] Reports distinguish activity, deliverable, result and impact.
- [ ] The client receives only the shared, authorized report.
- [ ] A share can be revoked or expire.

### 16.7 Security and operations

- [ ] Authorization and isolation tests pass.
- [ ] Public tokens are strong, expiring and revocable.
- [ ] Rate limiting and input validation are active.
- [ ] Logs don't expose unnecessary personal data.
- [ ] Backup and restore were tested.
- [ ] Health check and observability are available.
- [ ] Migrations are applied in a controlled way.

---

## 17. Known current state versus V1 target

| Area | State described in the previous MVP document | V1 target |
|---|---|---|
| Users | A single administrator | Administrator, leaders and members with permissions |
| Organization | Single-account operation | Organization as the isolation boundary, prepared for many |
| Client | Basic record | Contextual history and multiple projects |
| Project | Not structured as a central entity | Client → Project/Campaign → Briefing |
| Briefing | Public adaptive form | Briefing linked to a project and a versioned catalog |
| Diagnosis | Deterministic engine across five categories | Versioned, explainable, reviewable and auditable diagnosis |
| Recommendations | Problems and opportunities | Contextual recommendations, prioritized and grouped into objectives |
| Planning | Not covered as a complete flow | Main plan, complementary plans, objectives, actions and tasks |
| Indicators | Form metrics | Strategic indicators, targets, measurements and evidence |
| Communication | Not covered as a module | Comments, mentions and essential notifications |
| Documents | Briefing PDF | Contextual client/project documents and reports |
| Reports | Briefing PDF | Operational, strategic and performance reports |
| External client | Briefing respondent | Respondent and recipient of shared reports |
| Integrations | Not implemented | Standalone product, architecture prepared for future integrations |

**Note:** the current-state column reproduces the previous documentation. It must be checked against the code and the technical inspection results before planning migrations. (Phase 0 audit: `docs/PHASE-0-AUDIT.md`.)

---

## 18. Pending product decisions

The decisions below need to be resolved before detailing the corresponding implementation requirements.

| ID | Topic | Decision needed | Impact |
|---|---|---|---|
| PD-01 | Permissions | ~~Matrix of actions by role and scope~~ **Decided for Phase 1 (D8, section 2.3)** | Authorization, UX and tests |
| PD-02 | Multiple roles | ~~How to combine the permissions of a member with more than one role~~ **Decided: one role per member (D9)** | Security |
| PD-03 | Priority | Formula, weights, scales and tie-breaking | Recommendation engine |
| PD-04 | Recommendations | Deduplication, conflicts and versioning | Strategic consistency |
| PD-05 | Indicators | Accepted data types, units and formats | Data model |
| PD-06 | Results validation | Who can validate which indicators | Permissions and auditing |
| PD-07 | Targets | How to record a target change without losing history | History and reports |
| PD-08 | Shared reports | PDF/link, authentication, validity, revocation and scope | Security and external experience |
| PD-09 | Templates | Inheritance rules when duplicating project/briefing/plan | Integrity |
| PD-10 | Recurrence | Automatic creation or suggestion of a new project | Automation and notifications |
| PD-11 | Notifications | Mandatory events, preferences and initial channels | Communication |
| PD-12 | Archiving/deletion | Policy per entity and retention exceptions | LGPD and integrity |
| PD-13 | Project access | ~~Whether access is by individual assignment, team or a combination~~ **Decided: individual assignment (D10)** | Authorization |
| PD-14 | Approval | Which entities require approval and by which roles | Workflows |

---

## 19. Requirements roadmap by increment

The order below organizes dependencies; it doesn't replace the technical roadmap.

### Increment 0 — Reliability of the existing MVP

- Close authentication and authorization gaps.
- Make submission and diagnosis atomic.
- Validate answers semantically.
- Complete the link lifecycle.
- Version catalog and rules.
- Implement rate limiting, headers and minimal auditing.
- Prepare privacy, retention, export and deletion.
- Test backup, restore, deploy and PDF.

### Increment 1 — Multi-user foundations and work structure

- Organization and isolation.
- Members, roles and permissions.
- Client, project, owner and collaborators.
- Briefing associated with a project.
- Basic contextual history.

### Increment 2 — Strategic intelligence

- Versioned diagnosis.
- Contextual recommendations.
- Explainable prioritization.
- Approvals and audit trail.

### Increment 3 — Planning and execution

- Main strategic plan and complementary plans.
- Objectives, actions and tasks.
- Assisted conversion of recommendations.
- Comments, mentions and essential notifications.

### Increment 4 — Indicators and results

- Indicator and target definition.
- Measurements, evidence and validation.
- Objective review.
- Project closing.

### Increment 5 — Reports and expanded operations

- Role-based dashboards.
- Operational and strategic reports.
- Controlled external sharing.
- Templates, duplication and recurrence.
- Improvements driven by usage and feedback.

---

## 20. Definition of Done

A delivery can only be considered done when:

- [ ] The requirement has verifiable acceptance criteria.
- [ ] The happy path and relevant errors have automated tests.
- [ ] Authentication, authorization and isolation were tested.
- [ ] There's no privacy, security or accessibility regression.
- [ ] Logs and messages don't expose unnecessary personal data.
- [ ] The interface works on mobile and desktop.
- [ ] Loading, empty, error and success states are defined.
- [ ] Migrations and environment variables are documented.
- [ ] Impact on backup, retention, observability and cost was considered.
- [ ] `lint`, `typecheck`, tests and build pass in CI.
- [ ] Product, requirements, architecture and roadmap documentation was updated.
- [ ] The change was validated in a preview environment before production.

---

## 21. Relationship with the other documents

| Document | Responsibility |
|---|---|
| `PRODUCT.md` | Product identity, audience, purpose, principles and boundaries |
| `docs/REQUIREMENTS.md` | What the system must do, rules, quality and acceptance criteria |
| `docs/ARCHITECTURE.md` | Technical state, architecture, data, security and implementation decisions |
| `docs/ROADMAP.md` | Execution order, dependencies, phases and priorities |
| `DESIGN.md` | Tokens, components, patterns and visual behavior, once created |
