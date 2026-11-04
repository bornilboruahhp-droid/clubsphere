Build counting, publication, presidency transfer, and the archive. Published results are immutable.

## Routes

- `GET /api/elections/[electionId]/tally`, officer preview while status is `CLOSED`
- `POST /api/elections/[electionId]/publish`
- `GET /api/elections/[electionId]/results`, published results

## Tally Preview

Officers and admins only, status `CLOSED` only. Returns per-candidate vote counts for APPROVED candidates, total votes, and current eligible member count. Group `Ballot` by `candidateId`. Never return voter information.

## Publish

Officer or admin, election status `CLOSED`. In **one transaction**:

1. Count ballots per APPROVED candidate and compute `totalVotes`. Compute `totalEligible` as the number of ACTIVE memberships in the club at this moment.
2. If the top spot is tied, abort with `409 INVALID_STATE` and a clear message. Do not choose a winner automatically. Handling is an open question.
3. Verify the winner still has an ACTIVE membership. If not, abort with `409`.
4. Insert `ElectionResult` (tally, totals, winner, publisher).
5. Set the election to `PUBLISHED` and set `publishedAt`.
6. If the winner is not already President: set the current President to `MEMBER` first, then set the winner to `PRESIDENT` (the order matters because of the partial unique index).
7. Write audit entries: `election.published` and, when the President changed, two `membership.role_changed` entries with `via: "election"` in metadata.

After commit, notify ACTIVE members (`ELECTION_UPDATE`) and the winner (`ROLE_CHANGED`).

## Results Read

Returns tally, turnout (`totalVotes` of `totalEligible`), and winner for PUBLISHED elections to ACTIVE members, the advisor, and admins. Before publication return `404`.

## Immutability

After `PUBLISHED`, no route may modify the election, its candidates, ballots, voter records, or result. Add a guard at the top of every election mutation route that rejects PUBLISHED elections with `409 INVALID_STATE`.

## UI

On the election page:

- CLOSED, for officers: a tally preview table and a "Publish result" button with an `AlertDialog` that shows the winner and states that the result is final and the presidency will change.
- PUBLISHED: result panel with the winner highlighted, a bar chart of votes with percentages, and turnout.
- Archive section on the Elections tab links to published results.

## Scope Limits

- No recount or edit tools
- No tie-break workflow

## Check When Done

- Tally preview works only for officers on CLOSED elections
- Publishing writes the result, updates status, and changes the President atomically
- Ties and inactive winners abort without changing anything
- Exactly one ACTIVE President exists after publication
- Members cannot see counts before publication
- Published elections reject every mutation
- `npm run build` passes
