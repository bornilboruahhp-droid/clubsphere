Build the system-wide admin dashboard. Read-only analytics for administrators.

## Implementation

1. Queries.

   Create `lib/analytics/admin.ts` with typed functions using Prisma `count`, `groupBy`, and `$queryRaw` where grouping by month is needed. All queries accept a range (`30d`, `90d`, `12m`). Pages call these directly from Server Components. No new API routes.

2. Page.

   Create `app/(app)/admin/page.tsx`. Admin only (`notFound()` otherwise). Range selector driven by `?range=`.

3. Stat cards.

   Active clubs, pending approvals, active members (distinct users with an ACTIVE membership), events held in range, average attendance rate (PRESENT divided by PRESENT plus ABSENT).

4. Charts.

   Using shadcn chart primitives and tokens:
   - clubs by status
   - new memberships per month
   - events held per month
   - turnout per published election (votes divided by eligible)

   Each chart has a table alternative toggle.

5. Exception lists.

   - Clubs whose pending review is older than 7 days
   - ACTIVE clubs with no PUBLISHED or COMPLETED event in the last 90 days

   Each row links to the club.

## Scope Limits

- No exports (spec 34)
- No admin actions (spec 35)

## Check When Done

- Non-admins cannot open the page
- Numbers match the underlying data for a seeded sample
- Range selector changes results
- Empty ranges show empty states, not errors
- Layout works on mobile in both themes
- `npm run build` passes
