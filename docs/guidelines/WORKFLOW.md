# Workflow

Read before: planning or starting a story; writing commits.

1. **Plan before coding.** Every story meets the Definition of Ready (roadmap §12): linked requirement/ID, verifiable acceptance criteria, data, permission and UI-state impact assessed.
2. **Test first** for domain rules and bug fixes (a test that reproduces the problem and fails before the fix).
3. **Implement in the smallest reviewable scope.** One story = one coherent set of commits.
4. **Verify** with the quality gate (`QUALITY.md`) before calling it done.
5. **Update documentation in the same delivery** (requirements, architecture, roadmap, README) when behavior or a decision changes.

- Commits follow Conventional Commits, in English, citing the traceable ID: `fix(briefing): make submission atomic (DATA-01)`.
- No new dependency without justification in the commit/PR (what it solves and why existing tools can't).
- Don't expand scope: anything outside the story becomes a backlog note, not code.
