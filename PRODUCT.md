# Briefing Inteligente

A strategic marketing management platform for teams. It turns client information into explainable diagnoses, action plans and trackable results — from the briefing to the evaluation of the strategy.

## Register

product

## Users

Marketing teams that serve clients and need to work in a coordinated, standardized and strategy-driven way. This includes administrators responsible for organizing and configuring the workspace, leaders who coordinate teams and projects, and members who carry out activities and track results.

The team's clients take part as external respondents: they receive a secure link, fill in the briefing without creating an account, and may receive shareable reports. They don't need access to the platform's internal environment.

Work is organized as **Organization → Client → Project/Campaign → Briefing**. A client doesn't necessarily belong to a specific team. Each project has one main owner and may have collaborators.

## Problem

Marketing teams often work with information scattered across forms, meetings, messages, documents and task tools. This leads to inconsistent briefings, diagnoses that depend on individual interpretation, untraceable decisions and little continuity between planning and execution.

The problem doesn't end when the briefing is filled in. Without a clear link between answers, diagnosis, recommendations, objectives, tasks and results, the team loses context, repeats alignments and struggles to demonstrate the impact of its work.

## Product Purpose

Briefing Inteligente centralizes the strategic marketing journey. The briefing is the entry point; the platform follows the work from information gathering to the evaluation of results.

The main journey is:

1. **Collect:** create adaptive briefings for each client and project.
2. **Diagnose:** interpret answers through deterministic rules and explainable signals.
3. **Recommend:** produce contextual recommendations, traceable to the answers and rules that originated them.
4. **Prioritize:** organize recommendations by severity, strategic impact, urgency and effort.
5. **Plan:** group recommendations into objectives and action plans.
6. **Execute:** turn actions into tasks with owners, collaborators, deadlines, priorities and statuses.
7. **Evaluate:** track indicators, evidence, results and impact.
8. **Learn:** preserve history and use data and feedback to guide how the work evolves.

### Functional principles

- The first version's diagnosis is deterministic, reproducible and auditable; it doesn't depend on generative AI.
- Recommendations are generated from combinations of answers, signals, categories and predefined rules. The team can edit and customize recommendations without losing their origin.
- Recommendations are organized by diagnosis category, grouped into strategic objectives and ordered by priority.
- The initial priority is calculated from severity, strategic impact, urgency and effort. Members can suggest changes; only authorized people can confirm them, with justification and history.
- Approving recommendations doesn't create commitments automatically. The system suggests objectives, actions, tasks, owners and deadlines; the team reviews and confirms the conversion.
- Each project has one main strategic plan, split into objectives. The team can also create complementary plans linked to the project.
- Operational progress (completed tasks) must be distinguished from strategic results (targets and indicators achieved).
- Any authorized project member can record results and evidence; designated owners validate the records.
- Indicator tracking can be configured individually. The team can update indicators whenever needed, with no mandatory frequency imposed by the product.
- Objectives that aren't met can be revised. The system may suggest adjustments based on rules, but strategic changes require human approval.
- Cancelled or replaced objectives remain in the history, with reason, owner and impact recorded.
- Closing a project includes a strategic review, results, approval and a final report.

### Organization and collaboration

The platform starts out prepared for one organization, but its architecture must allow multiple independent organizations in the future. The organization is the data isolation boundary.

The collaboration model is hybrid: members share visibility according to their access scope, while actions and approvals depend on permissions. There are default roles of administrator, leader and member; exact permissions and roles must be detailed in the requirements document.

Dashboards adapt to the role:
- **Administrator:** overview of the organization, teams, clients, projects and operations.
- **Leader:** view of the projects and team under their responsibility.
- **Member:** projects, tasks and activities they take part in.

### Contextual client management

The platform keeps a history of meetings, notes, interactions, decisions and documents, plus a view of the projects and results associated with the client. It doesn't aim to replace a full CRM.

Documents are associated with the client or project context and have a category, description, file, author and date. The platform allows viewing and downloading files, without aiming to be a full document management system.

### Reports and sharing

The platform offers operational, strategic and performance reports, with filters by period, client, project and member, plus charts, tables, comparisons and exports.

Clients don't access the internal environment. The first version allows sharing reports with them. The scope of information shown, validity and revocation of shares must be defined in the requirements.

### Success indicators

The north-star metric must reflect strategic value delivered, not just activity volume. Track, among others:
- projects with a reviewed diagnosis and a validated strategic plan;
- objectives with updated indicators and results;
- progress between targets and results;
- approved recommendations that moved into execution;
- the team's perception of how useful diagnoses and recommendations are;
- briefing completion and abandonment;
- quality, reliability and use of reports.

Quantitative targets must be calibrated with real data after rollout, avoiding volume or productivity targets without a baseline.

## Brand Personality

Clear, strategic, trustworthy and collaborative. The platform should convey organization and security without feeling bureaucratic, punitive or overly corporate.

### Tone

All user-facing text is written in **Brazilian Portuguese (pt-BR)**, in direct, human and professional language. Explain strategic terms when needed. Prefer actionable instructions over vague messages. The diagnosis should point out opportunities and risks without judging the client or treating a score as absolute truth.

Error messages must explain what happened and how to fix it. Empty states must guide the next step. The interface must clearly distinguish automatic suggestions, human decisions, tasks in progress and confirmed results.

## Anti-references

- MUST NOT look like just a form builder or an isolated diagnosis tool.
- MUST NOT turn into a generic CRM or a task manager without strategic context.
- MUST NOT present automatic recommendations as unquestionable truths or final decisions.
- MUST NOT confuse completed tasks with achieved objectives or proven impact.
- MUST NOT classify clients or businesses pejoratively, or present categories without data as negative results.
- MUST NOT use generative AI as an autonomous authority for diagnosis, approval or strategic decisions in the first version.
- MUST NOT expose one organization's data to another, or internal information in public links or shared reports without authorization.
- MUST NOT encourage unproductive competition between members based on raw task counts.
- MUST NOT depend on a desktop-only interface or hide important states in ambiguous visual elements.

## Design Principles

1. **Strategy before activity.** Every recommendation, objective and task must stay linked to the diagnosis and to the result it aims to produce.
2. **Humans in control.** The system organizes evidence and suggests paths; authorized people review, decide and approve.
3. **Explainable by default.** Diagnoses, priorities and recommendations must show where they came from and which rules or evidence support them.
4. **Continuity of context.** Briefing information, decisions, documents, plans and results must stay connected to the client and the project.
5. **Collaboration with accountability.** Shared visibility doesn't remove permissions, assignments, approvals or audit trails.
6. **Progressive simplicity.** The first version covers the full strategic journey, but each module starts with the minimum set of capabilities needed.
7. **Customization within clear limits.** Teams can adapt fields, statuses, categories, briefing templates, diagnosis and reports without compromising data integrity, security or consistency.
8. **Preserved history.** Relevant changes, approvals, cancellations, results and reprocessing must be traceable.
9. **Operational reliability.** Data integrity, backups, recovery, monitoring and security are product requirements, not cosmetic improvements.
10. **Metrics with context.** Performance indicators must consider results, quality and context, not just the number of deliverables.

## Accessibility & Inclusion

- MUST work on mobile and desktop devices, with a responsive experience.
- MUST offer keyboard navigation, visible focus, programmatic labels and semantic structure.
- MUST keep adequate contrast and not rely solely on color to communicate status, priority or diagnosis.
- MUST allow text zoom and respect reduced-motion preferences.
- MUST present messages, validations and save states in a perceivable and understandable way.
- MUST use simple, inclusive and non-stigmatizing language.
- SHOULD follow WCAG 2.2 level AA as the quality and validation reference.

## Offer

At this stage, Briefing Inteligente is a platform for internal use by marketing teams. There's no public price, commercial plan or billing model defined. The priority is to validate the workflow and the product's strategic usefulness before establishing a commercial offer.

## Boundaries

- The first version is not a full CRM, a marketing automation platform, a generic project manager or a standalone form builder.
- The first version doesn't use generative AI as the core of the diagnosis, nor does it execute strategic decisions without human validation.
- Clients answer briefings through external links and may receive shareable reports; they have no general access to the internal environment in V1.
- The first version starts with one organization but must be built with per-organization data isolation from the start.
- The platform starts standalone. Integrations with Drive, calendar, communication, CRM, project management and marketing platforms are future possibilities, not dependencies of the core flow.
- Native mobile app, white-label, billing and public organization sign-up are not part of the first version.
- V1 delivers the complete core journey — briefing, diagnosis, recommendations, planning, execution and evaluation — with controlled initial depth in each module.
- Implementation details, API contracts, acceptance criteria, physical data model and infrastructure decisions belong in the related technical documents, not in this file.

## Stack

This file defines the product's identity, audience, purpose, principles and boundaries. It doesn't replace implementation documentation.

- `README.md` — technical overview and instructions to run the project.
- `AGENTS.md` — conventions and instructions for development agents (details in `docs/guidelines/`).
- `docs/REQUIREMENTS.md` — functional and non-functional requirements, permissions, flows, acceptance criteria and contracts.
- `docs/ARCHITECTURE.md` — technical state, architecture, security, integrity, risks and architectural decisions.
- `docs/ROADMAP.md` — implementation sequence, priorities, phases and definition of done.
- `docs/DECISIONS.md` — decisions made during development.
- `DESIGN.md` — tokens, components, visual patterns and interface behavior, once created.
- `AUTH.md` — detailed authentication, authorization and access model, once created.
