Build event registration. Capacity must be safe under concurrent requests.

## Routes

- `POST /api/events/[eventId]/registrations`, register the current user
- `DELETE /api/events/[eventId]/registrations/me`, cancel the current user's registration
- `GET /api/events/[eventId]/registrations`, registrant list (`?status=`, cursor-paginated)
- `GET /api/events/mine`, the current user's registrations (`?when=upcoming|past`)

## Rules

Register:

- Event must be PUBLISHED and not ended. Caller needs a complete profile.
- MEMBERS_ONLY events require an ACTIVE membership in the event's club.
- No row: create `REGISTERED`. Existing `CANCELLED`: set back to `REGISTERED` and update `statusChangedAt`. Any other existing status: `409`.
- Capacity: inside one transaction, lock the event row (`SELECT ... FOR UPDATE` through `$queryRaw`), count registrations whose status is not `CANCELLED`, and reject with `409 CONFLICT` when full.
- Write audit entry `event.registered`.

Cancel:

- Allowed only while status is `REGISTERED` and the event has not started.
- Sets `CANCELLED` and `statusChangedAt`. Write `event.registration_cancelled`.

Registrant list: managers, officers, the club advisor, and admins. Include name, status, and `statusChangedAt`. Include email and student ID for those same roles.

Every status change sets `statusChangedAt`.

## Scope Limits

- No attendance marking (spec 24)
- No UI

## Check When Done

- Concurrent registrations cannot exceed capacity (verify with parallel requests)
- Re-registering after cancelling works
- MEMBERS_ONLY events reject non-members
- Registrant list respects visibility rules
- `npm run build` passes
