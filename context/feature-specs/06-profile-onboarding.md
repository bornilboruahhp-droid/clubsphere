Users must complete a profile before registering a club or joining one. Build the onboarding page, the profile API, and the redirect guard.

## Routes

- `GET /api/me` already exists. Extend nothing.
- `PATCH /api/me` accepts `studentId` and `department`.

## Rules

- Validate with a Zod schema in `lib/validation/profile.ts`.
- `studentId`: trimmed, required, 3 to 32 characters, unique across users. Return `409 CONFLICT` with a field error when taken.
- `department`: trimmed, required, 2 to 80 characters.
- Users may update their own profile only. Never accept `role` from the client.
- Name and email stay managed by Clerk.

## UI

1. Onboarding page.

   Create `app/(app)/onboarding/page.tsx` with a form for student ID and department using shadcn `Form`. On success, toast and redirect to `/dashboard`.

2. Profile settings.

   Create `app/(app)/profile/page.tsx` showing the same form pre-filled, plus read-only name and email.

3. Guard.

   In the shell layout, if the signed-in user's profile is incomplete, redirect to `/onboarding` for every route except `/onboarding` and `/profile`. Do this on the server.

## Scope Limits

- No audit logging yet (spec 07)
- No club or membership logic

## Check When Done

- New users land on `/onboarding` until the profile is complete
- Duplicate student IDs show a field error
- Role cannot be changed through `PATCH /api/me`
- Completed users are not redirected
- `npm run build` passes
