Build secret ballot casting. This is the integrity-critical unit. Be exact.

## Routes

- `POST /api/elections/[electionId]/vote`, body `{ candidateId }`
- `GET /api/elections/[electionId]/vote/status`, returns `{ data: { hasVoted } }`
- `POST /api/elections/[electionId]/receipts/verify`, body `{ token }`, returns `{ data: { valid } }`

## Casting Rules

Check in this order and return the matching error:

1. Authenticated. `401` otherwise.
2. Caller has an ACTIVE membership in the election's club. `403` otherwise.
3. Election status is `VOTING` and the server time is within `votingOpensAt` and `votingClosesAt`. `409 INVALID_STATE` otherwise.
4. `candidateId` belongs to this election with status `APPROVED`. `400` otherwise.

Then, in **one transaction**:

1. Insert `VoterRecord(electionId, userId)`. If the unique constraint fails, return `409 CONFLICT` ("already voted").
2. Generate a 32-byte random token (base64url) and compute its SHA-256 hash.
3. Insert `Ballot(electionId, candidateId, tokenHash)`.
4. Write audit entry `election.vote_cast` with the election as the entity and the user as the actor. **Do not include the candidate in the audit entry, logs, or any response field other than the receipt.**

Respond with `{ data: { receiptToken } }`. The raw token is returned exactly once and is never stored.

Receipt verification returns whether a `Ballot` with that token's hash exists in the election. It never reveals the candidate and does not identify the voter.

## UI

- On the election page during VOTING, show the ballot panel for ACTIVE members who have not voted: radio list of APPROVED candidates ordered alphabetically, with statements.
- Voting requires a confirmation `AlertDialog` stating that the vote is final and cannot be changed.
- After voting, show a "Your vote has been recorded" state and the receipt token with a copy button and a warning that it is shown only once.
- Members who already voted see the recorded state without the token.
- Show a small "Verify receipt" input for members.
- Ballot form must be fully keyboard accessible.

## Scope Limits

- No tallies, counts, or live results anywhere
- Never add a code path that joins `Ballot` to a user or `VoterRecord`

## Check When Done

- A member can vote once; a second attempt returns `409`
- Concurrent duplicate requests result in exactly one ballot
- Non-members, closed windows, and unapproved candidates are rejected
- The database has no way to map a ballot to a voter (verify by inspecting the schema)
- The receipt token is not stored and not logged
- `npm run build` passes
