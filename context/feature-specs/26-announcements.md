Let club managers send targeted announcements that appear as in-app notifications.

## Model

Create `prisma/models/announcement.prisma`:

Enum `AnnouncementAudience`: `ALL_MEMBERS`, `EVENT_REGISTRANTS`.

`Announcement`:

- relation to `Club` (cascade delete), `authorId` relation to `User`
- `title`, `body`
- `audience`
- optional `eventId` relation to `Event`
- `createdAt`
- index on (`clubId`, `createdAt`)

Run `npx prisma migrate dev --name add_announcements`.

## Routes

- `POST /api/clubs/[clubId]/announcements`
- `GET /api/clubs/[clubId]/announcements` (cursor-paginated)
- `DELETE /api/clubs/[clubId]/announcements/[announcementId]`

## Rules

- Create and delete: managers and admins. Club must be ACTIVE.
- Read: ACTIVE members, the club advisor, admins.
- Validate: title 3 to 120, body 3 to 2000. `EVENT_REGISTRANTS` requires an `eventId` that belongs to the same club.
- Audience resolution: `ALL_MEMBERS` is every ACTIVE member except the author. `EVENT_REGISTRANTS` is every registration that is not `CANCELLED`.
- After commit, call `notifyUsers` with type `ANNOUNCEMENT` and `href` to the club's Announcements tab.
- Audit entries: `announcement.created` and `announcement.deleted`. No edit route.

## UI

Fill the Announcements tab: feed of announcements, a "New announcement" dialog for managers with an audience select and an event select shown only for registrants, and a confirmed delete.

## Scope Limits

- No email, push, or scheduled sending

## Check When Done

- Announcements reach exactly the intended audience
- Non-managers cannot create or delete
- Registrants audience cannot target another club's event
- Audit rows exist
- `npm run build` passes
