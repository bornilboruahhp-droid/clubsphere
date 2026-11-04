The database and auth are ready. Build the current-user resolver, the authorization helper layer, and the API response helpers. These are reused by every later spec.

## Implementation

1. Current user.

   Create `lib/auth/get-current-user.ts`.
   - Read the Clerk session. Return `null` when unauthenticated.
   - Upsert the local `User` row keyed by Clerk user ID, copying email and name from Clerk. Never overwrite `role`, `studentId`, or `department` on update.
   - Export `requireUser()` which throws an `UNAUTHENTICATED` error when there is no user.

2. API helpers.

   Create `lib/api/errors.ts` with a typed `ApiError` carrying `code`, `status`, `message`, and optional `fields`, plus factory functions for each error code in `code-standards.md`.

   Create `lib/api/response.ts` with `ok(data, init?)`, `paginated(data, nextCursor)`, and `handleError(err)` that maps `ApiError`, `ZodError`, and unknown errors to the response shapes in `code-standards.md`. Unknown errors return a generic 500 and never leak internals.

3. Access helpers.

   Create `lib/access/` with small, single-purpose functions that take a user and resource ids and either return the needed record or throw an `ApiError`:
   - `requireAdmin(user)`
   - `requireProfileComplete(user)`
   - `getClubMembership(userId, clubId)` returning the ACTIVE membership or `null`
   - `requireClubManager(user, clubId)` (ACTIVE President or Secretary, or admin)
   - `requireClubPresident(user, clubId)`
   - `requireClubOfficer(user, clubId)` (President, Secretary, Treasurer)
   - `requireClubAdvisor(user, clubId)` (assigned advisor)

   Club-dependent helpers may be stubbed to throw `NOT_FOUND` until the `Club` and `Membership` models exist (spec 10). Add unit-level TODO comments marking the stubs.

4. Current user endpoint.

   Create `GET /api/me` returning the current user's id, name, email, role, studentId, department, and `profileComplete`.

5. Wire the shell.

   Update the app shell to read the user's real role and pass it to the sidebar nav filter.

## Scope Limits

- No club, membership, or event logic
- Do not add new database models

## Check When Done

- First sign-in creates exactly one `User` row; repeat sign-ins do not duplicate it
- `GET /api/me` returns `401` when signed out and the user shape when signed in
- Error and success shapes match `code-standards.md`
- Sidebar items follow the real role
- `npm run build` passes
