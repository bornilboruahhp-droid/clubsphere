Build the application shell that frames every signed-in screen: navbar, role-aware sidebar, and placeholder routes. Auth is not wired yet, so the shell takes the user's role as a prop that defaults to a mock value.

## Implementation

1. Navigation config.

   Create `lib/navigation.ts` exporting a typed list of nav items:
   - Dashboard (`/dashboard`)
   - Clubs (`/clubs`)
   - Events (`/events`)
   - Reviews (`/reviews`) for roles ADVISOR and ADMIN
   - Admin (`/admin`) for role ADMIN

   Each item has `label`, `href`, `icon` (Lucide), and an optional `roles` array. Add a `getNavItems(role)` helper.

2. Navbar.

   Create `components/layout/app-navbar.tsx`.
   - Fixed-height top bar with a bottom border
   - Left: sidebar toggle (`PanelLeftOpen` / `PanelLeftClose`) and app name
   - Right: placeholder slots for notification bell, theme toggle, and user menu
   - Include the `ThemeToggle` from spec 01 now

3. Sidebar.

   Create `components/layout/app-sidebar.tsx`.
   - Persistent on large screens, `Sheet` on small screens
   - Highlights the active route
   - Receives nav items as props

4. Shell layout.

   Create `components/layout/app-shell.tsx` and a route group layout at `app/(app)/layout.tsx` that wraps all signed-in pages.

5. Placeholder pages.

   Under `app/(app)/`, add minimal pages for `dashboard`, `clubs`, `events`, `reviews`, and `admin`, each showing a title and an empty state.

6. Shared pieces.

   Create `components/layout/page-header.tsx` (title, description, actions slot) and `components/layout/empty-state.tsx`.

## Scope Limits

- No real data, no auth, no role lookup
- No notification logic
- Do not modify `components/ui/*`

## Check When Done

- Shell renders on desktop, tablet, and mobile widths
- Sidebar opens as a sheet on mobile and does not push content
- Nav items change with the mock role
- All colors come from tokens
- `npm run build` passes
