<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Development guidelines — Briefing Inteligente

These apply to people and agents. Each topic is detailed in `docs/guidelines/`. **Before each kind of task, read the matching file.**

## Rules that always apply

- **Sources of truth:** `PRODUCT.md` > `docs/02-requisitos.md` > `docs/03-inspecao-e-arquitetura.md` > `docs/04-roadmap-melhorias.md`. A divergence between code and documents is recorded and decided, never resolved silently.
- **Pending decisions (PD-xx) are never decided for technical convenience:** stop and ask.
- **No generative AI in the product (V1).** Diagnosis and recommendations are deterministic code.
- **Plan before coding; test first** for domain rules and bug fixes.
- **Language:** everything in English (code, comments, docs, commits, PRs, branches), **except user-facing text, which stays in pt-BR**.
- **Naming:** documentation files in English UPPERCASE (`ROADMAP.md`); variables, functions and code files in camelCase (`rateLimitRules.ts`). Exceptions in `CODE-AND-UI.md`.
- **Git:** branch from an up-to-date `main`; every PR targets `main`; after merging, go back to `main`; delete branches that are no longer used.
- **Done = green gate:** `npm run lint && npm run typecheck && npm test && npm run test:db && npm run build`.
- **Security in every story:** server-side input validation, server-side authorization, no PII in logs.

## Which guideline to read

| Before… | Read |
|---|---|
| Starting any task, or when code and documents diverge | [`SOURCES-OF-TRUTH.md`](docs/guidelines/SOURCES-OF-TRUTH.md) |
| Planning or starting a story; writing commits | [`WORKFLOW.md`](docs/guidelines/WORKFLOW.md) |
| Creating a branch, opening a PR, merging or cleaning up branches | [`GIT.md`](docs/guidelines/GIT.md) |
| Creating a module, route, use case, authorization rule or multi-write flow | [`ARCHITECTURE.md`](docs/guidelines/ARCHITECTURE.md) |
| Changing the schema, creating a migration or changing deletion/archiving | [`DATA-AND-MIGRATIONS.md`](docs/guidelines/DATA-AND-MIGRATIONS.md) |
| Writing tests or calling a delivery done | [`QUALITY.md`](docs/guidelines/QUALITY.md) |
| Touching auth, routes, public payloads, logs or environment variables | [`SECURITY-AND-PRIVACY.md`](docs/guidelines/SECURITY-AND-PRIVACY.md) |
| Writing code, components, screens or UI copy; naming anything | [`CODE-AND-UI.md`](docs/guidelines/CODE-AND-UI.md) |

When adding or changing a guideline: one topic per file, a "Read before:" line at the top, and one row in this table.
