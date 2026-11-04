# Architecture Context

## Stack

| Layer | Technology | Role | Installed Agent Skill(s) |
| --- | --- | --- | --- |
| Framework | Next.js 15 (App Router) + React 19 + TypeScript | Full-stack app with server/client boundaries | `vercel-react-best-practices`, `nextjs-app-router-patterns`, `vercel-composition-patterns` |
| UI & Design | Tailwind CSS v4 + shadcn/ui | Component composition and styling | `shadcn`, `tailwind-design-system` |
| Forms & Validation | react-hook-form + Zod | Client forms and shared request validation | `zod` |
| Auth | Clerk | Identity, sessions, and route protection | `clerk-nextjs-patterns`, `clerk-setup`, `clerk-custom-ui`, `clerk-backend-api` |
| Database | PostgreSQL + Prisma 6 ORM | Relational persistence with connection pooling | `prisma-client-api`, `prisma-driver-adapter-implementation`, `prisma-orm-setup`, `prisma-cli` |
| Typing | TypeScript 5 | Strict typing and contracts | `typescript-advanced-types` |
| Notifications | Database-backed (in-app) | Notification records fanned out by server code | Follows Next.js and Prisma skills |
| File storage | Not decided | See Open Questions in `progress-tracker.md` | - |
| Deployment | Docker (per proposal) | Separate app and database containers | - |

> [!IMPORTANT]
> The AI agent MUST consult and strictly adhere to the installed agent skills in `.agents/skills/` during every step of implementation. No code is written or refactored without checking the corresponding skill rules for that domain.


## System Boundaries

- `app/` — Pages and layouts. Server Components by default.
- `app/api/` — Authenticated route handlers: validation, authorization, persistence, side effects.
- `lib/prisma.ts` — Prisma client singleton.
- `lib/auth/` — Resolves the current Clerk session to a local `User` record.
- `lib/access/` — Authorization helpers. The only place role and permission rules are written.
- `lib/audit/` — Audit log writer and action name constants.
- `lib/notifications/` — Notification creation helpers.
- `lib/api/` — Response helpers and typed API errors.
- `lib/validation/` — Zod schemas shared by route handlers and forms.
- `lib/data/` — Server-side read queries used by Server Components.
- `lib/<domain>/transitions.ts` — Status transition maps (clubs, events, elections).
- `components/ui/` — shadcn/ui primitives. Protected.
- `components/<domain>/` — Domain UI (`clubs`, `events`, `elections`, `admin`, `layout`).
- `prisma/models/` — Split schema files, one per domain.
- `types/` — Shared TypeScript types and status label maps.

## Route Map

| Route | Audience | Purpose |
| --- | --- | --- |
| `/` | All | Redirects to `/dashboard` (signed in) or `/sign-in` |
| `/sign-in`, `/sign-up` | Public | Clerk auth pages |
| `/onboarding`, `/profile` | Signed in | Complete and edit profile (student ID, department) |
| `/notifications` | Signed in | Full notification list |
| `/dashboard` | Signed in | Personal home: my clubs, upcoming events, pending actions |
| `/clubs` | Signed in | Club directory |
| `/clubs/new` | Signed in | Club registration form |
| `/clubs/[clubId]` | Signed in | Club profile and tabs: members, events, objectives, elections, announcements, settings |
| `/events` | Signed in | Campus event feed |
| `/events/[eventId]` | Signed in | Event detail and registration |
| `/events/[eventId]/check-in` | Signed in | QR check-in landing page |
| `/clubs/[clubId]/events/new`, `.../events/[eventId]`, `.../events/[eventId]/edit` | Managers | Event creation and management |
| `/elections/[electionId]` | Eligible members | Nomination, ballot, results |
| `/reviews` | Advisor, Admin | Club approval queue |
| `/admin`, `/admin/clubs`, `/admin/users`, `/admin/audit` | Admin | Oversight, controls, audit viewer |

Routes use UUIDs in URLs. There are no slugs.

## Data Model

All IDs are UUID strings (`@default(uuid())`) except `User.id`, which is the Clerk user ID. All timestamps are stored in UTC.

| Model | Key fields | Notes |
| --- | --- | --- |
| `User` | id (Clerk ID), email, name, studentId?, department?, role | `role` is `PlatformRole`. Profile is complete when `studentId` and `department` are set. |
| `Club` | name, description, status, proposerId, advisorId | `ClubStatus`: PENDING, ACTIVE, SUSPENDED, REJECTED |
| `ClubApproval` | clubId, stage, decision, reviewerId?, comment?, decidedAt? | One row per stage. Unique on (clubId, stage). |
| `Membership` | clubId, userId, role, status | Unique on (clubId, userId). Rejoining reuses the row. |
| `ClubObjective` | clubId, title, description?, status, targetDate? | `ObjectiveStatus`: PLANNED, IN_PROGRESS, ACHIEVED, DROPPED |
| `ClubObjectiveUpdate` | objectiveId, authorId, note | Progress timeline |
| `Event` | clubId, title, description, location, startsAt, endsAt, capacity?, visibility, status, createdById | `EventStatus`: DRAFT, PUBLISHED, CANCELLED, COMPLETED |
| `EventRegistration` | eventId, userId, status, statusChangedAt, checkedInAt? | `AttendanceStatus`: REGISTERED, PRESENT, ABSENT, CANCELLED. Unique on (eventId, userId). |
| `Announcement` | clubId, authorId, title, body, audience, eventId? | `AnnouncementAudience`: ALL_MEMBERS, EVENT_REGISTRANTS |
| `Notification` | userId, type, title, body?, href?, readAt? | In-app only |
| `Election` | clubId, cycleYear, title, status, nominationClosesAt, votingOpensAt, votingClosesAt, createdById, publishedAt? | `ElectionStatus`: DRAFT, NOMINATION, VOTING, CLOSED, PUBLISHED, CANCELLED |
| `Candidate` | electionId, userId, statement?, status | `CandidateStatus`: PENDING, APPROVED, REJECTED, WITHDRAWN. Unique on (electionId, userId). |
| `VoterRecord` | electionId, userId | Proves a user voted. No link to a ballot. Unique on (electionId, userId). |
| `Ballot` | electionId, candidateId, tokenHash | No user reference and no timestamp. `tokenHash` is unique. |
| `ElectionResult` | electionId (unique), totalEligible, totalVotes, tally (Json), winnerCandidateId?, publishedById, publishedAt | Immutable once written |
| `AuditLog` | actorId?, action, entityType, entityId, clubId?, metadata?, createdAt | Append-only. `clubId` is set for every club-scoped action. |

### Enums

- `PlatformRole`: STUDENT, ADVISOR, ADMIN
- `ClubRole`: PRESIDENT, TREASURER, SECRETARY, MEMBER
- `MembershipStatus`: PENDING, ACTIVE, REMOVED (a rejected join request is stored as REMOVED)
- `ApprovalStage`: ADVISOR, ADMIN
- `ApprovalDecision`: PENDING, APPROVED, REJECTED
- `EventVisibility`: CAMPUS, MEMBERS_ONLY

### Database constraints beyond Prisma

Prisma cannot express these, so add them as raw SQL inside the relevant migration:

- At most one ACTIVE President per club: partial unique index on `Membership(clubId)` where `role = 'PRESIDENT' AND status = 'ACTIVE'`.
- Club names unique case-insensitively: unique index on `lower("name")`.
- At most one non-cancelled election per club per cycle year: partial unique index on `Election(clubId, cycleYear)` where `status <> 'CANCELLED'`.

## Permission Matrix

"Manager" means ACTIVE President or Secretary of that club. "Officer" means ACTIVE President, Secretary, or Treasurer.

| Action | Who |
| --- | --- |
| Submit club registration | Signed-in user with a complete profile |
| View a PENDING or REJECTED club | Proposer, assigned advisor, admin |
| Advisor-stage review | The club's assigned advisor |
| Admin-stage review | Admin |
| Edit club profile | President; admin override |
| Request to join an ACTIVE club | Signed-in user with a complete profile |
| Approve or reject join requests, remove members | Manager |
| Assign Treasurer or Secretary | President |
| Change President | Election result publication or admin only |
| Create, edit, publish, cancel events | Manager |
| Mark attendance, generate check-in QR | Manager |
| Post announcements | Manager |
| Manage club objectives | Manager |
| Register for an event | Signed-in user. MEMBERS_ONLY events require ACTIVE membership. |
| Create, open, close, publish, cancel an election | Election officer: the club's advisor or an admin |
| Approve or reject candidates | Election officer |
| Self-nominate | ACTIVE member while status is NOMINATION |
| Vote | ACTIVE member while status is VOTING and inside the voting window |
| Club analytics | Officer, club advisor, admin |
| System analytics, user roles, suspend clubs, audit log | Admin |

## Status Transitions

Each entity has one transition map in `lib/<domain>/transitions.ts`. No code writes a status directly without going through it.

- Club: PENDING → ACTIVE, REJECTED. ACTIVE → SUSPENDED. SUSPENDED → ACTIVE. REJECTED is terminal.
- Event: DRAFT → PUBLISHED, CANCELLED. PUBLISHED → CANCELLED, COMPLETED.
- Election: DRAFT → NOMINATION → VOTING → CLOSED → PUBLISHED. DRAFT, NOMINATION, VOTING → CANCELLED.
- Attendance: REGISTERED → PRESENT, ABSENT, CANCELLED. PRESENT ↔ ABSENT may be corrected by a manager. CANCELLED → REGISTERED (re-register).

## Auth Model

- Clerk owns identity. The app never stores credentials.
- `User.id` equals the Clerk user ID. The local `User` row is created on first authenticated request by `lib/auth/get-current-user.ts` (upsert from Clerk profile).
- `User.role` (PlatformRole) lives in the database, not in Clerk metadata. The first admin is promoted by the Prisma seed script.
- Route protection happens at the Clerk request interceptor. Authorization happens in route handlers and server components through `lib/access/`.

## Audit and Notification Model

- Every state-changing action writes an `AuditLog` row inside the same database transaction as the change.
- Notifications are side effects created after the transaction commits. A failed notification must never roll back or fail the main action.
- In-app notification fan-out uses `createMany` inside the request. Email and push are out of scope.

## Election Integrity Model

- Eligibility is checked at cast time: ACTIVE membership, status VOTING, inside `votingOpensAt`..`votingClosesAt`.
- Casting a vote is one transaction: insert `VoterRecord` (unique per election and user) and insert `Ballot`. A duplicate triggers the unique constraint and returns 409.
- `Ballot` has no user reference and no timestamp. `VoterRecord` has no ballot reference. The two tables cannot be joined to reveal a vote.
- `Ballot.tokenHash` is the SHA-256 of a random receipt token shown once to the voter. Raw tokens are never stored.
- Status transitions are manual (officer actions). The voting window is enforced at cast time, so no scheduler or background job is required.
- Publishing computes and stores `ElectionResult`, applies the presidency change, and writes audit entries in one transaction. After that, the election, candidates, and result are read-only.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk keys |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Clerk auth routes |
| `SEED_ADMIN_EMAIL` | Email promoted to ADMIN by the seed script (spec 04) |
| `CHECKIN_SECRET` | HMAC secret for QR check-in tokens (spec 25) |

Do not rename or invent environment variables beyond this table without updating this file.

## Invariants

1. Request handlers do no long-running work. Anything slow or batchy needs an approved background mechanism first (none exists yet).
2. Authentication and authorization are enforced at every mutation boundary through `lib/access/`.
3. Every state-changing action writes an audit log entry in the same transaction, with `clubId` for club-scoped actions.
4. Status changes go through the transition map for that entity.
5. `AuditLog` is append-only: no update or delete code path exists.
6. Ballot secrecy: no code path joins `Ballot` to a user.
7. One vote per eligible member per election, enforced by a database unique constraint.
8. Published election results are immutable.
9. One ACTIVE membership per (club, user). One ACTIVE President per club, enforced by a partial unique index.
10. Client components are used only where browser interactivity requires them.
11. Request validation uses the Zod schema in `lib/validation/`, shared with the form.
12. Timestamps are stored in UTC and formatted for display in the institution timezone.
