Add the club, approval, membership, and objective data models. Backend schema and access helpers only. No routes and no UI.

## Models

Create `prisma/models/club.prisma`.

Enums: `ClubStatus` (`PENDING`, `ACTIVE`, `SUSPENDED`, `REJECTED`), `ApprovalStage` (`ADVISOR`, `ADMIN`), `ApprovalDecision` (`PENDING`, `APPROVED`, `REJECTED`), `ClubRole` (`PRESIDENT`, `TREASURER`, `SECRETARY`, `MEMBER`), `MembershipStatus` (`PENDING`, `ACTIVE`, `REMOVED`), `ObjectiveStatus` (`PLANNED`, `IN_PROGRESS`, `ACHIEVED`, `DROPPED`).

`Club`:

- `id` UUID, `name`, `description`
- `status` default `PENDING`
- `proposerId` and `advisorId` relations to `User`
- timestamps
- indexes on `status` and `advisorId`

`ClubApproval`:

- relation to `Club` with cascade delete
- `stage`, `decision` (default `PENDING`)
- optional `reviewerId` relation to `User`, optional `comment`, optional `decidedAt`
- `createdAt`
- unique constraint on (`clubId`, `stage`)

`Membership`:

- relations to `Club` (cascade delete) and `User`
- `role` default `MEMBER`, `status` default `PENDING`
- optional `joinedAt`, optional `removedAt`
- timestamps
- unique constraint on (`clubId`, `userId`)
- indexes on (`clubId`, `status`) and `userId`

`ClubObjective`:

- relation to `Club` with cascade delete
- `title`, optional `description`, `status` default `PLANNED`, optional `targetDate`
- timestamps
- index on `clubId`

`ClubObjectiveUpdate`:

- relation to `ClubObjective` with cascade delete
- `authorId` relation to `User`
- `note`, `createdAt`
- index on (`objectiveId`, `createdAt`)

## Raw SQL Constraints

In the same migration, add the two club-related constraints from `architecture-context.md`:

- partial unique index so a club has at most one ACTIVE President
- unique index on `lower("name")` for `Club`

## Domain Rules

- Create `lib/clubs/transitions.ts` with the club status transition map and a `canTransition(from, to)` helper.
- Replace the stubs in `lib/access/` with real implementations using the new models: `getClubMembership`, `requireClubManager`, `requireClubPresident`, `requireClubOfficer`, `requireClubAdvisor`. Admin passes manager, president, and officer checks.
- Add `club.*`, `approval.*`, `membership.*`, and `objective.*` names to `lib/audit/actions.ts`.

## Migration

Run `npx prisma migrate dev --name add_club_and_membership` and generate the client.

## Scope Limits

- No routes, no UI
- Do not add fields that are not listed here

## Check When Done

- Migration applies cleanly including the raw SQL indexes
- Inserting two ACTIVE Presidents for one club fails at the database
- Inserting two clubs whose names differ only by case fails
- Access helpers compile and no longer throw stub errors
- `npm run build` passes
