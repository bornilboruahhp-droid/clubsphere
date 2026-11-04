Build the membership backend: join requests, decisions, role assignment, removal, and leaving.

## Routes

- `POST /api/clubs/[clubId]/members`, request to join
- `GET /api/clubs/[clubId]/members`, roster (`?status=ACTIVE|PENDING`)
- `PATCH /api/clubs/[clubId]/members/[membershipId]`, decide, change role, or remove
- `DELETE /api/clubs/[clubId]/members/me`, leave the club

## Rules

Join request:

- Club must be ACTIVE. Caller needs a complete profile.
- No row: create `PENDING`. Existing `REMOVED`: set back to `PENDING`. Existing `PENDING` or `ACTIVE`: `409`.
- Notify managers (`MEMBERSHIP_REQUEST`).

Roster visibility:

- ACTIVE roster: members, advisor, admin. Members see name, role, and joined date only.
- Managers, officers, advisor, and admin also see email and student ID.
- PENDING list: managers and admin only.
- Everyone else: `404`.

PATCH body is a discriminated union validated with Zod:

- `{ action: "approve" }` or `{ action: "reject" }` on a PENDING membership. Manager only. Approve sets `ACTIVE` and `joinedAt`. Reject sets `REMOVED`.
- `{ action: "remove" }` on an ACTIVE membership. Managers may remove MEMBERs. Only the President may remove Treasurer or Secretary. Nobody may remove the President through this route.
- `{ action: "set_role", role }`. President only. Allowed roles: `TREASURER`, `SECRETARY`, `MEMBER`. The target must be ACTIVE. Only one holder per office: assigning replaces the previous holder, who becomes `MEMBER`, in the same transaction.

Leave: any ACTIVE non-President member sets their own membership to `REMOVED`. The President must have the role transferred first (through an election or admin).

Every mutation writes an audit entry (`membership.requested`, `.approved`, `.rejected`, `.removed`, `.left`, `.role_changed`) in the same transaction. After commit, notify the affected user (`MEMBERSHIP_DECISION` or `ROLE_CHANGED`).

## Scope Limits

- No UI
- Presidency transfer is not handled here

## Check When Done

- Join, approve, reject, remove, leave, and role changes work within the permission rules
- A second ACTIVE President can never be created
- Secretaries cannot remove the Treasurer or change roles
- Roster fields respect the visibility rules
- Audit rows and notifications are created
- `npm run build` passes
