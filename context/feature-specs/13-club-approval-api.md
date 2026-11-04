Build the two-stage approval workflow backend. Advisor reviews first, then an admin gives final approval.

## Routes

- `GET /api/reviews`, the current user's review queue
  - ADVISOR: clubs assigned to them whose ADVISOR stage is `PENDING`
  - ADMIN: clubs whose ADMIN stage is `PENDING`
  - Others: `403`
- `POST /api/clubs/[clubId]/review`, record a decision

## Decision Rules

Body: `{ decision: "APPROVED" | "REJECTED", comment? }`. A comment of at least 5 characters is required for rejection.

The stage is determined from the club's current pending approval row. The caller must be authorized for that stage (the assigned advisor for ADVISOR, an admin for ADMIN). Return `409 INVALID_STATE` if no pending stage exists or the club is not `PENDING`.

In one transaction:

- Update the approval row with decision, reviewer, comment, and `decidedAt`.
- If the ADVISOR stage is `APPROVED`: create the ADMIN approval row with decision `PENDING`.
- If the ADMIN stage is `APPROVED`: transition the club to `ACTIVE` using the transition map.
- If either stage is `REJECTED`: transition the club to `REJECTED`.
- Write audit entry `approval.decided` with stage and decision in metadata, plus `club.activated` or `club.rejected` when the club status changes.

After commit:

- Advisor approved: notify all admins (`CLUB_REVIEW_REQUESTED`, href `/reviews`).
- Final decision: notify the proposer (`CLUB_DECISION`, href to the club page, include the comment for rejections).

## Scope Limits

- No UI
- No resubmission. REJECTED is terminal.

## Check When Done

- Only the assigned advisor can decide the advisor stage; only admins the admin stage
- The admin stage cannot be decided before the advisor approves
- Rejection requires a comment and sets the club to REJECTED
- Final approval sets the club to ACTIVE
- Audit rows and notifications are created
- `npm run build` passes
