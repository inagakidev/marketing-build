# Decision log

Product and architecture decisions made during development. Format: date, context, decision, alternatives considered, impact.

---

## 2026-11-12 — Decisions to execute Phase 0

Context: confirmation audit (`docs/PHASE-0-AUDIT.md`, §5).

| ID | Decision | Alternatives considered | Impact |
|---|---|---|---|
| D1 | Production runs on **Vercel serverless**. | Container/VPS | PDF needs a serverless-compatible Chromium (DEPLOY-01); in-memory state is not shared across instances. |
| D2 | Rate limiting with a **PostgreSQL table**, no new dependency. | Upstash/Redis; local memory | One write per rate-limited request; fixed window per key; periodic cleanup of old rows. |
| D3 | **Interim access:** only people who already exist in the `users` table (created by seed or an admin action) can sign in. Unknown Supabase accounts are rejected. Valid until Phase 1 invitations. | Email allowlist in an environment variable | Closes SEC-01 without bringing organization/members forward. |
| D4 | Deleting a client **remains a cascading hard delete** until PD-12 is decided. | Soft delete (archiving) | NEW-04 stays recorded as a conflict with the preserved-history principle; revisit in PD-12. |
| D5 | `main` branch created from `front`; epics are developed in their own branches and integrated through PRs. | Keep working only on `front` | `main` becomes the base for PRs. |

## 2026-11-13 — PDF on serverless (DEPLOY-01)

| ID | Decision | Alternatives considered | Impact |
|---|---|---|---|
| D6 | PDF generated with **`playwright-core` + `@sparticuz/chromium`**, versions pinned as a pair (1.63.0 ↔ Chromium 153; `@sparticuz/chromium` 153.0.0). Local/container keeps using Playwright's Chromium. | Browser printing (`window.print()`); external rendering service | Two production dependencies; the PDF function needs ~1.6 GB of memory; 1–2 s cold start; upgrading one version requires upgrading the other. |

## 2026-11-13 — Language and naming

| ID | Decision | Alternatives considered | Impact |
|---|---|---|---|
| D7 | **Everything in English** (code, comments, documentation, commits, PRs, branches) **except user-facing text, which stays in pt-BR**. Documentation files in English UPPERCASE without numeric prefixes; variables, functions and code files in camelCase. Details in `docs/guidelines/CODE-AND-UI.md`. | Keep documentation in pt-BR | Existing docs translated and renamed (`docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/PHASE-0-AUDIT.md`); code comments translated in a follow-up PR. |

## 2026-11-13 — Permission matrix for Phase 1 (PD-01, PD-02, PD-13)

Context: Phase 1 (EP-04 to EP-06) was blocked on these decisions (`docs/ROADMAP.md`, §16).

| ID | Decision | Alternatives considered | Impact |
|---|---|---|---|
| D8 | **PD-01:** the Phase 1 matrix in `docs/REQUIREMENTS.md` §2.3. Actions from later phases are added when each phase is refined. | Define the full matrix for every phase now | Policies such as `canManageProject` are implemented and tested against §2.3; later phases extend the matrix instead of reopening it. |
| D9 | **PD-02:** each member has **exactly one role** per organization. AUTH-10 (multiple roles) is deferred. | Multiple roles with permissions summed; multiple roles with explicit denies winning | `Membership` stores a single role; no combination rule to implement or test. Adding multiple roles later requires a new decision. |
| D10 | **PD-13:** project access is by **individual assignment** (main owner and collaborators, `ProjectMember`). | Access by team; team and individual combined | No `Team` entity in Phase 1. A team can be added later as an invitation shortcut without changing the access rule. |
| D11 | **Leaders** see every project and client in the organization; **only administrators** invite, deactivate or change the role of members. | Leaders see only their projects; leaders invite members or leaders | Least privilege for membership changes; leaders can coordinate and distribute work across the organization. Inviting can be opened to leaders later through AUTH-05. |

## 2026-11-13 — Member onboarding for EP-04

Context: planning EP-04 (organization and members). These choices aren't listed PDs, but they shape the session and invitation stories.

| ID | Decision | Alternatives considered | Impact |
|---|---|---|---|
| D12 | Invitations are delivered as a **link the administrator copies and sends**, like the briefing link (BRF-05). The token is opaque, stored only as a hash, single-use and valid for 7 days. Accepting it creates the Supabase account server-side and the membership in one transaction. Replaces the interim access rule D3. | Supabase `inviteUserByEmail` (needs custom SMTP in production) | No email provider or new dependency. Holding the link is the authorization, so the accept route is rate-limited and the link can be revoked. |
| D13 | In V1 a person belongs to **one organization**. The schema supports many (ORG-02), but the session uses the single active membership and an invitation for someone already in another organization is refused. | Several organizations with a selector in the panel | No organization switcher in EP-04; it becomes a backlog item if a real case appears. |

## 2026-11-13 — Design System v2 (EP-21)

| ID | Decision | Alternatives considered | Impact |
|---|---|---|---|
| D14 | Adopt the **Design System v2** canvas as the visual source (`DESIGN.md`). Tokens are migrated in one delivery before new screens, so the whole app changes at once. Primary is black; orange is a single accent per screen. | Apply it only to new screens; migrate together with EP-04.5 | Every screen changes look in one PR; the members screen (EP-04.5) is built directly on v2. |
| D15 | The DS v2 defines only a light palette, so the **dark theme is derived** from the same warm family with AA contrasts. It's a proposal to validate on the canvas. | Light only, removing the theme toggle; keep the old dark tokens | The theme toggle stays; dark values can change without touching screens. |

