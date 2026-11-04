The schema is ready. Build the club registration backend and the read routes needed to find a club and an advisor.

## Routes

- `POST /api/clubs`, submit a registration
- `GET /api/clubs`, list ACTIVE clubs (supports `?q=` name search and cursor pagination)
- `GET /api/clubs/mine`, clubs where the user has any membership, plus clubs they proposed, with status
- `GET /api/clubs/[clubId]`, club detail
- `GET /api/advisors`, list users with role ADVISOR (id, name, department) for the advisor selector

## Submission Rules

Validate with `lib/validation/club.ts`:

- `name`: trimmed, 3 to 80 characters
- `description`: 20 to 2000 characters
- `advisorId`: must be an existing user with role ADVISOR
- `objectives`: 1 to 5 titles, each 3 to 120 characters

Authorization: signed-in user with a complete profile.

On success, in one transaction:

1. Create `Club` with status `PENDING`, proposer set to the caller.
2. Create the proposer's `Membership` with role `PRESIDENT` and status `ACTIVE`.
3. Create `ClubObjective` rows (status `PLANNED`).
4. Create `ClubApproval` for stage `ADVISOR` with decision `PENDING`.
5. Write audit entry `club.submitted`.

After commit, notify the advisor (`CLUB_REVIEW_REQUESTED`) with `href` to `/reviews`.

Duplicate names (case-insensitive) return `409` with a field error on `name`.

## Visibility Rules for `GET /api/clubs/[clubId]`

- ACTIVE clubs: any signed-in user
- SUSPENDED: members and admins only
- PENDING and REJECTED: proposer, assigned advisor, admin only. Everyone else gets `404`.
- Response includes approval stages and decisions only for those who can view a PENDING or REJECTED club.

## Scope Limits

- No UI
- No approval decisions (spec 13)
- No document uploads (blocked by the storage open question)

## Check When Done

- Submitting creates the club, president membership, objectives, and advisor approval row atomically
- A non-advisor `advisorId` is rejected
- Case-variant duplicate names are rejected with `409`
- PENDING clubs return `404` to unrelated users
- Audit row `club.submitted` exists
- `npm run build` passes
