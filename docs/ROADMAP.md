# Briefing Inteligente — Product Roadmap and Technical Evolution

> **Version:** 2.0  
> **Date:** 2026-11-13  
> **Status:** evolution proposal aligned with the platform's vision and requirements  
> **Reference documents:** `PRODUCT.md`, `docs/REQUIREMENTS.md` v2.0 and `docs/ARCHITECTURE.md` v2.0  
> **Planning principle:** prioritize dependencies, risks and delivered value; calendar estimates should only be set after confirming capacity and the real state of the repository.

---

## 1. Executive summary

Briefing Inteligente is evolving from an MVP centered on forms, answers and diagnosis into a **strategic marketing management platform for teams**.

The briefing remains the entry point. The product's value now lies in the complete journey:

**Organization → Client → Project/Campaign → Briefing → Diagnosis → Recommendations → Objectives → Actions and tasks → Indicators → Results → Reports and learning.**

The roadmap therefore needs to stop treating multi-user support, planning and execution as a distant expansion and instead organize them as parts of the target product. At the same time, building everything at once isn't feasible. Evolution will be incremental, with vertical deliveries and clear exit criteria.

### 1.1 Evolution strategy

1. Confirm the real state of the code and protect the MVP.
2. Build the foundations of organization, members, permissions and projects.
3. Make briefing and diagnosis versioned and traceable.
4. Turn diagnosis into reviewable recommendations.
5. Enable planning, execution and results tracking.
6. Consolidate reports, documents, privacy and operations.
7. Improve continuously with usage data and team feedback.

### 1.2 What this roadmap does not assume

- It doesn't assume the findings of the 2026-11-12 inspection are still present.
- It doesn't assume the modules described in the target architecture already exist.
- It doesn't define prioritization weights, the final permission matrix or policies still pending decision.
- It doesn't turn old week estimates into deadline commitments.
- It doesn't include generative AI, external integrations or microservices as V1 dependencies.

---

## 2. Product direction and expected outcome

### 2.1 The outcome we want to deliver

A marketing team should be able to:

- organize clients and projects in a shared workspace;
- gather strategic information through adaptive briefings;
- analyze answers with a deterministic, explainable diagnosis;
- review recommendations, priorities and decisions;
- turn recommendations into objectives, actions and tasks;
- track owners, deadlines, indicators and evidence;
- evaluate results and communicate the work to the client;
- consult history to learn from previous projects.

The product should support the team's reasoning and collaboration, without replacing professional judgment with opaque automation.

### 2.2 North-star metric

**Projects with a tracked and reviewed strategic cycle.**

A project counts as tracked when it has:
1. a recorded briefing or strategic context;
2. a reviewed diagnosis when applicable;
3. defined objectives and actions;
4. at least one execution or indicator update;
5. a results review at a relevant milestone or at closing.

This metric represents the platform's proposition better than counting completed briefings alone. Auxiliary metrics should measure adoption, quality and flow health.

### 2.3 Auxiliary metrics

| Dimension | Indicators |
|---|---|
| Activation | Organizations set up, active members, clients and projects created |
| Briefing | Start/completion rate, abandonment per step, completion time, autosave failures |
| Diagnosis | Diagnoses reviewed, time to review, recommendations accepted/adjusted/discarded |
| Planning | Projects with objectives, objectives with metrics and defined owners |
| Execution | Actions and tasks updated, overdue tasks, member participation |
| Results | Indicators updated, targets evaluated, objectives achieved/partially achieved/not achieved |
| Communication | Reports generated/shared, final reviews completed |
| Trust | Authorization errors, persistence failures, incidents, team satisfaction |

Numeric targets should be set after instrumenting the product and establishing a baseline. Don't adopt arbitrary targets before having data.

---

## 3. Prioritization principles

### 3.1 Decision order

When deciding what comes first, consider in this order:

1. **Security and integrity:** risk of improper access, data loss or corruption.
2. **Structural dependencies:** capabilities needed by more than one module.
3. **Main journey:** features that allow completing a value step.
4. **Usability and adoption:** reduce friction for the team and the client.
5. **Scale and optimization:** only when usage and evidence justify it.

### 3.2 Priority classes

| Class | Meaning |
|---|---|
| **P0 — Blocker** | Critical security risk, data loss or inability to operate |
| **P1 — Essential** | Required for the V1 journey or to meet a mandatory requirement |
| **P2 — Important** | Improves adoption, efficiency, governance or quality |
| **P3 — Evolutionary** | Refinement or capability that can wait for evidence of use |

The classification should be applied to items after the repository audit. The roadmap indicates sequence and dependencies; it doesn't replace the evaluation of each task.

### 3.3 Criteria for ordering items within the same class

- How many flows and modules does it unlock?
- Does it reduce risk or rework?
- Is it a prerequisite for a data migration?
- Does it deliver end-to-end usable value?
- Can it be validated with a real team?
- Is the cost of postponing higher than the cost of implementing now?

---

## 4. Current state: baseline to confirm

The 2026-11-12 technical inspection recorded an MVP with a pure domain core, public form, autosave, deterministic diagnosis, opaque token, admin panel and unit tests. It also pointed out risks in authentication, transactional submission, versioning, validation, observability, privacy and deploy.

These data are a historical snapshot. The roadmap's first activity is to revalidate them in the repository.

> **Update:** the confirmation audit was done on 2026-11-12 (`docs/PHASE-0-AUDIT.md`) and Phase 0 was merged into `main`.

### 4.1 Confirmation audit

| Area | What to check | Expected result |
|---|---|---|
| Repository | Branch, commit, local changes, current structure | Reproducible baseline |
| Database | Prisma schema, migrations, constraints and indexes | Current model documented |
| Authentication | Signup, session, provisioning and redirects | Known entry flow |
| Authorization | Protection of pages, routes, queries and mutations | Gap matrix |
| Briefing | Autosave, submission, status, token and concurrency | Invariants confirmed |
| Diagnosis | Rules, persistence, ordering and reprocessing | Reproducibility verified |
| Tests | Unit, integration, API, E2E and CI | Real coverage known |
| Operations | Deploy, PDF, storage, logs, backups and env | Environment limitations known |
| Privacy | Data collected, logs, retention and deletion | Initial data map |

Classify each finding as `confirmed`, `fixed`, `not reproduced`, `partial` or `superseded by a new decision`.

### 4.2 Backlog conversion rule

No historical finding should automatically become a task. First:
1. reproduce or locate the condition in the code;
2. identify the affected data and flows;
3. define the fix and acceptance criteria;
4. assess migration and compatibility;
5. write tests;
6. update documentation if the architectural decision changes.

---

## 5. Workstreams

Workstreams are continuous lines of work. Each phase may involve more than one of them.

| Workstream | Scope |
|---|---|
| **A. Foundations and architecture** | Pragmatic modularization, use cases, contracts, configuration and migrations |
| **B. Security and governance** | Authentication, authorization, tenant isolation, auditing and privacy |
| **C. Clients and projects** | Organizational structure, history, owners and collaboration |
| **D. Briefing and diagnosis** | Forms, versions, answers, rules and review |
| **E. Strategy and recommendations** | Suggestions, prioritization, approval and conversion into a plan |
| **F. Planning and execution** | Objectives, actions, tasks, owners, comments and notifications |
| **G. Measurement and results** | Indicators, targets, measurements, evidence and impact evaluation |
| **H. Experience and design** | Information architecture, accessibility, content and design system |
| **I. Quality and operations** | Tests, CI, observability, backups, deploy and support |
| **J. Reports and documents** | History, files, internal reports and external sharing |

---

## 6. Roadmap by phase

Phases are capability milestones. They can be split into smaller sprints. There's no fixed duration until the team's capacity and the state of the code are known.

### Phase 0 — Audit, stabilization and MVP protection

<badge color="danger">P0</badge> **Goal:** confirm what exists and remove risks that prevent evolving safely.

**Deliverables**

- Confirmation audit of the repository, schema, migrations and deploy.
- Fix critical authentication and provisioning flaws, if confirmed.
- Server-side authorization for all existing routes and mutations.
- Origin/CSRF protection appropriate to the session model.
- Rate limiting on sensitive public routes.
- Security headers, referrer policy and `noindex` on private surfaces.
- Validation of environment variables and configuration with explicit failure.
- Semantic validation of briefing answers.
- Atomic submission with consistent state transitions.
- Coordination between autosave and submission.
- Logs without tokens, free-text answers or unnecessary PII.
- Minimum CI with lint, typecheck, tests and build.
- PDF verified in the real deploy environment.

**Exit criteria**

- Historical findings classified and backlog updated.
- No unauthorized account obtains administrative access.
- Existing queries and mutations require appropriate authentication/authorization.
- Submission doesn't leave a briefing in a partial state.
- Invalid answers are rejected before affecting the diagnosis.
- CI blocks basic regressions.
- Deploy, PDF and storage limitations are documented.

**Don't do in this phase:** build new strategic modules before stabilizing existing flows and data.

---

### Phase 1 — Organization and collaboration foundations

<badge color="warning">P1</badge> **Goal:** turn the single-administrator model into a team workspace.

**Deliverables**

- Organization entity and user association through Membership.
- Centralized roles and permissions model.
- Invitations and controlled member onboarding.
- Per-organization data isolation from queries and mutations.
- RLS strategy, if adopted, aligned with the membership model.
- Client associated with the organization.
- Project/Campaign as the unit of work.
- Main owner and collaborators per project.
- Project statuses and basic history.
- Migration of existing data into an initial organization.
- Negative tests for cross-access between organizations and projects.
- Auditing of changes to members, roles and permissions.

**Exit criteria**

- An organization can invite and manage members according to the approved matrix.
- Clients and projects belong to an organization.
- Projects have an owner and collaborators.
- Users don't access another organization's data.
- Project access respects role and participation.
- MVP data is migrated without loss and with integrity.

**Dependencies:** permission matrix, project access scope and migration policy.

**EP-04 plan** (decisions D8–D13). One PR per story, each from an up-to-date `main`:

| Story | Delivers |
|---|---|
| EP-04.1 Schema and migration | `Organization`, `Membership` (one role; active/deactivated), `Invitation`, `AuditEvent`; backfill creates the initial organization and makes every existing user its administrator. `db:seed:admin` creates or restores the administrator's membership. |
| EP-04.2 Organization-aware session | `SessionUser` carries `organizationId` and `role`; no or deactivated membership means no access on the next request. |
| EP-04.3 Central policies | Pure policy functions for the §2.3 matrix, applied to the existing client routes before anyone can be invited. |
| EP-04.4 Invitations | Create, revoke and accept invitation links (D12); rate limit and origin check on acceptance. |
| EP-04.5 Members screen | List members and pending invitations; change role; deactivate/reactivate; the organization always keeps one active administrator. |
| EP-04.6 Audit | `AuditEvent` written in the same transaction for every invitation, role and status change. Reading the log is backlog. |
| EP-04.7 Docs | Retire D3, update ARCHITECTURE and README. |

Client and project ownership (EP-05) and `organizationId` scoping of every query (EP-06) stay out of EP-04.

---

### Phase 2 — Versioned briefing and diagnosis

<badge color="warning">P1</badge> **Goal:** preserve the origin and reproducibility of strategic information.

**Deliverables**

- Briefings linked to projects.
- Support for more than one briefing over a project's lifetime.
- Versioned question catalog.
- Questions and rules published as immutable versions.
- Snapshot of answers on submission.
- Catalog and rules version associated with each diagnosis.
- History of submission, revocation, reopening and reprocessing.
- Deterministic diagnosis with explanation and signal origin.
- Human review and approval of the diagnosis.
- Reprocessing creates a new run, without overwriting an approved diagnosis.
- Public form with secure link, autosave, resume and review.
- Compatibility tests with old briefings.

**Exit criteria**

- A catalog change doesn't alter historical answers.
- Each diagnosis states which answers and versions contributed to the result.
- Reprocessing is traceable and reproducible.
- A submitted briefing doesn't accept improper autosave.
- Review and approval are recorded.
- The client can fill in the form without creating an internal account.

**Dependencies:** Phase 0; organization and project from Phase 1.

---

### Phase 3 — Recommendations and strategic prioritization

<badge color="warning">P1</badge> **Goal:** turn the diagnosis into strategic decisions the team can review.

**Deliverables**

- Persisted Recommendation entity.
- Recommendations contextualized by signals, categories and answer combinations.
- Record of the rule and version that originated each recommendation.
- Grouping by category and strategic objective.
- Review states: suggested, under review, approved, adjusted, discarded or replaced, per product decision.
- Priority calculated with explicit factors.
- Approved priority kept separate from calculated priority.
- Justification, author, date and change history.
- Suggestion of owners and next steps without creating commitments automatically.
- Handling of duplicates, conflicts and recommendations from successive diagnoses.

**Exit criteria**

- Every recommendation is explainable and traceable.
- The team can accept, edit or discard recommendations according to permission.
- Priority changes preserve the original calculation and justification.
- Recommendations don't become tasks without human confirmation.
- Deduplication and update rules are documented.

**Dependencies:** versioned diagnosis; approved prioritization formula and policy.

---

### Phase 4 — Strategic planning and execution

<badge color="warning">P1</badge> **Goal:** turn approved decisions into organized, trackable work.

**Deliverables**

- One main strategic plan per project and support for complementary plans.
- Objectives with description, owner, period and status.
- Actions linked to objectives.
- Assisted conversion of recommendations into objectives, actions and tasks.
- Human review before confirming the conversion.
- Tasks with owners, collaborators, priority, deadline and status.
- Internal comments, mentions and change history.
- Views by project, objective, owner and status.
- Archiving of cancelled/replaced objectives with a reason.
- Visual and conceptual distinction between a completed task and an achieved objective.

**Exit criteria**

- The team can create a plan from reviewed recommendations.
- Each objective has an owner and a status.
- Actions and tasks keep a traceable relationship with objectives.
- Relevant changes are kept in the history.
- Completing a task doesn't automatically change the objective's result.
- Permissions apply to creation, editing, approval and archiving.

**Dependencies:** Phases 1 and 3; role and approval decisions.

---

### Phase 5 — Indicators, evidence and impact evaluation

<badge color="warning">P1</badge> **Goal:** track whether the work is producing the expected results.

**Deliverables**

- Indicator definition with type, unit and update method.
- Targets with period and change history.
- Measurement records with reference period, author and date.
- Measurement validation by an authorized person.
- Evidence attached to measurements and evaluations.
- Comparison between baseline, target and result.
- Quantitative and qualitative impact evaluation.
- Review of objectives and actions when targets aren't met.
- Rule-based adjustment suggestions, subject to human approval.
- Results history per project and objective.

**Exit criteria**

- A measurement keeps unit, period, author and evidence.
- Old targets remain available for comparison.
- The team can evaluate results without relying only on task status.
- Target or objective changes are traceable.
- Adjustment suggestions don't change the plan without approval.

**Dependencies:** Phase 4; decisions on indicator types, validation and target history.

---

### Phase 6 — History, documents, reports and communication

<badge color="warning">P1</badge> **Goal:** give the work context, communicate results and close the project cycle.

**Deliverables**

- Client history with meetings, decisions, notes and activities.
- Documents associated with client and project, with metadata and access control.
- Dashboards by organization, client, project, objective and member.
- Operational, strategic and performance reports.
- Filters by period, client, project and owner.
- Comparisons between target and result.
- Exports and PDFs compatible with the deploy environment.
- Report sharing with explicit scope, expiration and revocation.
- Final report and project closing review.
- Project archiving with results and history preserved.

**Exit criteria**

- Reports respect organization and permissions.
- External links don't expose internal comments or other projects.
- Shares can be revoked and expire according to policy.
- Private documents are accessible only to authorized users.
- A project can be closed with a review and a final report.

**Dependencies:** Phases 1 to 5; decisions on external sharing and retention.

---

### Phase 7 — Templates, notifications and continuous improvement

<badge color="info">P2</badge> **Goal:** reduce repetitive work and make consistent team adoption easier.

**Deliverables**

- Project/campaign templates.
- Briefing, diagnosis and report templates.
- Project duplication with explicit rules about what to copy.
- Configurable recurrence, with confirmation or automatic creation per decision.
- Configurable fields, categories and statuses within defined limits.
- Internal notifications for relevant events.
- Notification preferences per user.
- Activity and pending-items dashboards.
- Feedback collection and usage analysis.
- UX experiments and evidence-based improvements.

**Exit criteria**

- Duplicating a project doesn't mix historical data or owners improperly.
- Templates have versions and an update policy.
- Notifications are configurable and don't create excessive noise.
- Recurrence behaves predictably and auditably.
- Product improvements are prioritized with usage data and feedback.

**Dependencies:** stable main flows; decisions on templates, recurrence and notifications.

---

### Phase 8 — Integrations and advanced capabilities (post-V1)

<badge color="secondary">P3</badge> **Goal:** expand the ecosystem only when there is proven demand.

Possible evolutions:

- Integration with Drive and external storage.
- Calendars and communication tools.
- CRM and automation platforms.
- Ad and analytics platforms.
- Webhooks and a public API.
- Assistive AI for interpreting and drafting recommendations, always with human review.
- Aggregated benchmarking, only with legal basis, privacy and sufficient volume.
- Service separation or additional infrastructure when operational metrics justify it.

**Entry criterion:** validated use case, recurring demand, assessed risk, known maintenance cost and benefit greater than the added complexity.

---

## 7. Backlog structured by epics

The epics below are planning units. Technical tasks should be created after the audit and refined into smaller stories.

| ID | Epic | Outcome | Phase |
|---|---|---|---:|
| EP-00 | Baseline and audit | Real state of the repository and risks confirmed | 0 |
| EP-01 | MVP security | Existing flows protected | 0 |
| EP-02 | Briefing integrity | Consistent submission and answers | 0 |
| EP-03 | Minimum quality and operations | CI, tests and verifiable deploy | 0 |
| EP-04 | Organization and members | Workspace with members and roles | 1 |
| EP-05 | Clients and projects | Work structure by client/campaign | 1 |
| EP-06 | Isolation and authorization | Access by organization and project | 1 |
| EP-07 | Versioned catalog | Reproducible historical forms | 2 |
| EP-08 | Versioned diagnosis | Explainable, reprocessable result | 2 |
| EP-09 | Briefing review | Approval and history | 2 |
| EP-10 | Recommendations | Persisted, traceable suggestions | 3 |
| EP-11 | Prioritization | Justified priority decisions | 3 |
| EP-12 | Plan and objectives | Strategy structured by project | 4 |
| EP-13 | Actions and tasks | Collaborative execution | 4 |
| EP-14 | Indicators and targets | Structured measurement | 5 |
| EP-15 | Evidence and impact | Results evaluation | 5 |
| EP-16 | History and documents | Continuous client/project context | 6 |
| EP-17 | Reports and closing | Communication and cycle closing | 6 |
| EP-18 | Templates and recurrence | Process reuse | 7 |
| EP-19 | Notifications | Collaboration with relevant alerts | 7 |
| EP-20 | Integrations and assistive AI | Post-V1 expansion | 8 |
| EP-21 | Design system and accessibility | Consistent, accessible interface across every surface (section 9) | Cross-cutting |

---

## 8. Dependencies between phases

```text
Phase 0 — Audit and protection
   ↓
Phase 1 — Organization, permissions, clients and projects
   ↓
Phase 2 — Versioned briefing and diagnosis
   ↓
Phase 3 — Recommendations and prioritization
   ↓
Phase 4 — Planning and execution
   ↓
Phase 5 — Indicators and impact evaluation
   ↓
Phase 6 — Reports, documents and closing
   ↓
Phase 7 — Templates, notifications and continuous improvement
   ↓
Phase 8 — Integrations and advanced capabilities
```

Some activities can happen in parallel:
- design system and accessibility accompany every phase;
- CI, observability and security evolve continuously;
- privacy and LGPD are cross-cutting requirements, not an isolated delivery;
- tests and documentation accompany each module;
- simple operational reports can appear before full strategic reports, as long as they respect permissions and data quality.

---

## 9. Cross-cutting experience and design track

The experience must keep pace with functional growth. Don't leave "polishing" the product for the end.

### 9.1 Foundations

- Define a visual identity consistent with `PRODUCT.md`.
- Formalize semantic tokens for color, typography, spacing, radius and elevation.
- Document components and states.
- Keep the experience responsive and accessible.
- Design empty, loading, error, success and insufficient-permission states.
- Ensure direct, human and non-judgmental language.
- Visually differentiate suggestion, approved decision and observed result.

Tracked as **EP-21**, which runs in parallel with every phase (section 8).

**EP-21 progress**

- Light, dark and system themes with a toggle in the admin area and on the login screen.
- Shared empty-state component used on the client list, the status filter and the client page.
- `brand` button variant built on the semantic `--primary` / `--primary-hover` tokens, used on the main call to action of each screen.

### 9.2 Experience by surface

| Surface | UX priority |
|---|---|
| Public form | Clarity, trust, progress, autosave and resume |
| Team dashboard | Visibility of priorities, pending items and next steps |
| Client | History and context without becoming an overloaded CRM |
| Project | Integrated view of briefing, diagnosis, plan, tasks and results |
| Diagnosis | Explainability, evidence and human review |
| Objectives | Strategic progress distinct from completed tasks |
| Indicators | Simple updates, clear units and comparison with the target |
| Reports | Synthesis, context, transparency and secure sharing |

### 9.3 Accessibility

Adopt WCAG 2.2 AA as the product reference, per `PRODUCT.md`.

Continuous checklist:
- keyboard and visible focus;
- semantic structure and headings;
- labels and instructions;
- contrast;
- screen readers;
- announced status messages;
- zoom and responsive layouts;
- adequate interaction targets;
- respect for reduced motion.

---

## 10. Security, privacy and operations as continuous work

Don't concentrate security and LGPD in a single phase. Each epic should include its cross-cutting requirements.

### Security

- server-side authentication and authorization;
- isolation by organization and project;
- principle of least privilege;
- input validation;
- rate limiting and origin protection;
- secrets management;
- secure, expiring and revocable external links;
- private files;
- auditing of critical actions.

### Privacy

- data minimization;
- privacy notice and appropriate legal basis;
- retention by category;
- access, correction, export and deletion/anonymization where applicable;
- logs without unnecessary personal data;
- sub-processor management;
- documentation of the data lifecycle.

Consent should not be treated as a universal legal basis. The application of each legal basis and the retention periods need validation appropriate to the context.

### Operations

- CI with lint, typecheck, tests and build;
- integration tests with PostgreSQL;
- E2E of the main journey;
- structured logs and request ID;
- error tracking and health checks;
- alerts for important failures;
- automatic backups and restore tests;
- runbooks;
- RPO/RTO defined based on business impact and infrastructure capacity.

---

## 11. Product decisions blocking technical refinement

The decisions below are already identified in the requirements and the architecture. They must be settled before implementing the respective modules.

| Pending decision | Impact | Deadline phase |
|---|---|---:|
| Detailed permission matrix | Access policies and interface | 1 |
| Project access scope: individual, team or both | Queries and authorization | 1 |
| Priority formula, weights and scales | Calculation and history | 3 |
| Recommendation deduplication and versioning | Persistence and updates | 3 |
| Indicator types, units and validation | Schema and measurements | 5 |
| Who validates measurements and under which conditions | Authorization and flow | 5 |
| External report sharing | Token, expiration, scope and authentication | 6 |
| Template inheritance and duplication | Template behavior | 7 |
| Recurrence: automatic creation or confirmation | Jobs and lifecycle | 7 |
| Notification events and preferences | Channels and rules | 7 |
| Archiving and deletion policy | Integrity and privacy | Cross-cutting |
| RPO/RTO and backup retention | Operations and cost | 0–6 |

---

## 12. Definition of Ready

A story is ready for development when:

- [ ] It is linked to a requirement or an observed problem.
- [ ] It has a defined user/actor and context.
- [ ] It has an expected outcome and verifiable acceptance criteria.
- [ ] Product and architecture dependencies are identified.
- [ ] Permission and organization rules were considered.
- [ ] Error, empty and loading states were thought through.
- [ ] Impact on data, migrations and history was assessed.
- [ ] Pending decisions were resolved or explicitly isolated.
- [ ] The scope fits in a reviewable delivery.

---

## 13. Definition of Done

A delivery is only done when:

- [ ] Acceptance criteria were met.
- [ ] Business rules are in the appropriate domain/use case.
- [ ] Authentication, authorization and isolation were tested.
- [ ] Inputs are validated on the server.
- [ ] Transactions and concurrency were assessed.
- [ ] History/auditing was implemented when needed.
- [ ] Automated tests cover the happy path and relevant failures.
- [ ] Lint, typecheck, tests and build pass in CI.
- [ ] The interface is responsive and accessible.
- [ ] Logs don't expose tokens or unnecessary PII.
- [ ] Migration, rollback and compatibility were assessed.
- [ ] Product, requirements, architecture and roadmap documentation was updated.
- [ ] Operational and privacy impact was considered.

---

## 14. Success metrics and roadmap review

Review the roadmap at the end of each phase and whenever there's a significant scope change.

### Review questions

1. Did the phase deliver an end-to-end usable capability?
2. Can the team run the flow without manual workarounds?
3. Did the product become safer and more traceable?
4. Is there evidence of use and value?
5. What should be simplified, postponed or removed?
6. Does any pending decision block the next phase?
7. Does the roadmap still reflect `PRODUCT.md` and `docs/REQUIREMENTS.md`?

### Change rules

- Don't add a feature just because it's technically interesting.
- Don't bring AI or integrations forward without a validated use case.
- Don't expand customization before stabilizing the standard flow.
- Don't sacrifice isolation and integrity to speed up the interface.
- Update this roadmap when a product decision changes sequence, dependency or scope.

---

## 15. Document traceability map

| Document | Responsibility | How it influences the roadmap |
|---|---|---|
| `PRODUCT.md` | Vision, users, problem, principles, boundaries and direction | Defines the outcome the phases must build |
| `docs/REQUIREMENTS.md` | Actors, requirements, rules, data, security and acceptance criteria | Defines behavior and what needs to be validated |
| `docs/ARCHITECTURE.md` | Historical technical state, target architecture, risks and evolution | Defines dependencies and technical approach |
| `docs/ROADMAP.md` | Sequencing and tracking of deliveries | Organizes phases, epics, criteria and decisions |

### Consistency rules

- If the roadmap proposes something that isn't in the product vision, review it before implementing.
- If a requirement changes, assess the impact on phases and dependencies.
- If the architecture changes, update the epics and technical criteria.
- If the code diverges from the documents, record the real state and decide whether the document or the code should change.
- Don't keep old estimates, metrics or decisions as truth without validation.

---

## 16. Next recommended activity

The next activity is not to start every module. It is to execute **Phase 0 — Audit, stabilization and MVP protection**.

> **Update:** Phase 0 was completed and merged into `main` (see `docs/PHASE-0-AUDIT.md`). The next step is **Phase 1**. Its blocking decisions (PD-01, PD-02, PD-13) were settled on 2026-11-13 (D8–D11, `docs/REQUIREMENTS.md` §2.3).

Suggested order:

1. confirm commit, branch and local changes;
2. review the Prisma schema and migrations;
3. audit authentication, authorization and route scope;
4. validate autosave, submission and reprocessing;
5. run the test suite and identify gaps;
6. check CI, deploy, PDF, storage and environment variables;
7. classify findings and turn only confirmed problems into tasks;
8. review the permission matrix needed for Phase 1.

**Final recommendation:** build the platform as complete, connected capabilities. First ensure the team can work safely across organizations, clients and projects; then connect briefing and diagnosis to recommendations, planning, execution and results. This preserves the product's identity and keeps it from becoming a set of screens without a coherent strategic journey.
