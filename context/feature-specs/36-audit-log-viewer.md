Make audit history visible to the people who need it: admins system-wide, club leadership per club.

## Routes

- `GET /api/admin/audit`: admin only. Filters: `actorId`, `action` (prefix match such as `election.`), `entityType`, `entityId`, `from`, `to`. Cursor-paginated, newest first.
- `GET /api/clubs/[clubId]/history`: officers, the club advisor, admins. Returns audit entries whose `clubId` matches, newest first, cursor-paginated.

Both are read-only. Resolve actor names with a single lookup of the page's actor ids. Do not add a foreign key.

## Rules

- Never return entries for `election.vote_cast` to anyone except admins, and even then return only the existing fields. No candidate data exists in those entries.
- Return only id, action, entity type, entity id, actor name, metadata, and timestamp.

## UI

1. Admin page.

   `app/(app)/admin/audit/page.tsx`: filter bar (action prefix, entity type, actor search, date range), table with timestamp, actor, action, entity, and a "Details" button that opens a dialog with formatted JSON metadata. Cards on mobile.

2. Club history.

   Add a History section in the club Settings area (or an Activity tab) for officers, advisor, and admins using the club route. Show human-readable sentences such as "Alex approved the club" with the timestamp. Keep a mapping of action names to sentences in `lib/audit/describe.ts`.

## Scope Limits

- No editing or deleting entries
- No export

## Check When Done

- Only authorized roles can read each view, including by direct URL
- Filters combine correctly and pagination is stable
- Entries show the actor and timestamp for all earlier features
- `npm run build` passes
