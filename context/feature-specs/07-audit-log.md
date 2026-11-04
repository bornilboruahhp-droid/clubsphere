Add the append-only audit trail. This unit creates the model and the writer only. No viewer UI yet.

## Model

Create `prisma/models/audit.prisma`.

`AuditLog`:

- `id` UUID
- optional `actorId` (a `User` id, null for system actions)
- `action` String (dot-separated, such as `club.approved`)
- `entityType` String
- `entityId` String
- optional `clubId` (plain string, set for any club-scoped action)
- optional `metadata` Json
- `createdAt`
- indexes on (`entityType`, `entityId`), (`actorId`, `createdAt`), (`clubId`, `createdAt`), and `createdAt`

Do not add foreign keys from `actorId` or `clubId` that would block deletion. Store them as plain strings with indexes.

## Writer

Create `lib/audit/log.ts` exporting `logAudit(tx, entry)`.

- `tx` is a Prisma transaction client, so callers write the audit row in the same transaction as the change.
- `entry` is `{ actorId, action, entityType, entityId, clubId?, metadata? }`.
- Any action on a club or on something that belongs to a club (membership, event, attendance, announcement, objective, election, candidate) must pass `clubId`. Spec 36 builds club history from it.
- The function only inserts.

Create `lib/audit/actions.ts` exporting a const object of action names, grouped by domain. Start with `user.profile_updated`. Later specs add their own.

## Wire-up

Update `PATCH /api/me` to write `user.profile_updated` (metadata lists changed field names, not values) in a transaction.

## Scope Limits

- Do not create any update or delete function for audit rows
- No UI

## Check When Done

- `AuditLog` migration applies cleanly
- Updating a profile writes exactly one audit row in the same transaction
- No code path updates or deletes audit rows
- `npm run build` passes
