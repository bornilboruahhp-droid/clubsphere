Add the election data models, transition map, and officer access helper. Backend schema only. No routes and no UI.

## Models

Create `prisma/models/election.prisma`.

Enums: `ElectionStatus` (`DRAFT`, `NOMINATION`, `VOTING`, `CLOSED`, `PUBLISHED`, `CANCELLED`), `CandidateStatus` (`PENDING`, `APPROVED`, `REJECTED`, `WITHDRAWN`).

`Election`:

- `id` UUID, relation to `Club` (cascade delete), `createdById` relation to `User`
- `title`, `cycleYear` (integer)
- `status` default `DRAFT`
- `nominationClosesAt`, `votingOpensAt`, `votingClosesAt`
- optional `publishedAt`
- timestamps
- index on (`clubId`, `cycleYear`)

`Candidate`:

- relations to `Election` (cascade delete) and `User`
- optional `statement`
- `status` default `PENDING`
- `createdAt`
- unique constraint on (`electionId`, `userId`)

`VoterRecord`:

- relations to `Election` (cascade delete) and `User`
- `createdAt`
- unique constraint on (`electionId`, `userId`)
- **No field or relation pointing to `Ballot`.**

`Ballot`:

- relation to `Election` (cascade delete) and `Candidate`
- `tokenHash` String, unique
- index on (`electionId`, `candidateId`)
- **No user reference and no timestamp fields.** Add a short schema comment explaining why.

`ElectionResult`:

- `electionId` unique relation to `Election`
- `totalEligible`, `totalVotes`
- `tally` Json (array of `{ candidateId, name, votes }`)
- optional `winnerCandidateId`
- `publishedById` relation to `User`, `publishedAt`

## Raw SQL Constraint

In the same migration, add the partial unique index so a club has at most one non-cancelled election per `cycleYear`.

## Domain Rules

- Create `lib/elections/transitions.ts` from the map in `architecture-context.md`.
- Add `requireElectionOfficer(user, clubId)` to `lib/access/`: the club's assigned advisor or an admin.
- Add `election.*`, `candidate.*`, and vote-related names to `lib/audit/actions.ts`.

Run `npx prisma migrate dev --name add_elections`.

## Scope Limits

- No routes, no UI
- Do not add timestamps to `Ballot` or any link between `VoterRecord` and `Ballot`

## Check When Done

- Migration applies cleanly including the partial unique index
- Two non-cancelled elections for one club and year are rejected; a cancelled one does not block a new one
- No relation or field exists that links `Ballot` to a user
- `npm run build` passes
