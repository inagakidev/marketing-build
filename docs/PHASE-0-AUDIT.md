# Briefing Inteligente — Confirmation Audit (Phase 0 / EP-00)

> **Date:** 2026-11-12  
> **Audited base:** branch `front`, commit `5f27745` + v2.0 documentation (`a2d8607`)  
> **References:** `docs/ARCHITECTURE.md` §3.2, `docs/ROADMAP.md` §4 and §16  
> **Status:** reviewed. Decisions D1–D5 recorded in `docs/DECISIONS.md` (2026-11-12). Phase 0 merged into `main` (PR #6).

Classification used: `confirmed`, `fixed`, `not reproduced`, `partial`, `superseded by a new decision`.

---

## 1. Baseline

| Item | Result |
|---|---|
| Branches | Only `front` exists (local and `origin`). **No `main`.** |
| Local state | Clean before the audit |
| Schema | 1 migration (`20260907161804_init`); models `User`, `Client`, `Briefing`, `Question`, `Answer`, `Signal`, `Diagnosis` |
| Ownership model | `Client.userId` → isolation per user, no organization or project |
| `npm run lint` | ✅ passes |
| `npm run typecheck` | ✅ passes |
| `npm test` | ✅ 133 tests in 7 files (only `src/core`) |
| `npm run test:db` | ✅ 12 tests in 1 file (`src/server/briefing.itest.ts`) |
| `npm run build` | ✅ passes (Next 16.4.6, Turbopack) |
| CI | ❌ none (no `.github/`) |
| Deploy | No deploy configuration in the repository; the real environment can't be verified from here |

Strengths recorded in the previous inspection (§3.1) were **confirmed**: pure `src/core`, data-driven visibility, signal registry, gray status, `sourceAnswerIds`, 24-character token (~124 bits), transactional and idempotent `processAndPersist`.

---

## 2. Historical findings

| ID | Classification | Evidence | Proposed priority |
|---|---|---|---|
| **SEC-01** | **confirmed** | `src/server/auth.ts` `getSessionUser`: any account authenticated in Supabase becomes a `User` on first visit (`prisma.user.create`). If Supabase signup is enabled (Supabase default, not verifiable from the repo), anyone gets a dashboard. Isolation by `userId` prevents seeing other people's clients, but the access itself shouldn't exist. | **P0** |
| **SEC-02** | **confirmed** | `src/app/login/page.tsx:17` calls `redirect(redirectTo)` and `LoginForm.tsx:78` calls `router.push(redirectTo)` with the raw query-string value. `/login?redirect=https://malicious-site` works as an open redirect. | P1 |
| **SEC-03** | **partial** | No `Origin` check on mutations. Existing mitigation: Supabase cookies are `SameSite=Lax` (`@supabase/ssr`), which blocks cross-site POST/PATCH/DELETE. Remaining: same-site subdomains and `GET /api/briefings/[id]/pdf`, which is expensive (launches a Chromium) and accepts cross-site top-level navigation. | P1 |
| **SEC-04** | **confirmed** | No rate limiting on `/api/public/**` or on the PDF. | P1 |
| **SEC-05** | **confirmed** | No `robots`, `noindex` or explicit `Referrer-Policy`. The token is in the URL `/briefing/<token>`; browsers' default policy already doesn't leak the path cross-origin, but it should be explicit. | P1 |
| **SEC-06** | **confirmed** | `next.config.ts` doesn't define `headers()`; no CSP, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`. | P1 |
| **DATA-01** | **confirmed** | `submitBriefing` (`src/server/briefing.ts`): validate → status `update` → `processAndPersist` in **three steps outside a single transaction**. (a) if the diagnosis fails, the briefing is closed without a diagnosis; (b) `saveAnswers` doesn't re-check the status inside the transaction, so a concurrent autosave can change answers after the calculation; (c) two simultaneous submissions pass the check and race on the `(briefingId, code)` unique constraint of `Signal`, and one of them returns 500. | **P0** |
| **DATA-02** | **confirmed** | `Question` is a global, unversioned catalog; editing a question changes old briefings. Structural delivery in Phase 2 (EP-07). Mitigation until then: don't edit the catalog in production, only add. | P0 (mitigate in Phase 0, solve in Phase 2) |
| **DATA-03** | **confirmed** | `saveAnswersSchema` only validates "string or array of strings". It doesn't check type × `answerType` or value × `options`. An invalid `business_type` reaches `prisma.briefing.update` as an unknown enum → **500**. | P1 |
| **DATA-04** | **confirmed** | `missingRequiredKeys` for gray categories is recomputed on read (`briefingDetail.ts:197`) against the **current** catalog; it isn't persisted. | P1 (Phase 2, with DATA-02) |
| **DATA-05** | **confirmed** | No revocation, regeneration, reopening or approval. The `draft`, `submitted` and `approved` statuses exist in the enum, but no flow uses them. | P1 (Phase 2, EP-09; BRF-04 is Must) |
| **DATA-06** | **confirmed** (low impact) | `loadBriefingDetail` reads `signals` and `diagnoses` without `orderBy`; the summary sorts by score and, on ties, inherits the database order. Question order is deterministic (global `order` in the seed). | P2 |
| **PERF-01** | **confirmed** | The `matcher` in `src/proxy.ts` includes `/briefing/*` and `/api/public/*`; with Supabase configured, every public autosave makes a pointless `auth.getUser()` call. | P1 |
| **QUAL-04** | **confirmed** | No API, component or E2E tests. The only cross-access test is "doesn't return another account's briefing". | P2 → part of the DoD of each fix |
| **QUAL-05** | **confirmed** | No CI pipeline. | P1 (Phase 0 requires "CI blocks regressions") |
| **QUAL-06** | **confirmed** | Only `console.error("[api]", error)`; no structured logs, request ID or health check. | P2 |
| **LGPD-01** | **confirmed** | The only deletion is the client's cascading hard delete (`DELETE /api/clients/[id]`); no export, retention or anonymization. | P1 (cross-cutting; depends on PD-12) |
| **DEPLOY-01** | **confirmed** (code) | `src/server/pdf.ts` uses Playwright's full Chromium; the file itself notes this doesn't run in a Vercel serverless function. The real deploy environment isn't defined in the repository. | P1, depends on decision D1 |

---

## 3. New findings

| ID | Finding | Evidence | Proposed priority |
|---|---|---|---|
| NEW-01 | Malformed JSON body returns **500** instead of 400 | `parseBody` throws `SyntaxError`, and `handle()` only translates `UnauthorizedError` and `ZodError` | P1 |
| NEW-02 | Public payload includes the briefing's internal `id` | `GET /api/public/briefing/[token]` returns `briefing.id` (FORM-14: only what's needed) | P3 |
| NEW-03 | Briefing link can come out relative/broken without warning | `POST /api/briefings` uses `NEXT_PUBLIC_APP_URL ?? ""`; no env validation at startup | P1 (part of env validation) |
| NEW-04 | Deleting a client cascades to briefings, answers and diagnoses | `onDelete: Cascade` + `deleteMany`; conflicts with "preserved history" (PRODUCT.md, principle 8) | **Conflict with v2**: depends on PD-12 |

---

## 4. Proposed Phase 0 backlog

Only confirmed/partial findings. Ordered by risk (roadmap §3.1).

### EP-01 — MVP security
1. **SEC-01**: stop creating `User` automatically; only people already in the `users` table (created by seed/admin action) can sign in. Unknown account → session ended + clear message. *Interim until Phase 1 invitations.*
2. **SEC-02**: accept only internal paths in `redirect` (`/…`, never `//…` or an absolute URL), validated on server and client.
3. **SEC-05/06**: security headers, `Referrer-Policy: no-referrer` on the public form, `noindex` on `/admin`, `/briefing`, `/print`, `/login`, `robots.ts`.
4. **SEC-03**: `Origin` check on authenticated mutations; PDF via POST or an equivalent check.
5. **PERF-01**: exclude public routes from the proxy `matcher`.
6. **SEC-04**: rate limiting on public routes and the PDF (depends on decision D2).

### EP-02 — Briefing integrity
7. **DATA-01**: atomic submission: conditional status transition + diagnosis in the **same transaction**, with a lock on the briefing row; `saveAnswers` re-checking the status inside the transaction; idempotent concurrent resubmission.
8. **DATA-03 / NEW-01**: semantic validation of answers against the catalog (type, options, `business_type`) → 400/422, never 500; invalid JSON → 400.
9. **DATA-06**: deterministic ordering of signals and diagnoses.

### EP-03 — Minimum quality and operations
10. **QUAL-05**: CI (GitHub Actions) with lint, typecheck, unit, integration with Postgres and build.
11. **NEW-03**: environment variable validation with explicit failure.
12. Logs without tokens/PII (`handle()` currently logs the whole error, and Prisma errors may carry values).
13. API tests for existing routes, including negative ones (no session, other user, expired/submitted link).
14. **DEPLOY-01**: document the limitation and decide the PDF strategy (depends on D1).

### Progress

| Item | Status | Where |
|---|---|---|
| SEC-01 | **fixed**: sign-in never creates a user; unknown account sees "no access" and can sign out; a pre-registered `pending:` record is linked only with a confirmed email | `src/server/security/provisioning.ts`, `src/server/auth.ts` |
| SEC-02 | **fixed**: `safeRedirectPath` on server and client | `src/lib/safeRedirect.ts` |
| SEC-03 | **fixed**: `Origin`/`Sec-Fetch-Site` check on authenticated mutations and the PDF → 403 | `src/server/security/origin.ts` |
| SEC-04 | **fixed**: Postgres rate limit on public routes (per IP) and the PDF (per user) → 429 + `Retry-After`; autosave honors `Retry-After` | `src/server/security/rateLimit*.ts` |
| SEC-05 | **fixed**: `robots.txt`, `X-Robots-Tag: noindex` on private surfaces, `Referrer-Policy: no-referrer` on surfaces carrying the token | `src/app/robots.ts`, `next.config.ts` |
| SEC-06 | **partial**: security headers and CSP without `script-src`. Restricting scripts requires a per-request nonce and dynamic rendering of every page; kept as a P2 improvement | `next.config.ts` |
| PERF-01 | **fixed**: the proxy runs only on authenticated surfaces | `src/proxy.ts` |
| DATA-01 | **fixed**: autosave, submission and reprocessing lock the briefing row (`SELECT … FOR UPDATE`); submission validates, computes, stores the diagnosis and closes in a single transaction; autosave after submission → 410; concurrent submissions are idempotent | `src/server/briefing.ts`, `briefingIntegrity.itest.ts` |
| DATA-03 | **fixed**: answers validated against the catalog (type, options, duplicates, length); the whole batch is rejected with 400 and per-question `issues` | `src/core/answerValidation.ts` |
| NEW-01 | **fixed**: malformed JSON → 400 | `src/server/api.ts` |
| NEW-02 | **fixed**: public payload without the internal id | `api/public/briefing/[token]/route.ts` |
| DATA-06 | **fixed**: signals and diagnoses read with explicit ordering | `src/server/briefingDetail.ts` |
| NEW-03 | **fixed**: environment validated at startup (`instrumentation.ts`); the server doesn't start with an invalid configuration; links use the validated URL | `src/server/env.ts` |
| Logs | **fixed**: `logError` records name, code and a redacted message (email, phone, token, credential); rendering errors go through it too | `src/server/log.ts`, `src/instrumentation.ts` |
| QUAL-04 | **partial**: 19 API tests covering the negative cases of existing routes. Component and E2E tests still pending (E2E depends on a preview environment) | `src/app/api/__tests__/routes.itest.ts` |
| QUAL-05 | **fixed**: CI with lint, typecheck (with `next typegen`), unit tests, migrations from scratch + seed, PostgreSQL integration and build. Green on PRs #5, #6 and #7 | `.github/workflows/ci.yml` |
| DEPLOY-01 | **fixed (decision D6)**: `playwright-core` + `@sparticuz/chromium` on serverless, local Chromium otherwise. Both paths generated PDFs locally; the build includes the binaries in the function. **Still needs validation on a real Vercel deploy** | `src/server/pdfBrowser.ts`, `next.config.ts` |

#### DEPLOY-01: PDF on Vercel serverless

Playwright's full Chromium doesn't fit in a Vercel serverless function. There's no way to produce a layout-faithful PDF without a browser and without adding a dependency. The options were:

1. **`playwright-core` + `@sparticuz/chromium`** (recommended): Chromium compressed for serverless. The adapter is isolated in `src/server/pdf.ts`, so the swap stays in one file. Costs: two new dependencies, a function with more memory (~1 GB) and a cold start of a few seconds.
2. **Browser printing:** the `/print/briefing/[id]` page already exists; the button would open it with `window.print()`. Zero dependencies and zero server cost. Costs: the PDF depends on the downloader's browser, and server-side PDFs for shared reports (Phase 6) become impossible.
3. **External rendering service:** a new data sub-processor (LGPD) and recurring cost.

**Decided on 2026-11-13: option 1** (D6 in `docs/DECISIONS.md`).

Notes:
- "Already submitted" now takes precedence over "expired" in the message shown to the respondent.
- Rendering of the `/briefing/[token]` page (SSR) isn't rate-limited, only the API is. Evaluate together with observability.

**Deferred to later phases** (per the roadmap): DATA-02/DATA-04 → Phase 2 (EP-07/08); DATA-05 → Phase 2 (EP-09); QUAL-06 → ongoing; LGPD-01 and NEW-04 → depend on PD-12.

---

## 5. Decisions needed

### To execute Phase 0 (all decided — see `docs/DECISIONS.md`)
| ID | Question | Why it matters |
|---|---|---|
| D1 | Where will the application run in production (Vercel serverless, container/VPS, other)? | Defines the PDF strategy (DEPLOY-01) and where to store the rate limit |
| D2 | Rate limit: Postgres table (no new dependency) or external service (e.g. Upstash/Redis)? | Local memory doesn't work with multiple serverless instances |
| D3 | Confirm the interim SEC-01 policy (only pre-registered users sign in until invitations exist)? | Closes the P0 without bringing Phase 1 forward |
| D4 | Until PD-12 is decided, does deleting a client stay a hard delete or become archiving? | NEW-04 / preserved history |
| D5 | Create a `main` branch from `front` to serve as the PR base? | There's no main branch today |

### To prepare Phase 1 (roadmap §16, item 8)
- **PD-01**: permission matrix by role (admin, leader, member) × action.
- **PD-02**: how to combine permissions for someone with more than one role.
- **PD-13**: project access by individual assignment, by team, or both.
- Can leaders invite members? (AUTH open item, `docs/REQUIREMENTS.md` §2.2)
- Migration policy for current data into the initial organization.
