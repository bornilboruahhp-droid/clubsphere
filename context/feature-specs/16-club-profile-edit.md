Let a club President keep the club's public profile up to date.

## Route

`PATCH /api/clubs/[clubId]` accepts `name` and `description`.

Rules:

- Authorize with `requireClubPresident` (admins may also edit).
- Presidents may edit only ACTIVE clubs. Admins may edit any club that is not REJECTED.
- Validate with the same rules as registration.
- Duplicate names (case-insensitive) return `409` with a field error.
- Change status is not editable here.
- Write audit entry `club.profile_updated` with the list of changed field names in metadata.

## UI

- Add the Settings tab content on the club page, visible to the President and admins.
- Form with name and description, using the shared schema.
- Show last updated time.
- Disable the form with an explanation when the club is not ACTIVE.

## Scope Limits

- No advisor change (that is an admin control in spec 35)
- No status changes

## Check When Done

- Presidents can edit; Secretaries and members cannot (403 from the API, tab hidden in the UI)
- Duplicate names are rejected with a field error
- One audit row per edit
- `npm run build` passes
