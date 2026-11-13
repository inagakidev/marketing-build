# Design System v2 — Briefing Inteligente

Tokens, components, patterns and visual behavior (`docs/REQUIREMENTS.md` §21). The visual source is the **Design System v2** canvas: https://claude.ai/artifact/KuMWTCWoUJ4Ath96Jfyo2B (frames 01–04 for foundations and components; F, P and D frames for screens).

The code implements it in `src/app/globals.css` (tokens) and `src/components/ui/` (components). Screens use **semantic tokens only**; primitives stay behind them.

## Principles

- **Primary is black.** One primary button per area.
- **Orange is a rare accent**: at most **one per screen**, for the action that moves the journey forward (send the briefing, start, create the account). In code that's the `brand` button variant.
- **Errors aren't orange.** States use their own semantic colors: red, amber, green and blue.
- **Flat UI.** Separation comes from borders. Shadows are only for things that float (menus, toasts, modals).
- **Every text passes WCAG 2.2 AA.** Status is never shown by color alone: there's always a label.

## Color

### Primitives

| Family | Values |
|---|---|
| Neutral (warm) | 0 `#FFFFFF` · 50 `#F8F8F4` · 100 `#F2F1EC` · 200 `#E6E4DD` · 300 `#D3D0C7` · 400 `#A8A499` · 500 `#8A8578` · 600 `#6B665B` · 700 `#4F4B42` · 800 `#33302A` · 900 `#1F1D19` · 950 `#0F0F0E` |
| Brand | 50 `#FFF5EF` · 100 `#FDE9DF` · 200 `#FCCFB5` · 300 `#FFA67D` · **500 `#FF6B35` (brand)** · 600 `#E5541F` (hover) · **700 `#C2410C` (action, text)** · 800 `#9A3412` (pressed) |

### Semantic tokens

| Token (CSS) | DS v2 name | Light | Dark (derived) | Use |
|---|---|---|---|---|
| `--bg` | bg.app | neutral.50 | neutral.950 | Page background |
| `--surface` | bg.surface | neutral.0 | neutral.900 | Cards, panels, fields |
| `--surface-muted` | bg.sunken | neutral.100 | `#2A2823` | Table headers, grouped areas |
| `--border` | border.subtle | neutral.200 | neutral.800 | Dividers, card outlines |
| `--border-control` | border.control | neutral.500 | neutral.500 | Inputs, checkbox, radio (3:1) |
| `--text` | text.primary | neutral.950 | neutral.50 | Titles and body |
| `--text-secondary` | text.secondary | neutral.700 | neutral.300 | Descriptions |
| `--text-muted` | text.muted | neutral.600 | neutral.400 | Metadata, placeholder |
| `--primary` / `--on-primary` | action.primary | neutral.950 / white | neutral.50 / neutral.950 | Primary button |
| `--accent-brand` / `--on-accent-brand` | action.accent | brand.500 / neutral.950 | same | The single accent per screen |
| `--link` | action.link | brand.700 | brand.300 | Links and action icons |
| `--focus-ring` + `--focus-gap` | focus.ring | neutral.950 + white | neutral.50 + neutral.950 | 2px ring with a 2px gap, keyboard only |

### States

| State | When | Background | Border | Text / icon |
|---|---|---|---|---|
| Success | done, validated | `#E7F6EC` | `#B5E3C4` | `#1E7A44` |
| Warning | needs review | `#FDF4DC` | `#F2D98C` | `#7A4E00` |
| Danger | blocks the flow | `#FDECEC` | `#F5C2BD` | `#B42318` |
| Info | neutral context | `#EAF2FB` | `#BCD5F0` | `#1D5FA8` |

Tokens: `--success-*`, `--warning-*`, `--danger-*`, `--info-*` (`-bg`, `-border`, `-text`), plus `--draft-*` for neutral states. Briefing statuses map to them in `BRIEFING_STATUS_TONE` (`src/lib/labels.ts`).

### Dark theme (proposal)

**The DS v2 canvas defines only the light palette.** The dark theme in `globals.css` is derived from the same warm family and keeps every role. **It still needs validating on the canvas.** Measured contrasts:

| Pair | Ratio |
|---|---|
| text on surface | 15.8 : 1 |
| secondary text on surface | 10.9 : 1 |
| muted text on surface / on sunken | 6.8 / 5.9 : 1 |
| control border on surface | 4.6 : 1 (≥ 3 for UI) |
| link (brand.300) on surface | 8.8 : 1 |
| accent button (black on brand.500) | 6.8 : 1 |
| success / warning / danger / info text on its background | 8.6 / 11.2 / 10.5 / 10.7 : 1 |

## Typography

Inter everywhere. The scale has a ratio of about 1.2. Body text is 14px on internal screens and 16px on the public form; inputs are always 16px, which avoids zoom on iOS.

| Style | Size / line height · weight |
|---|---|
| Display | 40 / 48 · 700, -0.02em |
| Heading 1 | 32 / 40 · 600 |
| Heading 2 | 24 / 32 · 600 |
| Heading 3 | 20 / 28 · 600 |
| Heading 4 | 16 / 24 · 600 |
| Body large | 16 / 24 · 400 |
| Body | 14 / 20 · 400 |
| Label | 14 / 20 · 500 |
| Small | 13 / 18 · 400 |
| Overline | 12 / 16 · 600, uppercase, 0.06em |

Rules:
- 700 is only for display.
- No text below 12px.
- Lines up to 72 characters.
- Numbers in tables and indicators use `tabular-nums`.

## Layout

- **Spacing:** 4px base. Components use 4–24; sections use 32–64.
- **Radii:** 6 (tags, checkbox) · 10 (buttons, fields) · 16 (cards) · 24 (modals) · pill (status, avatar). Tailwind's `rounded-lg` maps to 10 and `rounded-xl` to 16.
- **Elevation:** flat (cards, with a border) · raised (menus, toasts) · overlay (modals).
- **Breakpoints:**

  | Name | Width | Columns | Gutter |
  |---|---|---|---|
  | mobile | 320–767 | 4 | 16 |
  | tablet | 768–1023 | 8 | 24 |
  | desktop | 1024–1439 | 12 | 32 |
  | wide | ≥ 1440 | content max 1280 | — |

  Sidebar is 248px on desktop.
- **Motion:** fast 120ms (hover, focus) · base 200ms (menus, tabs) · slow 320ms (drawer, modal), curve `cubic-bezier(.2,0,0,1)`. With `prefers-reduced-motion`, no movement.

## Components (`src/components/ui/`)

| Component | DS v2 spec |
|---|---|
| Button | 40px (`lg` 44px, the mobile touch target), radius 10. Variants: `default` primary black · `brand` orange accent · `outline` secondary · `ghost` · `destructive` (white with a red border, always behind a confirmation). Disabled uses `--disabled-*`, not opacity. |
| Input | 44px, 16px text, radius 10, `--border-control`. Errors use a 2px red border plus a message that says what to do. |
| Alert | Background, border and text from one state family, an 18px icon, and copy that explains the next step. Variants `destructive`, `warning`, `success`, `info`. |
| Badge | Status pills `neutral`, `info`, `warning`, `success`, `danger` (28px, always with text). `outline` is the discreet category tag. |
| Card | Radius 16, 1px `--border`, no shadow. |

## Not yet covered

The **screens** in the canvas (F1–F6 public form, P1–P6 project, D1–D4 dashboards) are adopted story by story, as each flow is built. They aren't redrawn ahead of their epic.
