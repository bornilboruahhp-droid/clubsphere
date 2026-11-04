Add the event data models and the event management backend. No UI yet.

## Models

Create `prisma/models/event.prisma`.

Enums: `EventStatus` (`DRAFT`, `PUBLISHED`, `CANCELLED`, `COMPLETED`), `EventVisibility` (`CAMPUS`, `MEMBERS_ONLY`), `AttendanceStatus` (`REGISTERED`, `PRESENT`, `ABSENT`, `CANCELLED`).

`Event`:

- `id` UUID, relation to `Club` (cascade delete), `createdById` relation to `User`
- `title`, `description`, `location`
- `startsAt`, `endsAt`
- optional `capacity` (integer)
- `visibility` default `CAMPUS`, `status` default `DRAFT`
- timestamps
- indexes on (`clubId`, `startsAt`) and (`status`, `startsAt`)

`EventRegistration`:

- relations to `Event` (cascade delete) and `User`
- `status` default `REGISTERED`
- `statusChangedAt`, optional `checkedInAt`, `createdAt`
- unique constraint on (`eventId`, `userId`)
- indexes on `userId` and (`eventId`, `status`)

Create `lib/events/transitions.ts` and `lib/events/attendance-transitions.ts` from the maps in `architecture-context.md`.

Run `npx prisma migrate dev --name add_events`.

## Routes

- `POST /api/clubs/[clubId]/events`, create a DRAFT event
- `GET /api/clubs/[clubId]/events`, club events (managers also see DRAFT)
- `GET /api/events`, campus feed (`?from=&to=&clubId=&q=`, cursor-paginated, upcoming by default)
- `GET /api/events/[eventId]`, detail
- `PATCH /api/events/[eventId]`, edit
- `POST /api/events/[eventId]/status`, body `{ status: "PUBLISHED" | "CANCELLED" | "COMPLETED" }`

## Rules

- Create, edit, and status changes: managers and admins. The club must be ACTIVE.
- Validate with `lib/validation/event.ts`: title 3 to 120, description up to 2000, location 2 to 200, `endsAt` after `startsAt`, `startsAt` in the future on create and on publish, capacity 1 to 10000 or null.
- Editing is allowed while DRAFT or PUBLISHED. Capacity cannot drop below the current number of non-cancelled registrations.
- Feed visibility: PUBLISHED events from ACTIVE clubs. MEMBERS_ONLY events appear only to ACTIVE members of that club. DRAFT events are visible to managers and admins only.
- Status changes go through the transition map. `COMPLETED` is allowed only after `startsAt`.
- Every create, edit, and status change writes an audit entry (`event.created`, `.updated`, `.published`, `.cancelled`, `.completed`).
- After commit: publishing notifies the club's ACTIVE members (`EVENT_PUBLISHED`). Cancelling notifies non-cancelled registrants (`EVENT_CANCELLED`).

## Scope Limits

- No registration endpoints (spec 22)
- No UI

## Check When Done

- Migration applies cleanly
- Managers can create, edit, publish, cancel, and complete events
- Members and outsiders cannot mutate events
- MEMBERS_ONLY and DRAFT events do not leak into the feed
- Audit rows and notifications are created
- `npm run build` passes
