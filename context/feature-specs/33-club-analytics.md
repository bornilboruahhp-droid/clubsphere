Build the club-level analytics tab for club leadership.

## Implementation

1. Queries.

   Create `lib/analytics/club.ts` with typed functions scoped by `clubId` and a range (`90d`, `12m`, `all`).

2. Access.

   Add an Analytics tab to the club page, visible to officers (President, Secretary, Treasurer), the club advisor, and admins. Enforce on the server with `requireClubOfficer` or the advisor check, not only by hiding the tab.

3. Content.

   - Stat cards: active members, new members in range, events held, average attendance rate, registration-to-attendance conversion
   - Chart: members over time
   - Chart: attendance per event (registered versus present)
   - Event table: title, date, registered, present, absent, rate
   - Election history: cycle year, turnout, winner name for PUBLISHED elections
   - Participation distribution: counts of members by number of events attended in range (0, 1 to 2, 3 or more). Counts only, no names.

## Scope Limits

- No member-level participation lists
- No exports (spec 34)

## Check When Done

- Only authorized roles can load the data, even by direct URL
- Metrics match the underlying records
- Empty clubs show useful empty states
- Layout works on mobile in both themes
- `npm run build` passes
