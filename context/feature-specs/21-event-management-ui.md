Build the club-side event management screens. Backend exists from spec 20.

## Implementation

1. Events tab.

   Fill the Events tab on the club page:
   - Upcoming and Past sections
   - each event shows title, date and time, location, `StatusBadge`, and registration count
   - managers see a "New event" button and DRAFT events

2. Create and edit forms.

   Create pages `app/(app)/clubs/[clubId]/events/new/page.tsx` and `.../events/[eventId]/edit/page.tsx` that share one client form component `components/events/event-form.tsx`:
   - title, description, location
   - start and end date-time inputs (interpreted in the institution timezone, sent as UTC)
   - optional capacity
   - visibility select (Campus, Members only)
   - Save as draft and Save changes buttons

3. Status actions.

   On the event manage view, add Publish, Cancel event, and Mark completed. Each uses an `AlertDialog` with a consequence summary (for example, "All registrants will be notified").

4. Event manage page.

   Create `app/(app)/clubs/[clubId]/events/[eventId]/page.tsx` for managers showing details, status actions, and a placeholder area for registrants and attendance (filled by specs 22 and 24).

## Scope Limits

- No student-facing event pages (spec 23)
- No attendance UI

## Check When Done

- Managers can create, edit, publish, cancel, and complete from the UI
- Dates round-trip correctly between the institution timezone and UTC
- Non-managers see no create or edit controls
- Works on mobile in both themes
- `npm run build` passes
