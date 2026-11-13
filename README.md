# Briefing Inteligente

Strategic marketing management platform for teams (see `PRODUCT.md`). The current code is the MVP plus the Phase 0 hardening: an internal tool for adaptive client briefings, with an automatic diagnosis produced by a deterministic rules engine (no generative AI in this phase). An administrator registers clients and generates unique briefing links; each client answers a form that adapts to their type of business, and the administrator receives a ready diagnosis (warning signals + per-category score) as soon as it's submitted.

The user interface is in Brazilian Portuguese (pt-BR); code and documentation are in English (`docs/guidelines/CODE-AND-UI.md`).

## Documentation

| Document | Contents |
|---|---|
| `PRODUCT.md` | Vision, users, principles and boundaries |
| `docs/REQUIREMENTS.md` | Functional and non-functional requirements |
| `docs/ARCHITECTURE.md` | Technical state and target architecture |
| `docs/ROADMAP.md` | Phases, epics and priorities |
| `docs/PHASE-0-AUDIT.md` | Phase 0 audit and progress |
| `docs/DECISIONS.md` | Decisions made during development |
| `AGENTS.md` + `docs/guidelines/` | Development guidelines |

## Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 16 (App Router) + TypeScript, single full-stack project |
| UI | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (local via Docker; Supabase in production) |
| ORM | Prisma 7 |
| Authentication | Supabase Auth |
| PDF | Playwright (renders the briefing's own page and exports it); `@sparticuz/chromium` on serverless |
| Tests | Vitest (unit) + Vitest against a real Postgres (integration) |

There's no separate API server: the "backend" is Next's route layer (`src/app/api/**/route.ts`), running in the same process as the frontend. There's no LLM/generative AI integration in this version — the whole diagnosis is deterministic code in `src/core`.

## Prerequisites

- Node.js 22.17+ or 24 (CI runs on Node 24)
- Docker (for the local Postgres) — or a connection string to an existing Postgres
- A Supabase account (optional for development; required for real login)

## Setup from scratch

```bash
# 1. Install dependencies
npm install

# 2. Copy the environment variables template
cp .env.example .env

# 3. Start the local Postgres
npm run db:up

# 4. Run the migrations and generate the Prisma client
npm run db:migrate

# 5. Seed the question catalog (fixed core + branches by business type)
npm run db:seed

# 6. Create the administrator account
npm run db:seed:admin

# 7. Start the application
npm run dev
```

Open [http://localhost:3000/admin](http://localhost:3000/admin).

If `NEXT_PUBLIC_SUPABASE_URL` isn't set in `.env` yet, the panel allows access without login while `DEV_ADMIN_EMAIL` is set — only for development before setting up Supabase for real (see below). Without Supabase configured and without `DEV_ADMIN_EMAIL`, password login doesn't work.

To get a sample client and briefing link without going through the panel:

```bash
npm run dev:data
```

The script prints the public link (`/briefing/<token>`) in the terminal.

## Environment variables

All of them are documented with comments in `.env.example`. Summary:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string. Local by default (`docker-compose.yml`); switching to a Supabase URI migrates the database without code changes. |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase Auth credentials (your project's Settings → API). |
| `SUPABASE_SERVICE_ROLE_KEY` | Private key, used only on the server by the seed to create the administrator in Supabase Auth. **Never** expose it to the client. |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Data used by `npm run db:seed:admin` to create the administrator account. |
| `NEXT_PUBLIC_APP_URL` | The application's public base URL — builds the briefing link and is where Playwright navigates to generate the PDF. Required in production. |
| `BRIEFING_LINK_TTL_DAYS` | Default validity, in days, of a newly created briefing link (1–365). |
| `DEV_ADMIN_EMAIL` | Login bypass in development. Only works with Supabase **not** configured and `NODE_ENV=development`. Leave empty to always require login. |
| `CHROMIUM_EXECUTABLE_PATH` | Path to an installed Chromium, for distros where `playwright install` doesn't work. Ignored on serverless. |

### Validated environment

`src/server/env.ts` validates the environment when the server starts (`src/instrumentation.ts`). With an invalid configuration, the server **doesn't start** and lists what to fix, without echoing values. In production, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required.

### Setting up Supabase (real login)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the `Project URL`, `anon public key` and `service_role key` (Settings → API) into `.env`.
3. Replace `DATABASE_URL` with the project's Postgres connection string (Settings → Database → Connection string → URI) — only that line changes; the schema is the same.
4. Run `npm run db:migrate` and `npm run db:seed:admin` again against Supabase — this creates the administrator both in Supabase Auth and in the local `users` table, linked together.
5. Clear `DEV_ADMIN_EMAIL`.

> **Who can sign in.** Being authenticated in Supabase isn't enough: only people who already exist in the `users` table (created by `db:seed:admin`) can access the panel. An account that exists only in Supabase — including through its public sign-up — sees the "Esta conta não tem acesso ao painel" screen. No user is ever created from a login. It's also recommended to disable public sign-up under *Authentication → Providers → Email* in Supabase. Interim policy until Phase 1 invitations (decision D3 in `docs/DECISIONS.md`).

## How the API works

Each route lives in `src/app/api/**/route.ts` and follows the same shape: it receives the request, calls a function in `src/server/*.ts` (database access via Prisma) and/or `src/core/*.ts` (pure rules engine with no I/O), and returns JSON.

### Authenticated routes (administrator panel)

Protected by `src/proxy.ts` (Next 16 middleware) + `requireUser`/`getSessionUser` in each route — the check exists in both places on purpose, because the proxy doesn't cover every internal navigation.

Routes that change data (and the PDF) also reject requests from another origin with `403` (`src/server/security/origin.ts`), as CSRF protection.

| Route | Method | Purpose |
|---|---|---|
| `/api/clients` | `GET`, `POST` | List clients / create a client |
| `/api/clients/[id]` | `GET`, `PATCH`, `DELETE` | Detail, edit and delete a client |
| `/api/briefings` | `POST` | Create a briefing (generates the link's unique token) for a client |
| `/api/briefings/[id]` | `GET` | Processed briefing detail: answers by category, signals and diagnosis |
| `/api/briefings/[id]/reprocess` | `POST` | Recompute signals/diagnosis with the current rules (explicit action — the result stored on submission doesn't change on its own) |
| `/api/briefings/[id]/pdf` | `GET` | Generate and download the briefing PDF (Playwright renders `/print/briefing/[id]`) |

### Public routes (the client answering, no login)

Authenticated only by the opaque token in the URL — the respondent's only credential.

They're rate-limited per IP (and the PDF per user), with the counter in Postgres itself (`src/server/security/rateLimit.ts`, table `rate_limit_buckets`). When the limit is exceeded, the response is `429` with `Retry-After`. Limits live in `RATE_LIMITS` (`rateLimitRules.ts`).

| Route | Method | Purpose |
|---|---|---|
| `/api/public/briefing/[token]` | `GET` | Load the form: questions visible for the `businessType` already answered + answers saved so far |
| `/api/public/briefing/[token]/answers` | `PUT` | Autosave: store a batch of answers (client-side debounce groups bursts of typing into a single PUT) |
| `/api/public/briefing/[token]/submit` | `POST` | Final submission: runs the signal engine and diagnosis, changes the briefing status and locks further edits — atomically |

### The rules engine (`src/core`)

It doesn't depend on Next, Prisma or Supabase — it takes plain objects (`EvalContext`) and returns plain objects, which allows testing it without a database. Three parts:

- **Visibility** (`core/visibility.ts`): decides which questions appear by evaluating each `Question`'s `visibilityRule` (JSON) against the answers already given. Branching by business type is data, not `if/else` in code.
- **Signals** (`core/signals/rules/*.ts`): pure functions `(ctx) => Signal | null`, one per rule (`vague_goal`, `broad_audience`, etc.), registered in `core/signals/registry.ts`.
- **Diagnosis** (`core/diagnosis/score.ts`): scores each category from the signals found and classifies it as `green`/`yellow`/`red`/`gray`.

Answers are also validated against the catalog (`core/answerValidation.ts`) before being stored.

### PDF generation

`src/server/pdf.ts` opens a Chromium (chosen by `src/server/pdfBrowser.ts`), navigates to `NEXT_PUBLIC_APP_URL/print/briefing/[id]` authenticated (reusing the request's session cookie) and exports the rendered page to PDF — the same layout shown on screen, with no duplicated template.

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the application in development (Turbopack) |
| `npm run build` | Generate the Prisma client and build for production |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `next typegen && tsc --noEmit` |
| `npm test` | Unit tests (Vitest, no database) |
| `npm run test:db` | Integration tests against a real Postgres (requires `npm run db:up`) |
| `npm run db:up` / `db:down` | Start/stop the local Postgres (Docker) |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:reset` | Reset the local database and reapply migrations + seed (destructive) |
| `npm run db:seed` | Seed the question catalog |
| `npm run db:seed:admin` | Create/update the administrator account and its admin membership in the organization (also restores access if it was deactivated) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run dev:data` | Create a sample client + briefing and print the public link |

## Tests

```bash
npm test          # unit — rules engine, visibility, diagnosis, validation, security rules
npm run db:up
npm run test:db   # integration — server layer and API routes against a real Postgres
```

The API tests (`src/app/api/__tests__/routes.itest.ts`) call the real route handlers against Postgres and simulate only the session. They mostly cover negative cases: no session, other origin, another account's resource, submitted link and invalid body.

CI (`.github/workflows/ci.yml`) runs all of this on every PR, with a Postgres service.

Before calling a change done, the full gate (see `AGENTS.md`) is:

```bash
npm run lint && npm run typecheck && npm test && npm run test:db && npm run build
```

## Deploy

The target is Vercel serverless (decision D1). The production Postgres is Supabase's (same `DATABASE_URL`, no schema change). Before the first deploy, run the migrations (`prisma migrate deploy`) and both seeds (`db:seed` and `db:seed:admin`) against the production database.

**PDF on serverless (decision D6):** on Vercel, `src/server/pdfBrowser.ts` uses `@sparticuz/chromium` with `playwright-core`; locally, Playwright's Chromium (or `CHROMIUM_EXECUTABLE_PATH`). For it to work in production:

- Give functions at least **1.6 GB of memory** (Vercel → Settings → Functions). With less, Chromium may be killed mid-generation.
- `playwright-core` and `@sparticuz/chromium` are pinned as a pair (1.63.0 ↔ Chromium 153). Upgrade both together.
- The PDF function navigates to its own public URL (`NEXT_PUBLIC_APP_URL`). On preview deploys with *Deployment Protection* enabled, that navigation is blocked. Use the production URL or a protection bypass.
