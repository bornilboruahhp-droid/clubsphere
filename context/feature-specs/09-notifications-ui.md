Add the notification bell and list to the navbar. The backend exists from spec 08.

## Implementation

1. Bell.

   Create `components/layout/notification-bell.tsx` (client component).
   - `Bell` icon button with an unread count badge (cap display at `9+`)
   - Opens a `DropdownMenu` or popover with the latest 10 notifications
   - Each item shows title, optional body, relative time, and an unread dot
   - Clicking an item marks it read and navigates to its `href`
   - Footer actions: Mark all as read, View all

2. Polling.

   Refresh the unread count on window focus and every 60 seconds. Do not add websockets.

3. Full page.

   Create `app/(app)/notifications/page.tsx` as a Server Component listing notifications with a client control for mark-all-read and an unread filter.

4. Empty state.

   Use the shared empty state when there are none.

## Scope Limits

- Do not change the notification API
- Do not trigger notifications from any feature yet

## Check When Done

- Bell shows the correct unread count
- Marking read updates the badge without a full reload
- Works on mobile widths
- Light and dark themes both look correct
- `npm run build` passes
