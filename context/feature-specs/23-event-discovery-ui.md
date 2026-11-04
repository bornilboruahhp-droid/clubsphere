Build the student-facing event pages. Backend exists from specs 20 and 22.

## Implementation

1. Event feed.

   Create `app/(app)/events/page.tsx`:
   - responsive card grid with title, club, date and time, location, and spots remaining
   - tabs: Upcoming, My Registrations
   - filters: club select, date range, search
   - server-side fetching through `lib/data/events.ts`

2. Event detail.

   Create `app/(app)/events/[eventId]/page.tsx`:
   - title, club link, description, date and time (institution timezone), location, capacity
   - `RegisterButton` client component with states: Register, Registered (Cancel registration), Full, Event ended, Cancelled, Members only
   - cancelling requires an `AlertDialog`

3. Dashboard widget.

   On `/dashboard`, add an "Upcoming events" card for the user's registrations and for events from their clubs.

## Scope Limits

- No calendar export
- No changes to event APIs

## Check When Done

- Students can find, open, register for, and cancel events
- Full, ended, cancelled, and members-only states are clear and disabled where needed
- Times display in the institution timezone
- Works on mobile in both themes
- `npm run build` passes
