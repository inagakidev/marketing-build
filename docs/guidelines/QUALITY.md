# Quality and tests

Read before: writing tests or calling a delivery done.

**Mandatory gate before calling anything done:**

```bash
npm run lint && npm run typecheck && npm test && npm run test:db && npm run build
```

- Test behavior and invariants, not coverage percentage.
- Every access rule has a **negative test** (no session, no permission, other organization, other project).
- Unit tests (`*.test.ts`) don't depend on the database; pure rules live in files that don't import Prisma.
- Integration tests run against a real PostgreSQL (`*.itest.ts`).
- CI (`.github/workflows/ci.yml`) runs the same gate on a clean clone. Something that only passes on your machine (generated types, ignored files) is not done.
- Report results faithfully: if something failed or was skipped, say so.
