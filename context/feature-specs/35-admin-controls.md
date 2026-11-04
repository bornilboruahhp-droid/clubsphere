Give administrators the oversight controls: club suspension, advisor reassignment, and platform role management.

## Routes

- `POST /api/admin/clubs/[clubId]/suspend`, body `{ reason }`
- `POST /api/admin/clubs/[clubId]/reactivate`
- `PATCH /api/admin/clubs/[clubId]/advisor`, body `{ advisorId }`
- `GET /api/admin/users` (`?q=`, `?role=`, cursor-paginated)
- `PATCH /api/admin/users/[userId]/role`, body `{ role }`

## Rules

All routes: admin only.

Suspend and reactivate:

- Use the club transition map (ACTIVE ↔ SUSPENDED). Suspension requires a reason of at least 5 characters.
- Notify ACTIVE members and the advisor. Audit `club.suspended` and `club.reactivated` with the reason in metadata.
- Existing mutation routes already require ACTIVE clubs, so suspended clubs become read-only. Verify this holds for membership requests, events, registrations, announcements, objectives, and elections.

Advisor reassignment:

- The new advisor must have role ADVISOR. Allowed for PENDING and ACTIVE clubs. If an ADVISOR approval is pending, the new advisor inherits the review.
- Notify old and new advisors. Audit `club.advisor_changed`.

Role changes:

- Allowed roles: STUDENT, ADVISOR, ADMIN.
- An admin cannot remove their own admin role if they are the last admin.
- A user who is the assigned advisor of any PENDING or ACTIVE club cannot be moved away from ADVISOR (`409`, with a message naming the clubs).
- Audit `user.role_changed` with old and new role in metadata.

## UI

- `app/(app)/admin/clubs/page.tsx`: table of all clubs with status filter, search, and row actions (Suspend, Reactivate, Change advisor, Open).
- `app/(app)/admin/users/page.tsx`: user table with search, role filter, and a role select per row with confirmation.
- Reason and confirmation dialogs use `AlertDialog` or `Dialog` per `ui-context.md`.

## Scope Limits

- No user deletion or banning (handled in Clerk)

## Check When Done

- Suspended clubs reject member and event mutations
- The last admin cannot demote themselves
- Advisors with assigned clubs cannot be demoted
- Every action is audited and notifies affected users
- `npm run build` passes
