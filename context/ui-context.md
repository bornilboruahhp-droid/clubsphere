# UI Context

> [!NOTE]
> The AI agent MUST follow the installed `shadcn` (`.agents/skills/shadcn/SKILL.md`) and `tailwind-design-system` (`.agents/skills/tailwind-design-system/SKILL.md`) skills for all UI component creation, styling, and design token implementation.

## Theme

Light and dark themes, following the system preference with a manual toggle. The visual language is a calm, professional campus workspace: neutral surfaces, one teal brand accent, and clear status colors. It must read well on phones, tablets, and desktops.

All colors are CSS custom properties in `globals.css`, mapped to Tailwind tokens via `@theme inline`. Dark values live under the `.dark` class. Components use tokens only. No hardcoded hex values and no raw palette classes.

| Role | CSS Variable | Light | Dark |
| --- | --- | --- | --- |
| Page background | `--bg-base` | `#F7F7F5` | `#0E0F11` |
| Surface | `--bg-surface` | `#FFFFFF` | `#16171A` |
| Elevated surface | `--bg-elevated` | `#FFFFFF` | `#1D1E22` |
| Subtle surface | `--bg-subtle` | `#EFEFEB` | `#25262B` |
| Default border | `--border-default` | `#E0E0D9` | `#2C2D33` |
| Subtle border | `--border-subtle` | `#ECECE6` | `#3A3B42` |
| Primary text | `--text-primary` | `#16161A` | `#F2F2F5` |
| Secondary text | `--text-secondary` | `#3F3F4A` | `#C4C4CE` |
| Muted text | `--text-muted` | `#6B6B78` | `#8A8A96` |
| Faint text | `--text-faint` | `#9A9AA6` | `#5A5A66` |
| Brand accent | `--accent-primary` | `#0F766E` | `#2DD4BF` |
| Brand dim | `--accent-primary-dim` | `rgba(15,118,110,0.10)` | `rgba(45,212,191,0.14)` |
| Text on brand | `--accent-primary-foreground` | `#FFFFFF` | `#06201C` |
| Error | `--state-error` | `#DC2626` | `#F87171` |
| Success | `--state-success` | `#15803D` | `#4ADE80` |
| Warning | `--state-warning` | `#B45309` | `#FBBF24` |
| Info | `--state-info` | `#1D4ED8` | `#60A5FA` |

Each state color also has a `-dim` variant at roughly 12% opacity for badge backgrounds (`--state-error-dim`, `--state-success-dim`, `--state-warning-dim`, `--state-info-dim`).

Tailwind utility names: `bg-base`, `bg-surface`, `bg-elevated`, `bg-subtle`, `border-surface-border`, `border-surface-border-subtle`, `text-copy-primary`, `text-copy-secondary`, `text-copy-muted`, `text-copy-faint`, `bg-brand`, `text-brand`, `text-brand-foreground`, `bg-brand-dim`, `text-state-error`, `bg-state-error-dim`, and the equivalents for success, warning, and info.

All text and interactive element pairings must meet WCAG AA contrast in both themes.

## Typography

| Role | Font | CSS Variable |
| --- | --- | --- |
| UI text | Geist Sans | `--font-geist-sans` |
| Code and IDs | Geist Mono | `--font-geist-mono` |

Loaded with `next/font`. If font downloads fail in an offline build, fall back to a system font stack defined in `globals.css`. Page titles use `text-2xl font-semibold`. Section titles use `text-lg font-medium`. Body uses `text-sm`.

## Border Radius

Radius increases with surface depth.

| Context | Class |
| --- | --- |
| Inline and small UI (inputs, buttons, badges) | `rounded-xl` |
| Cards and panels | `rounded-2xl` |
| Modals and overlays | `rounded-3xl` |

## Status Badges

Statuses are shown with a shared `StatusBadge` component (`components/layout/status-badge.tsx`) driven by label and tone maps in `types/status.ts`. Do not style status text ad hoc.

| Tone | Token pair | Used for |
| --- | --- | --- |
| Neutral | `bg-subtle` + `text-copy-secondary` | DRAFT, REGISTERED, PLANNED, CLOSED, REMOVED |
| Info | `bg-state-info-dim` + `text-state-info` | NOMINATION, IN_PROGRESS, PUBLISHED (event) |
| Warning | `bg-state-warning-dim` + `text-state-warning` | PENDING (club, membership, approval, candidate), SUSPENDED |
| Success | `bg-state-success-dim` + `text-state-success` | ACTIVE, APPROVED, PRESENT, VOTING, ACHIEVED, PUBLISHED (election) |
| Error | `bg-state-error-dim` + `text-state-error` | REJECTED, CANCELLED, ABSENT, DROPPED |
| Brand | `bg-brand-dim` + `text-brand` | PRESIDENT, TREASURER, SECRETARY role chips |

## Layout Patterns

- App shell: top navbar with a collapsible left sidebar. Desktop shows a persistent sidebar. Tablet and mobile show the sidebar as a `Sheet` opened from the navbar.
- Navigation is role-aware and defined in `lib/navigation.ts`. Admin and review links appear only for users who can use them.
- Navbar: logo, sidebar toggle, notification bell, theme toggle, Clerk `UserButton`.
- Club page: header with name, status badge, and the viewer's role, followed by tabs (Overview, Members, Events, Objectives, Elections, Announcements, Analytics, Settings). Tabs the viewer cannot use are hidden.
- Directories and feeds: responsive card grid (1 column mobile, 2 tablet, 3 desktop).
- Rosters, queues, audit log: `Table` on desktop. On mobile, rows collapse into stacked cards.
- Forms: single column, max width `max-w-2xl`, labels above inputs, actions at the bottom right.
- Dialogs: centered, `rounded-3xl`, backdrop blur. Destructive confirmations use `AlertDialog`.
- Empty states: Lucide icon at `h-8 w-8`, one-line explanation, and one primary action where relevant.
- Loading: skeletons that match the final layout.

## Dashboards and Charts

- Use shadcn chart primitives (Recharts) styled with brand and state tokens.
- Summary stats are cards with a number, a label, and an optional trend delta.
- Every chart has a text or table alternative for accessibility.

## Component Library

shadcn/ui on top of Tailwind. No custom design system. Components live in `components/ui/`. Use the `shadcn` CLI to add new components rather than writing them from scratch. Do not edit generated files.

## Icons

Lucide React. Stroke-based icons only, no filled variants. Sizes: `h-4 w-4` inline, `h-5 w-5` in buttons, `h-8 w-8` in empty states.

## Accessibility

- Every input has a visible label. Icon-only buttons have `aria-label`.
- Full keyboard navigation for dialogs, menus, tabs, and the ballot form.
- Focus rings use the brand token and are never removed.
- Status is never conveyed by color alone. Badges always include text.
