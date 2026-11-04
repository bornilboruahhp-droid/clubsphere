Let clubs define objectives and report progress against them.

## Routes

- `GET /api/clubs/[clubId]/objectives`, objectives with their latest update and update count
- `POST /api/clubs/[clubId]/objectives`, create
- `PATCH /api/clubs/[clubId]/objectives/[objectiveId]`, edit title, description, status, target date
- `DELETE /api/clubs/[clubId]/objectives/[objectiveId]`
- `GET /api/clubs/[clubId]/objectives/[objectiveId]/updates`, progress timeline
- `POST /api/clubs/[clubId]/objectives/[objectiveId]/updates`, add a progress note

## Rules

- Reads: any signed-in user for ACTIVE clubs.
- Writes: managers and admins. Club must be ACTIVE.
- Validate with `lib/validation/objective.ts`: title 3 to 120, description up to 1000, note 3 to 1000.
- A club may have at most 20 objectives.
- Each create, edit, delete, and progress note writes an audit entry (`objective.created`, `.updated`, `.deleted`, `.progress_added`).

## UI

- Fill the Objectives tab: list with status badges, target date, and latest note.
- Managers get Add, Edit, Delete (confirmed), and "Add progress" dialogs.
- Objective detail shows the progress timeline, newest first.
- The Overview tab's read-only objective list should reflect status changes.

## Scope Limits

- Do not link objectives to events or analytics yet

## Check When Done

- Managers can fully manage objectives; members have read-only access
- Status and progress changes appear in the timeline
- Limit of 20 objectives is enforced by the API
- `npm run build` passes
