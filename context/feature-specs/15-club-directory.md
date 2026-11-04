Build the club discovery experience and the full club profile page shell. Read-only.

## Implementation

1. Directory.

   Create `app/(app)/clubs/page.tsx` with two tabs:
   - Discover: ACTIVE clubs in a responsive card grid with name, short description, member count, and a search box (`?q=`)
   - My Clubs: clubs the user belongs to or proposed, each with a `StatusBadge` for club status and a chip for the user's role

   Fetch through `lib/data/clubs.ts`. Search is server-side.

2. Club page.

   Extend `app/(app)/clubs/[clubId]/page.tsx` into a tabbed page using the layout pattern in `ui-context.md`:
   - Header: name, `StatusBadge`, viewer's role chip, member count
   - Overview tab: description, objectives (read-only list with status), officers (President, Secretary, Treasurer names), advisor
   - Placeholder tabs for Members, Events, Objectives, Elections, Announcements, Settings. (Analytics is added by spec 33.) Render only the tabs the viewer may use. Placeholders show an empty state until their specs are done.

3. Banners.

   Show a warning banner for SUSPENDED clubs.

## Scope Limits

- No join button (spec 18)
- No editing (spec 16)
- No new API routes

## Check When Done

- Discover only lists ACTIVE clubs
- Search filters by name
- Non-members see no member-only tabs
- Layout works in both themes and on mobile
- `npm run build` passes
