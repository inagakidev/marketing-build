# Security and privacy

Read before: touching authentication, routes, public payloads, logs or environment variables. Applies to every story, not to a single phase.

- Validate every input on the server (type, options, limits).
- Authenticated routes that change data call `assertSameOrigin` (`src/server/security/origin.ts`); public or expensive routes use `enforceRateLimit`.
- Public payloads carry only what's needed to answer; no internal notes, internal ids or diagnosis.
- Log only through `logError` (`src/server/log.ts`): no tokens, free-text answers, emails, phone numbers or other PII.
- Environment variables are read through `serverEnv()` (`src/server/env.ts`), never `process.env` directly in application code.
- Link tokens are credentials: opaque, expiring, revocable.
