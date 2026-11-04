Read `AGENTS.md` before starting.

We're adding the design system and UI primitive components.

Install and configure `shadcn/ui`.

Add these shadcn components:

- Button, Card, Dialog, AlertDialog, Input, Textarea, Label, Select, Checkbox
- Tabs, Table, Badge, Avatar, Separator, Skeleton
- Sheet, DropdownMenu, Form, Sonner (toasts)

Do not modify the generated `components/ui/*` files after installation.

Also install `lucide-react`, `react-hook-form`, `zod`, `@hookform/resolvers`, and `next-themes`.

## Theme

- Define every token from `ui-context.md` in `app/globals.css`, with light values on `:root` and dark values under `.dark`.
- Map the tokens to Tailwind utility names through `@theme inline`.
- Add `ThemeProvider` (next-themes, class strategy, default `system`) to the root layout.
- Create `components/layout/theme-toggle.tsx` (light, dark, system) as a small client component.
- Mount the Sonner `Toaster` in the root layout.

## Utilities

- Create `lib/utils.ts` with a reusable `cn()` helper.
- Create `lib/config.ts` exporting `INSTITUTION_TIMEZONE` (default `Asia/Kolkata`).
- Create `lib/format.ts` with `formatDate`, `formatDateTime`, and `formatRelative` helpers using `Intl.DateTimeFormat` and the configured timezone.

## Examples Page

Create `app/examples/page.tsx` showing each component once, in both themes, using tokens only. This page is for visual verification and may be removed later.

## Scope Limits

- Do not build app navigation or any feature UI yet.
- Do not add auth or database code.

## Check When Done

- All components import without errors
- `cn()` works properly
- Light and dark themes both render with token colors only
- No hardcoded hex values or raw palette classes outside `globals.css`
- `npm run build` passes
