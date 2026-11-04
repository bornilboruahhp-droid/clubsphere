Let club managers record attendance, with a timestamp on every status change.

## Routes

- `PATCH /api/events/[eventId]/registrations/[registrationId]`, body `{ status: "PRESENT" | "ABSENT" }`
- `POST /api/events/[eventId]/attendance/bulk`, body `{ registrationIds: string[], status: "PRESENT" | "ABSENT" }` (max 200 ids)
- `POST /api/events/[eventId]/attendance/finalize`, sets every remaining `REGISTERED` registration to `ABSENT`

## Rules

- Managers and admins only.
- The event must be PUBLISHED and already started, or COMPLETED. Cancelled and draft events return `409 INVALID_STATE`.
- Transitions follow `lib/events/attendance-transitions.ts`. `CANCELLED` registrations cannot be marked.
- Marking `PRESENT` sets `checkedInAt` if empty. Every change sets `statusChangedAt`.
- Bulk and finalize run in one transaction and write one audit entry (`attendance.marked`, `attendance.finalized`) with the count and the status in metadata.

## UI

On the event manage page (spec 21), add an Attendance section:

- registrant table with search and status filter
- Present and Absent buttons per row, and checkbox selection with bulk actions
- summary counts (Registered, Present, Absent)
- "Finalize attendance" with an `AlertDialog` explaining that remaining registrants become Absent

## Scope Limits

- No QR check-in (spec 25)

## Check When Done

- Single, bulk, and finalize actions work and respect the allowed event states
- `statusChangedAt` is set on every change
- Non-managers receive `403`
- Counts update without a full reload
- `npm run build` passes
