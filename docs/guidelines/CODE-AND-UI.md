# Code and UI

Read before: writing code, components, screens, UI copy or error messages.

## Language

- **Everything in English** except user-facing text: code identifiers, comments, documentation, commit messages, PR titles/descriptions and branch names.
- **User-facing text stays in Brazilian Portuguese (pt-BR)**, as `PRODUCT.md` requires: UI copy, error messages returned to the UI, emails, PDFs and URL segments users see (e.g. `/admin/clientes`).

## Naming

- **Documentation files:** English, UPPERCASE, words separated by hyphens: `README.md`, `ROADMAP.md`, `docs/guidelines/SECURITY-AND-PRIVACY.md`.
- **Code — variables, functions and file names:** camelCase: `briefingDetail.ts`, `rateLimitRules.ts`, `safeRedirectPath()`.
- **Exceptions** (imposed by tools or the language):
  - React component files and names: PascalCase (`BriefingFlow.tsx`), because JSX requires capitalized components.
  - Types, interfaces and classes: PascalCase (`SessionUser`, `RateLimitError`).
  - Module-level constants: UPPER_SNAKE_CASE (`RATE_LIMITS`, `DEFAULT_REDIRECT`).
  - Framework-reserved names: `page.tsx`, `layout.tsx`, `route.ts`, `proxy.ts`, `instrumentation.ts`, `robots.ts`.
  - Generated code: shadcn components in `src/components/ui/` (kebab-case) and `src/generated/`.
  - Database: Prisma enums keep snake_case values (`ready_for_review`), shared with `src/core`.
- Existing names outside these rules are renamed when the file is touched, not in a mass rename.

## Comments and UI

- Comments explain the *why*, not the *what*.
- Responsive and accessible UI (WCAG 2.2 AA as the reference): keyboard, visible focus, labels, contrast, status never conveyed by color alone, reduced-motion respected.
- Every screen covers **loading, empty, error, success and insufficient-permission** states.
- Tone: direct, human, non-judgmental (`PRODUCT.md` → Tone). Visually distinguish automatic suggestion × human decision × confirmed result.
