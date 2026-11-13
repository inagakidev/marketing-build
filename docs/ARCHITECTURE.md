# Briefing Inteligente — Technical Inspection and Evolutionary Architecture

> **Version:** 2.0  
> **Date:** 2026-11-13  
> **Reference documents:** `PRODUCT.md` and `docs/REQUIREMENTS.md` — version 2.0  
> **Original technical base:** inspection recorded on 2026-11-12, commit `4804a91` + uncommitted MVP changes  
> **Goal of this revision:** align the technical architecture with the product's evolution from a briefing and diagnosis system into a strategic marketing management platform for teams.

> **Update:** the historical findings in §3.2 were re-audited on 2026-11-12 and the Phase 0 fixes were merged into `main`. Current status per finding: `docs/PHASE-0-AUDIT.md`.

---

## 1. Purpose and how to read this document

This document brings together two perspectives that must not be confused:

1. **Observed state:** what the previous technical inspection recorded about the MVP on 2026-11-12.
2. **Target architecture:** the recommended structure to support the expanded V1 described in `PRODUCT.md` and `docs/REQUIREMENTS.md`.

The original inspection was done on the MVP and doesn't prove the current state of the repository. Findings, file paths, commands and metrics below are therefore historical evidence that must be revalidated before opening implementation tasks.

The target architecture is an evolution proposal, not a statement that these modules already exist.

### 1.1 Architectural direction

The product organizes marketing work into a journey:

**Organization → Client → Project/Campaign → Briefing → Diagnosis → Recommendations → Objectives → Actions and tasks → Indicators → Results → Report and learning.**

The briefing remains the structured input. It must not become the rigid center of the data model: diagnosis, objectives, tasks, indicators, evidence and history need to keep existing and evolving independently of a specific form version.

### 1.2 Decision principles

- Preserve the pure domain core already identified in the MVP.
- Avoid a full rewrite: evolve by modules and use cases.
- Treat the organization as the data isolation boundary from the start.
- Apply authorization on the server and in data access, not only in the UI.
- Record the history of decisions that change priorities, objectives, results and permissions.
- Keep diagnosis and recommendations deterministic and explainable in V1.
- Don't introduce generative AI as a decision authority in V1.
- Don't anticipate external integrations before stabilizing internal flows.
- Prefer transactional consistency and traceability over premature abstractions.

---

## 2. Executive summary

### 2.1 Diagnosis of the existing base

The 2026-11-12 inspection recorded an MVP base with good foundations:

- domain separated from infrastructure in `src/core`;
- data-driven visibility rules;
- signal engine organized by registry;
- deterministic diagnosis;
- high-entropy public token;
- working autosave and public flow;
- relevant unit tests for the core;
- initial separation between `core`, `server`, `components` and `app`.

It also recorded relevant security, integrity, privacy, operations and quality risks. Those risks remain an important checklist, but must be confirmed in the code before being treated as current issues.

### 2.2 Change in product scale

The scope expansion mainly changes four architectural aspects:

| Before: briefing MVP | Now: strategic platform |
|---|---|
| Single administrator user | Organization with administrators, leaders and members |
| Client tied to the user | Client belonging to the organization |
| Briefing as the main unit | Project/campaign as the unit of work |
| Diagnosis as the final result | Diagnosis as input to recommendations, objectives, execution and evaluation |
| Answers and signals | Answers, versions, decisions, actions, tasks, metrics and evidence |
| Briefing dashboard | Views by organization, client, project, objective and performance |

The architecture must follow this change without turning the system into a full CRM or a generic task management tool.

### 2.3 Main architectural risks for V1

1. **Multi-organization isolation:** every query and mutation must respect `organizationId`.
2. **Authorization by role and scope:** admin access, leadership, project participation and specific permissions must be defined consistently.
3. **Versioning:** briefings, questions, diagnosis rules, recommendations and templates must preserve historical context.
4. **Flow integrity:** submission, diagnosis, approval and conversion of recommendations into plans must be consistent operations.
5. **Traceability:** strategic changes must record author, date, justification and previous/new values.
6. **Measurement:** completing tasks must not be confused with achieving objectives.
7. **Privacy:** free-text answers, attachments and contact data require an access, retention and deletion policy.
8. **Operations:** reports, PDFs, files and async processing must be compatible with the real deploy environment.

---

## 3. Technical state observed in the MVP

> This section preserves the snapshot of the previous inspection. It doesn't represent a new repository audit. Current status: `docs/PHASE-0-AUDIT.md`.

### 3.1 Recorded strengths

| Area | Recorded evidence | Architectural value |
|---|---|---|
| Domain | `src/core` with no dependency on Next, Prisma or Supabase | Testable, reusable rules |
| Form | `Question.visibilityRule` and `resolveVisibility` | Data-configurable branching |
| Answers | Invisible answers ignored in processing | Prevents conditional data from contaminating the diagnosis |
| Signals | `src/core/signals/registry.ts` | Low-coupling rule addition |
| Diagnosis | Per-category scoring and gray status | Distinguishes missing information from a bad result |
| Traceability | `Signal.sourceAnswerIds` | Explains a signal's origin |
| Reprocessing | Transactional `processAndPersist` | Idempotent reprocessing in the recorded flow |
| Public link | Random 24-character token | Not derived from client data |
| UX | Autosave, steps and error states | Reduces lost answers |
| Tests | 133 tests in 7 files at inspection time | Relevant core coverage |

### 3.2 Recorded problems requiring revalidation

| ID | Area | Historical finding | Historical priority |
|---|---|---|---|
| SEC-01 | Authentication | User auto-provisioning without an allowlist | P0 |
| SEC-02 | Authentication | Login redirect without destination validation | P1 |
| SEC-03 | HTTP | No origin/CSRF check on admin mutations | P1 |
| SEC-04 | HTTP | No rate limiting on public routes and PDF | P1 |
| SEC-05 | Privacy | No `noindex` or `referrer` policy on private pages | P1 |
| SEC-06 | HTTP | Security headers/CSP not configured | P1 |
| DATA-01 | Integrity | Non-atomic submission with a possible race with autosave | P0 |
| DATA-02 | Versioning | Global catalog without historical versions | P0 |
| DATA-03 | Validation | Answers without sufficient semantic validation | P1 |
| DATA-04 | Diagnosis | Missing questions of gray categories not persisted | P1 |
| DATA-05 | Flow | Incomplete briefing lifecycle | P1 |
| DATA-06 | Consistency | Diagnosis order dependent on the query | P1 |
| PERF-01 | Performance | Proxy running authentication on public routes | P1 |
| QUAL-04 | Tests | No API, component or E2E tests | P2 |
| QUAL-05 | CI | No CI pipeline | P2 |
| QUAL-06 | Operations | No structured logs, metrics or health check | P1 |
| LGPD-01 | Privacy | No complete personal data lifecycle | P1 |
| DEPLOY-01 | Deploy | PDF strategy incompatible with Vercel serverless | P1 |

### 3.3 Rule for turning findings into tasks

Before implementing a fix:

1. confirm the problem still exists in the code;
2. identify whether the product expansion changed the context;
3. check dependencies and impact on existing data;
4. define testable acceptance criteria;
5. create a reversible migration when the schema changes;
6. update this document and `docs/REQUIREMENTS.md` when the decision changes the architecture.

Don't use the historical table as an automatic backlog without this validation.

---

## 4. Proposed domain architecture

### 4.1 Main contexts

The proposal organizes the domain into cohesive modules. This doesn't require microservices: the initial recommendation is a **modular monolith**, with one application and one transactional database, keeping clear boundaries between modules.

| Context | Responsibility | Core entities |
|---|---|---|
| Identity & Access | Identity, organization, members, roles and permissions | User, Organization, Membership, Role, Permission |
| Client Management | Client registry and contextual history | Client, ClientContact, ClientActivity |
| Project Management | Projects/campaigns, owners, collaborators and lifecycle | Project, ProjectMember, ProjectStatusHistory |
| Briefing | Invitations, public form, questions, answers and versions | Briefing, BriefingVersion, QuestionVersion, Answer |
| Diagnosis | Signals, per-category evaluation, rules and versions | Signal, Diagnosis, DiagnosisSignal, RuleVersion |
| Recommendations | Contextual recommendations, origin, review and prioritization | Recommendation, RecommendationSource, RecommendationRevision |
| Planning | Objectives, strategic plans and actions | StrategicPlan, Objective, Action |
| Execution | Tasks, owners, deadlines, dependencies and comments | Task, TaskAssignee, TaskDependency, Comment |
| Measurement | Indicators, targets, measurements, evidence and evaluation | Metric, Target, Measurement, Evidence, ImpactReview |
| Documents | Files associated with clients and projects | Document, DocumentVersion |
| Reporting | Queries, snapshots and report exports | ReportDefinition, ReportSnapshot, ExportJob |
| Templates | Reusable briefing, diagnosis, project and report templates | Template, TemplateVersion |
| Notifications | Notification events and preferences | Notification, NotificationPreference |
| Audit | History of relevant actions and security trail | AuditEvent |

Names are conceptual. The final schema must be defined after reviewing the real Prisma schema and each flow's requirements.

### 4.2 Responsibility boundaries

- `Briefing` gathers context; it must not store tasks or campaign results.
- `Diagnosis` records a versioned interpretation of the answers; it must not be overwritten without history.
- `Recommendation` represents a reviewable strategic suggestion; it isn't automatically a task.
- `Objective` represents the result to be achieved.
- `Action` represents an initiative or line of work contributing to the objective.
- `Task` represents an executable unit of work.
- `Metric` defines what will be measured; `Measurement` records a value observed at a point in time.
- `Evidence` supports an evaluation, without replacing the measured data.
- `AuditEvent` records relevant changes; it must not be used as a substitute for domain history.

### 4.3 Domain flow

```text
Organization
  └── Client
       └── Project / Campaign
            ├── Briefing
            │    ├── BriefingVersion
            │    ├── Answers
            │    └── Diagnosis
            │         └── Signals
            ├── Recommendations
            │    └── Review / Priority history
            ├── StrategicPlan
            │    └── Objectives
            │         ├── Actions
            │         │    └── Tasks
            │         ├── Metrics / Targets
            │         ├── Measurements
            │         └── Evidence
            ├── Documents
            ├── Comments / Activities
            └── Reports
```

A project may have more than one briefing over time, e.g. an initial briefing and a scope review. The relationship must not assume exactly one briefing per project.

---

## 5. Application architecture

### 5.1 Recommended style: modular monolith

At the current stage, microservices would increase operating cost, deploy complexity, observability needs and distributed consistency problems without proportional benefit.

Recommendation:

- one Next.js application;
- one PostgreSQL database;
- Prisma for data access;
- Supabase Auth or an equivalent identity provider;
- private file storage;
- async processing only for work that justifies a queue;
- internal modules with explicit contracts.

Modular separation should be logical and testable, not necessarily deployed as separate processes.

### 5.2 Suggested folder structure

```text
src/
├── app/                         # Routes, pages and UI composition
│   ├── (auth)/
│   ├── (workspace)/
│   ├── public/
│   │   └── briefing/[token]/
│   ├── api/
│   └── print/
├── components/                  # Shared visual components
│   ├── ui/
│   ├── layout/
│   └── domain/
├── modules/
│   ├── identity/
│   ├── clients/
│   ├── projects/
│   ├── briefings/
│   ├── diagnosis/
│   ├── recommendations/
│   ├── planning/
│   ├── execution/
│   ├── measurement/
│   ├── documents/
│   ├── reporting/
│   ├── templates/
│   ├── notifications/
│   └── audit/
├── core/                        # Truly shared/pure types and rules
├── infrastructure/              # External adapters
│   ├── database/
│   ├── auth/
│   ├── storage/
│   ├── email/
│   ├── queue/
│   ├── pdf/
│   └── observability/
└── shared/
    ├── config/
    ├── errors/
    ├── logging/
    └── validation/
```

Each module can adopt a simple internal structure (file names in camelCase, per `docs/guidelines/CODE-AND-UI.md`):

```text
modules/projects/
├── domain/
│   ├── project.ts
│   ├── projectPolicy.ts
│   └── projectStatus.ts
├── application/
│   ├── createProject.ts
│   ├── updateProject.ts
│   └── archiveProject.ts
├── infrastructure/
│   └── projectRepository.ts
└── presentation/
    └── projectDto.ts
```

Don't create all these folders empty at once. Introduce the structure when a flow is implemented or refactored.

### 5.3 Dependency rules

| Layer | May depend on | Must not depend on |
|---|---|---|
| Domain | Pure domain types and functions | Next.js, React, Prisma, Supabase, network |
| Application | Domain and port contracts | Components, Route Handlers and vendor details |
| Infrastructure | Application/Domain contracts and external SDKs | Visual interface |
| Presentation | Application, DTOs and components | Prisma directly |
| App / Route Handlers | Presentation and Application | Business rules implemented locally |

Routes should be thin: authenticate, validate shape, call the use case and convert the result into HTTP.

### 5.4 Repositories and queries

Use repositories when there's a clear benefit for persistence isolation, transactional consistency or testing. Don't create a generic layer that just forwards every Prisma method.

Complex read queries for dashboards and reports can use dedicated query services, without forcing every read through the same write-repository pattern.

---

## 6. Multi-organization, authorization and isolation

### 6.1 Organization as tenant

Even with an initial deployment for one organization, the model must contain `organizationId` on organizational data from the start. This avoids a risky structural migration when a second organization arrives.

Entities such as client, project, briefing, plan, objective, task, document, template and report must be associated with the organization directly or through a verifiable relationship.

### 6.2 Mandatory rules

- Every admin query must restrict scope to the active organization.
- Every mutation must validate organization and permission on the server.
- Don't trust `organizationId`, `userId`, `role` or `projectId` sent by the client without revalidating the relationship in the database.
- Hard-to-guess IDs don't replace authorization.
- The UI may hide actions, but the API must reject them when unauthorized.
- File access must check the same policy as the record that references the file.
- Externally shared reports must expose only explicitly authorized content.

### 6.3 Conceptual access model

```text
User
  └── Membership
       ├── Organization
       ├── Role
       └── Permission overrides (when needed)

Project
  └── ProjectMember
       ├── User
       └── Project-level access
```

Organization membership defines baseline access. Project participation can restrict or extend actions according to the approved permission matrix.

### 6.4 Roles and permissions

The product foresees administrators, leaders and members. The Phase 1 matrix is decided in `docs/REQUIREMENTS.md` §2.3 (D8–D11): one role per member, project access by individual assignment. The implementation must avoid scattered conditionals like `if (role === "admin")`.

Recommendation:

- centralize policies in functions such as `canManageMembers`, `canApproveDiagnosis`, `canChangePriority`, `canManageProject` and `canValidateMeasurement`;
- distinguish organization permissions from project permissions;
- allow a person to own a project without granting organization admin access;
- record role changes and exceptional grants in the audit log;
- apply the principle of least privilege.

Don't assume every leader can perform any action or that every member can only view. Confirm the matrix in the requirements document before coding.

Implemented in `src/modules/identity/domain/permissions.ts` (EP-04.3): one pure function per row of the matrix, tested cell by cell. Routes call `authorize(can…(user.role))` from `src/server/security/authorization.ts` right after authenticating, before reading any record, and a denial becomes a 403. Screens use the same functions to hide actions and show the insufficient-permission state.

### 6.5 Row Level Security

If PostgreSQL/Supabase RLS is used as a second barrier, policies must reflect the real membership and project-scope model. Don't enable RLS with permissive policies just to "mark it as protected".

Application-level authorization remains mandatory. Tests must try to access another organization's records using known IDs and sessions of different users.

---

## 7. Transactional integrity and use cases

### 7.1 Use cases that require a transaction

| Use case | Consistent operation |
|---|---|
| Submit briefing | Validate status, validate visible answers, freeze version, generate diagnosis and change status |
| Reprocess diagnosis | Recompute signals and diagnosis with an explicit version, preserving history |
| Approve diagnosis | Record approver, date, version and state |
| Convert recommendation | Create/associate objective, action and tasks after human review |
| Change priority | Record calculated priority, approved priority, justification and author |
| Update objective | Record state change, target and change history |
| Record measurement | Validate metric, unit, period and permission; store measurement and associated evidence |
| Close project | Validate objectives, results, final review and closing approval |
| Delete/anonymize data | Apply retention policy and preserve integrity of records that must be kept |

### 7.2 Example briefing submission flow

```text
submitBriefing(briefingId, actor/context)
  1. load the briefing within the authorized organization
  2. validate the link's state and deadline
  3. load the exact catalog version associated with the briefing
  4. compute visibility and validate visible required answers
  5. validate types, options and limits of all answers
  6. freeze a snapshot of the submitted answers
  7. run the deterministic engine with a defined rules version
  8. persist signals and diagnosis
  9. change status to ready_for_review
 10. write the audit event
 11. commit the transaction
```

If the transaction fails, the briefing must not be marked as submitted without the corresponding diagnosis.

### 7.3 Concurrency and idempotency

- Autosave and submission need explicit coordination.
- A submission must prevent later answer writes, except through an authorized reopening flow or a new version.
- Repeated operations must have predictable results.
- Reprocessing must be idempotent for the same input and rules version, without erasing the historical trail.
- Use optimistic version control (`version`/`updatedAt`) where concurrent edits are possible.
- Don't rely only on browser debounce for consistency.

---

## 8. Versioning and reproducibility

### 8.1 What needs to be versioned

| Artifact | Reason |
|---|---|
| Question catalog | Changes must not modify old briefings |
| Submitted briefing | Preserve exactly what was answered |
| Diagnosis rules | Explain why a result was produced |
| Recommendations and their criteria | Trace origin and changes |
| Briefing/project/report templates | Future duplications must not alter existing instances |
| Targets and indicator definitions | Compare results against the target in force for the period |
| Final reports | Preserve the material that was shared/approved |

### 8.2 Recommended strategy

- Use immutable versions for published catalogs and rules.
- Associate each briefing with a catalog version.
- Associate each diagnosis with a rules version and the input snapshot.
- Create a new version when publishing relevant changes; don't edit the version used by existing records.
- Keep author, date, reason and publication state.
- Define a compatibility and migration policy for old versions.

### 8.3 Historical reprocessing

Reprocessing an old briefing must not silently replace its approved diagnosis. The system must create a new run, record the rules version used and allow comparing the previous result with the new one.

---

## 9. Diagnosis, recommendations and prioritization

### 9.1 Deterministic diagnosis in V1

The engine must remain pure, testable and explainable. Rules need:

- a stable identifier;
- a version;
- a category;
- trigger conditions;
- severity;
- an understandable explanation;
- references to the originating answers and signals;
- tests for positive, negative and edge scenarios.

Human interpretation remains part of the process. The system offers evidence and a proposal; the team reviews and validates.

### 9.2 Recommendations as reviewable entities

A recommendation must preserve:

- text and suggested objective;
- strategic category;
- signals/answers that motivated the suggestion;
- version of the rule that originated it;
- calculated priority;
- approved priority;
- change justification;
- review state;
- owner and history.

Avoid generating recommendations only as transient on-screen text. They need to exist as traceable records if they're discussed, approved or converted into work.

### 9.3 Prioritization

Priority considers severity, strategic impact, urgency and effort. The formula and weights remain pending a product decision.

Architectural requirements:

- store the factors used in the calculation;
- store the original calculated result;
- allow human review according to permission;
- preserve justification, author, date and previous/new value;
- prevent low or high effort alone from demoting a high-value initiative;
- allow recalculating only when the prioritization policy changes, without erasing previous decisions.

Don't hard-code definitive weights before the business rule is approved.

### 9.4 Assisted conversion into a plan

Converting a recommendation into an objective, action and tasks must be an explicit review step:

1. the system proposes an objective and an initial structure;
2. the team reviews and edits;
3. owners, priorities and deadlines are confirmed;
4. only then are execution commitments created.

This prevents a diagnostic suggestion from automatically becoming an operational obligation.

---

## 10. Planning, execution and measurement

### 10.1 Separating objective, action and task

| Element | Question it answers | Conceptual example |
|---|---|---|
| Objective | What result do we want to achieve? | Improve generation of qualified opportunities |
| Action | Which initiative contributes to the result? | Restructure the content strategy |
| Task | What concrete work needs to be done? | Gather topics and approve the editorial calendar |

A task can be completed without the objective being achieved. The model and dashboards must represent this difference.

### 10.2 Strategic plan

- One main strategic plan per project, with the possibility of complementary plans.
- Objectives with state, owner, period, metrics, targets and history.
- Actions linked to objectives.
- Tasks linked to actions and, when needed, directly to objectives.
- Scope changes, cancellation and replacement with justification.
- Project closing with results evaluation and a final report.

### 10.3 Indicators and measurements

Separate indicator definition from result observation:

- `Metric`: name, description, type, unit, update method and validation rule.
- `Target`: target value, period, effective date and history.
- `Measurement`: observed value, reference period, recording author and date.
- `Evidence`: document, link or note supporting the measurement.
- `ImpactReview`: qualitative and quantitative evaluation of impact.

The team chooses when to update indicators; don't impose a fixed frequency in the architecture. A measurement can be recorded by an authorized member, while validation belongs to people with defined permission.

### 10.4 Targets not met

The system may suggest a review based on rules, but must not change objectives or targets automatically. Changes require a human decision and history.

Cancelled or replaced objectives must be archived with reason, owner and impact, not deleted as if they had never existed.

---

## 11. Data, files and reports

### 11.1 Client history

Client history should gather activities relevant to the work: meetings, decisions, notes, documents and projects. There's no need to turn the product into a full CRM.

Activities must have author, date, type, content and a link to client/project when applicable.

### 11.2 File storage

- Use a private bucket by default.
- Persist metadata in the database; store bytes in the storage service.
- Validate size, extension and MIME type on the server.
- Generate short-lived signed URLs.
- Check authorization on the related record before issuing a URL.
- Record upload, replacement and deletion.
- Define retention and a removal policy.
- Don't store credentials or permanent public URLs for private documents.

### 11.3 Reports

Operational, strategic and performance reports must query data respecting the organization and the user's permissions.

For reports shared with clients:

- create an artifact/snapshot with explicit scope;
- use a random, revocable token;
- allow expiration;
- don't expose the internal panel;
- record creation, access and revocation;
- don't include internal comments or data from other projects;
- define whether the recipient can download, print or only view.

The sharing, authentication and expiration mechanism still needs a product decision. The architecture must support revocation and minimal scope.

### 11.4 Exports and PDFs

Long or expensive exports can use an async job. PDF generation must sit behind a service interface so Playwright/Chromium can be swapped for a compatible worker or service without changing business modules.

Don't assume full Chromium works in serverless functions. Validate the strategy in the chosen deploy environment. (Current strategy: decision D6 in `docs/DECISIONS.md`.)

---

## 12. Security, privacy and auditing

### 12.1 Authentication and authorization

- Disable open sign-up if the onboarding model requires invitations.
- Don't provision a local user without explicit authorization to join the organization.
- Validate the login redirect against allowed internal destinations.
- Protect mutations against CSRF/cross-origin according to the session model.
- Apply rate limiting on the public form, autosave, submission, login, sharing and export.
- Don't record tokens, free-text answers or personal data in common logs.
- Use secrets only on the server and rotate credentials after incidents.

### 12.2 Auditing

Record, at a minimum, relevant events:

- member invitation, joining and removal;
- role/permission change;
- creation, change, archiving and deletion of client/project;
- briefing submission, approval, revocation and reprocessing;
- recommendation/priority change;
- objective/target approval and change;
- measurement validation;
- report sharing, access and revocation;
- data export and deletion.

Each event must contain actor, organization, entity, action, date/time and the minimum necessary metadata. Avoid copying sensitive personal content into the log.

### 12.3 LGPD and data lifecycle

The architecture must allow:

- a privacy notice on the public form;
- recording the notice version and applicable legal basis;
- handling access, correction, portability and deletion requests where applicable;
- retention defined per data category;
- anonymization or deletion per policy;
- an inventory of sub-processors and services;
- recording of relevant operations;
- access control for answers and documents.

Consent must not be treated as a universal legal basis. The legal basis and timeframes must be defined with legal guidance appropriate to the context.

### 12.4 Backups and recovery

- periodic automatic backups;
- defined retention;
- point-in-time recovery when supported by the provider;
- alerts for backup failures;
- recovery runbook;
- periodic restore tests;
- RPO and RTO defined according to business impact and infrastructure capacity.

Don't fix RPO/RTO values without an operational decision.

---

## 13. API, events and async processing

### 13.1 API

API contracts must:

- validate input with schemas;
- return standardized errors;
- never trust scope or role provided by the client;
- paginate potentially large lists;
- apply allowed filters and stable ordering;
- keep compatibility when there are external clients in the future;
- record a request ID for correlation.

### 13.2 Domain events

Internal events can decouple notifications, auditing and derived tasks. Examples:

- `BriefingSubmitted`
- `DiagnosisGenerated`
- `RecommendationApproved`
- `ObjectiveUpdated`
- `MeasurementRecorded`
- `ProjectClosed`
- `ReportShared`

In the first phase, these events can be processed inside the application and persisted via an outbox when they need to survive failures. Don't adopt a distributed broker before there's a real need.

### 13.3 Async processing

Job candidates:

- heavy PDF generation;
- sending email;
- attachment processing;
- exporting large reports;
- batch notifications;
- scheduled retention and cleanup tasks.

Jobs need idempotency, bounded retries, observable state and failure handling. Don't run heavy work inside HTTP requests without assessing timeout and cost.

### 13.4 Future integrations

V1 is standalone. The architecture may anticipate adapters for Drive, calendar, communication, CRM and marketing platforms, but must not implement integrations before the internal flow is stable.

When integrations are introduced:

- credentials encrypted and kept off the client;
- minimal scopes;
- logs without secrets;
- handling of expiration and revocation;
- retries and idempotency;
- visibility of failures;
- safe disconnection and credential deletion.

---

## 14. Quality, tests and observability

### 14.1 Test pyramid

| Layer | Expected coverage |
|---|---|
| Domain | Visibility, diagnosis, priority and transition rules |
| Application | Use cases, authorization and transactions |
| Persistence | Repositories, constraints, tenant isolation and migrations |
| API | Authentication, authorization, validation and error codes |
| Components | Forms, states, accessibility and feedback |
| E2E | Full journey of organization, client, project and briefing |
| Security | Cross-access, rate limit, CSRF, public links and files |

Prioritize behavior and invariant tests. Coverage percentage can be tracked but doesn't replace the quality of scenarios.

### 14.2 Critical test scenarios

- a member of organization A doesn't access a client/project of organization B;
- a user without permission doesn't approve a diagnosis or change priority;
- a project participant doesn't automatically gain organization admin rights;
- an invisible answer doesn't take part in the diagnosis;
- concurrent submission and autosave don't lose data or leave a partial state;
- a catalog change doesn't modify a historical briefing;
- reprocessing creates a new traceable run;
- converting a recommendation requires confirmation;
- a completed task doesn't mark an objective as achieved;
- an invalid measurement isn't persisted;
- a shared report doesn't reveal internal notes;
- a revoked or expired token doesn't allow reading;
- a signed file URL doesn't allow access after expiration.

### 14.3 CI

Recommended minimum pipeline:

```text
format/lint
   ↓
typecheck
   ↓
unit tests
   ↓
integration tests (PostgreSQL)
   ↓
build
   ↓
E2E in a preview environment
   ↓
release/migrations
```

Migrations must be applied by a controlled release step, never implicitly on every application startup.

### 14.4 Observability

- structured logs with request ID;
- redaction of tokens, emails, phone numbers and answers;
- error tracking on server and client;
- latency and failure metrics;
- a health check that doesn't reveal secrets;
- alerts for authentication failures, 5xx errors, stuck jobs and export failures;
- operational dashboards to track system health.

---

## 15. Performance and scalability

V1 should optimize predictability and user experience first, without anticipating scale that hasn't been observed yet.

Priorities:

- server-side pagination and filtering;
- indexes on `organizationId`, relations and search fields;
- avoid loading every client/project in dashboards;
- aggregate queries for reports;
- caching only for data that can be invalidated correctly;
- async generation of large reports;
- payload and file size limits;
- monitoring of slow queries;
- avoid N+1 in lists and dashboards.

Organization isolation should be efficient, but must not depend on a single filter forgotten on each page. Create reusable query functions and policies.

---

## 16. Technical evolution plan

The sequence below organizes dependencies. It doesn't replace the product roadmap and must be kept in sync with `docs/ROADMAP.md`.

### Phase A — Confirm and protect the base

**Goal:** reduce MVP risks before expanding features. **Status:** done (Phase 0, `docs/PHASE-0-AUDIT.md`).

- revalidate the historical SEC, DATA, LGPD and DEPLOY findings;
- fix entry authorization and provisioning;
- validate redirects and mutation origin;
- add rate limiting to public routes;
- configure headers and indexing/referrer policy;
- validate environment variables;
- fix submission atomicity;
- validate answers by type and options;
- introduce CI and essential integration tests;
- validate PDF generation in the deploy environment.

**Output:** a reliable base to start supporting teams and real data.

### Phase B — Multi-organization and collaboration foundations

**Goal:** move from the single-administrator model to organization and team.

- create/normalize Organization and Membership;
- add `organizationId` to organizational entities;
- define the roles and permissions matrix;
- create central authorization policies;
- include Project and ProjectMember;
- migrate existing clients and briefings into an initial organization;
- test isolation between organizations;
- introduce an audit trail for access changes.

**Output:** organization, members, clients and projects with secure scope.

### Phase C — Versioned briefing and diagnosis

**Goal:** guarantee reproducibility and preserve history.

- version the catalog and questions;
- associate the briefing with a catalog version;
- freeze a snapshot on submission;
- version diagnosis rules;
- persist the origin and explanation of results;
- create a review/approval flow;
- allow reprocessing without silent overwrites.

**Output:** a traceable, reliable diagnosis.

### Phase D — Recommendations and strategic planning

**Goal:** turn the diagnosis into work decisions.

- persist recommendations and their origins;
- implement human review;
- define and implement the approved-priority policy;
- record priority changes;
- create the strategic plan, objectives and actions;
- implement assisted conversion;
- create history of objectives and decisions.

**Output:** the team can go from diagnosis to a reviewed plan.

### Phase E — Execution and tracking

**Goal:** track the work and the results.

- create tasks and assignments;
- comments and mentions;
- internal notifications;
- indicators, targets and measurements;
- evidence;
- results validation;
- impact review and adjustments;
- justified archiving of cancelled/replaced objectives.

**Output:** execution and results are connected, without confusing activity with impact.

### Phase F — Reports, documents and mature operations

**Goal:** communicate results and sustain continuous use.

- contextual history and documents;
- role-based dashboards;
- operational and strategic reports;
- external sharing with scope, expiration and revocation;
- deploy-compatible PDF/exports;
- tested backups and restore;
- observability and runbooks;
- continuous improvement based on usage and feedback.

**Output:** the strategic cycle can be closed, communicated and reused.

---

## 17. Pending architectural decisions

These decisions need to be settled before certain implementations. They must not be resolved for technical convenience without product validation.

| Decision | Why it matters | Dependency |
|---|---|---|
| Detailed permission matrix | Defines application and database policies | Identity & Access |
| Project access scope: individual, team or both | Defines queries and sharing | Project Management |
| Priority formula, weights and scales | Defines reproducible calculation | Recommendations |
| Recommendation versioning and deduplication | Avoids duplicates and conflicts across diagnoses | Recommendations |
| Indicator types, units and validation | Defines schema and measurements | Measurement |
| Measurement validation and owners | Defines results authorization | Measurement |
| External report sharing | Defines token, expiration, scope and authentication | Reporting |
| Template inheritance and duplication | Defines how changes affect new projects | Templates |
| Project recurrence | Defines automatic generation or confirmation | Projects |
| Notification events and preferences | Defines channels and operational noise | Notifications |
| Archiving and deletion policy | Affects integrity, LGPD and reports | Cross-cutting |
| RPO/RTO and backup retention | Defines cost and operations | Infrastructure |

---

## 18. Architectural acceptance criteria

A feature must not be considered done just because the screen works. For flows that change data, check:

- [ ] business rule documented;
- [ ] authentication and authorization on the server;
- [ ] organization scope validated;
- [ ] input validated at the application boundary;
- [ ] transaction and concurrency assessed;
- [ ] history/auditing when the change is strategic;
- [ ] predictable error handling;
- [ ] domain and application tests;
- [ ] isolation tests when there's multi-tenant data;
- [ ] accessibility and loading/error states;
- [ ] logs without unnecessary personal data;
- [ ] migration and rollback assessed;
- [ ] documentation updated.

---

## 19. Technical readiness checklist

### Security and isolation
- [ ] User onboarding authorized by invitation or explicit policy.
- [ ] Centralized roles and permissions.
- [ ] Every query/mutation scoped to the correct organization.
- [ ] Project access validated according to participation and role.
- [x] CSRF/origin check and rate limiting implemented.
- [ ] Public and shared links expiring and revocable.
- [ ] Private files protected by authorization and temporary URLs.
- [x] Headers, `noindex` and referrer policy reviewed.

### Integrity and history
- [x] Atomic briefing submission.
- [ ] Catalog and rules versioned.
- [x] Answers validated semantically.
- [ ] Diagnoses reprocessable without erasing history.
- [ ] Recommendations with origin and priority history.
- [ ] Objectives, targets and measurements with history.
- [ ] Project closing with a results review.

### Operations and quality
- [x] CI runs lint, typecheck, tests and build.
- [x] Integration tests with PostgreSQL.
- [ ] E2E covers the main journey.
- [x] Structured logs and redaction.
- [ ] Error tracking and health check.
- [ ] Backups and restore tested.
- [ ] PDF and exports validated in the real environment.
- [ ] Runbooks for incidents and recovery.

### Privacy
- [ ] Privacy notice and legal basis reviewed.
- [ ] Retention defined per data category.
- [ ] Export, correction and deletion/anonymization supported.
- [ ] Sub-processors documented.
- [ ] Access to answers and documents restricted by need.

---

## 20. Relationship with the other documents

| Document | Responsibility |
|---|---|
| `PRODUCT.md` | Product vision, users, problem, principles, boundaries and direction |
| `docs/REQUIREMENTS.md` | Functional and non-functional requirements, actors, rules and acceptance criteria |
| `docs/ARCHITECTURE.md` | Observed technical state, target architecture, risks and evolution strategy |
| `docs/ROADMAP.md` | Delivery sequencing, priorities and tracking |

When there's a conflict:
1. approved requirements and product decisions define the expected behavior;
2. this document defines how to organize that behavior technically;
3. the roadmap defines when each part will be delivered;
4. the code must reflect approved decisions, and documents must be updated along with relevant changes.

---

## 21. Next recommended activity

Before starting a large refactor, perform a **confirmation audit of the current repository** focusing on:

1. current Prisma schema and migrations;
2. authentication, session, provisioning and authorization;
3. client and briefing routes;
4. answer persistence, submission and reprocessing;
5. tests and pipeline;
6. deploy, PDF, storage and environment variables.

The result must classify each finding as `confirmed`, `fixed`, `not reproduced` or `superseded by a new decision`. Only then turn the open items into technical tasks.

> **Update:** this audit was done (`docs/PHASE-0-AUDIT.md`) and Phase A/Phase 0 is complete. Next: Phase B, which depends on the permission matrix.

**Recommendation:** don't start implementing all modules simultaneously. First consolidate organization isolation, permissions and briefing integrity; then evolve into recommendations, planning, execution and measurement.
