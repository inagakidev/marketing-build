# Sources of truth and decisions

Read before: starting any new task, or when code and documents diverge.

| Document | Defines |
|---|---|
| `PRODUCT.md` | Vision, principles, boundaries (the "why") |
| `docs/REQUIREMENTS.md` | Expected behavior and acceptance criteria (the "what") |
| `docs/ARCHITECTURE.md` | Technical organization (the "how") |
| `docs/ROADMAP.md` | Sequencing, phases and epics (the "when") |

- On conflict, this order wins. If code diverges from the documents, **record the divergence and decide explicitly** whether the code or the document changes. Never pick silently.
- **Pending decisions (PD-01 to PD-14) are never resolved for technical convenience.** If a task hits one, stop, record it and ask. Isolate the decision point (e.g. a policy function) when work can proceed without it.
- Historical findings (SEC-xx, DATA-xx...) **are not backlog** until confirmed in the code and classified as `confirmed`, `fixed`, `not reproduced`, `partial` or `superseded by a new decision`.
- No generative AI in the product (V1). Diagnosis and recommendations are deterministic code.

## Where to record

- Phase 0 audit: `docs/PHASE-0-AUDIT.md`.
- Product/architecture decisions made during development: `docs/DECISIONS.md` (date, context, decision, alternatives, impact).
