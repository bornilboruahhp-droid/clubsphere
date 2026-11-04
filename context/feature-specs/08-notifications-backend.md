Build the backend for in-app notifications. No UI yet.

## Model

Create `prisma/models/notification.prisma`.

Enum `NotificationType`: `CLUB_REVIEW_REQUESTED`, `CLUB_DECISION`, `MEMBERSHIP_REQUEST`, `MEMBERSHIP_DECISION`, `ROLE_CHANGED`, `EVENT_PUBLISHED`, `EVENT_CANCELLED`, `ANNOUNCEMENT`, `ELECTION_UPDATE`.

`Notification`:

- `id` UUID
- `userId` relation to `User`, cascade delete
- `type`
- `title`
- optional `body`
- optional `href` (an in-app path)
- optional `readAt`
- `createdAt`
- indexes on (`userId`, `createdAt`) and (`userId`, `readAt`)

Later specs may add enum values through their own migrations.

## Helpers

Create `lib/notifications/notify.ts`:

- `notifyUser(input)` creates one notification
- `notifyUsers(userIds, input)` uses `createMany`
- Both swallow and log errors. A notification failure must never throw into the caller.

## Routes

- `GET /api/notifications`: current user's notifications, newest first, cursor-paginated. Supports `?unread=true`.
- `GET /api/notifications/unread-count`: returns `{ data: { count } }`.
- `POST /api/notifications/[notificationId]/read`: marks one as read. Only the owner may do this.
- `POST /api/notifications/read-all`: marks all of the current user's notifications as read.

## Scope Limits

- No UI
- No email or push
- Do not call `notify*` from other features yet

## Check When Done

- Migration applies cleanly
- Users can only read and mark their own notifications
- Unread count updates after marking read
- `notifyUsers` failure does not throw
- `npm run build` passes
