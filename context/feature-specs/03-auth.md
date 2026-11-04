Clerk is already installed and connected. Wire it into the Next.js app: provider, auth pages, redirects, route protection, and user menu.

Check the installed Next.js and Clerk versions and follow their docs for the request interceptor file name (`proxy.ts` or `middleware.ts`).

## Design

Use Clerk's built-in theme support and override appearance variables with the app's CSS variables so both light and dark themes work. Do not hardcode colors.

### Sign-in and sign-up pages

- large screens: simple two-panel layout
- left: compact logo, tagline, short text-only feature list (clubs, events, elections)
- right: centered Clerk form
- small screens: form only
- no gradients, no feature cards, no scroll-heavy layouts

Keep the layout minimal and professional.

## Implementation

- Wrap the root layout with `ClerkProvider`, passing appearance variables mapped to the CSS tokens.
- Create sign-in and sign-up pages using Clerk components as Server Components.
- Create the request interceptor at the project root. Define public routes from the existing sign-in and sign-up env vars. Protect everything else by default.
- Update `/`:
  - authenticated users redirect to `/dashboard`
  - unauthenticated users redirect to `/sign-in`
- Add Clerk's `UserButton` to the navbar right section from spec 02.
- Keep Clerk's default user menu and profile flows intact. Do not rebuild Clerk internals.
- Use existing Clerk env vars. Do not rename or invent new ones.

## Scope Limits

- Do not create database users yet (spec 05).
- Do not add role logic. Every signed-in user sees the same shell for now.

## Check When Done

- The interceptor exists at the project root and all routes except auth paths are protected
- Auth pages use CSS variables with no hardcoded colors and look right in both themes
- `ClerkProvider` wraps the root layout
- `UserButton` appears in the navbar
- `npm run build` passes
