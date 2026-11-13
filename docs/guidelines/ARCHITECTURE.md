# Architecture

Read before: creating a module, route, use case, authorization rule or multi-write flow.

- **Modular monolith** (`docs/ARCHITECTURE.md` §5). Introduce `src/modules/<context>/{domain,application,infrastructure,presentation}` **only when a flow is implemented or refactored**. No empty folders, no mass rewrites.
- `src/core` stays pure: no Next, React, Prisma, Supabase or network.
- **Thin routes:** authenticate → validate shape (zod) → call use case → convert to HTTP (helpers in `src/server/api.ts`). Business rules don't live in route handlers or components.
- **Server-side authorization**, centralized in policy functions, never only in the UI. From Phase 1 on, every query and mutation is scoped by `organizationId` through reusable helpers (not filters remembered one by one).
- Flows with more than one related write (submission, diagnosis, approval, conversion) run in a **transaction** and are **idempotent**.
- Repositories only when there's a real gain (transactions, isolation, testing). No generic Prisma wrapper.
- Next.js 16 has breaking changes: **read the guide in `node_modules/next/dist/docs/` first** before using routing, caching, proxy, server actions, etc.
