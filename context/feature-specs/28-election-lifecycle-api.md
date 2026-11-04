Build election setup, nomination, and the status lifecycle. Voting and results are later specs.

## Routes

- `POST /api/clubs/[clubId]/elections`, create a DRAFT election
- `GET /api/clubs/[clubId]/elections`, list for the club
- `GET /api/elections/[electionId]`, detail
- `PATCH /api/elections/[electionId]`, edit title and windows
- `POST /api/elections/[electionId]/status`, body `{ status }`
- `POST /api/elections/[electionId]/candidates`, self-nominate
- `DELETE /api/elections/[electionId]/candidates/me`, withdraw
- `PATCH /api/elections/[electionId]/candidates/[candidateId]`, body `{ decision: "APPROVED" | "REJECTED" }`

## Rules

Create and manage (create, edit, status, candidate decisions): election officer only. The club must be ACTIVE.

Validation (`lib/validation/election.ts`): title 3 to 120, `cycleYear` within the current year plus or minus one, and `nominationClosesAt` ≤ `votingOpensAt` < `votingClosesAt`, all in the future on create. Windows are editable only while DRAFT or NOMINATION.

Read: ACTIVE members of the club, the advisor, and admins. Members see only APPROVED candidates. Officers see all. The response includes `hasVoted` for the caller (from `VoterRecord`). **No vote counts or tallies are returned in this spec.**

Status changes use the transition map:

- `DRAFT → NOMINATION`: notify ACTIVE members (`ELECTION_UPDATE`).
- `NOMINATION → VOTING`: requires at least one APPROVED candidate. Notify ACTIVE members.
- `VOTING → CLOSED`: allowed once `votingOpensAt` has passed.
- Cancel from DRAFT, NOMINATION, or VOTING: notify ACTIVE members. A cancelled election's data is retained.

Self-nomination: ACTIVE member, status NOMINATION, before `nominationClosesAt`. Optional statement up to 500 characters. A previous WITHDRAWN row returns to PENDING. Withdraw is allowed only during NOMINATION.

Candidate decisions are allowed while the election is DRAFT or NOMINATION.

Every action writes an audit entry (`election.created`, `.updated`, `.status_changed`, `candidate.nominated`, `.withdrawn`, `.approved`, `.rejected`) in the same transaction.

## Scope Limits

- No voting, tallies, or results
- No UI

## Check When Done

- Officers can run the lifecycle; members cannot
- Windows validate in order and are locked once voting starts
- Self-nomination and withdrawal obey the status rules
- Members never see tallies or PENDING candidates of others
- Audit rows and notifications are created
- `npm run build` passes
