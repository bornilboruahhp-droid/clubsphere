# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

Foundation setup complete. Agent skills from skills.sh installed and configured. Ready to proceed with feature specs following mandatory agent skills discipline.

## Current Goal

Implement feature specs in sequence starting with `feature-specs/01-design-system.md` using the installed agent skills in `.agents/skills/`.

## Completed

- Authored the `context/` directory: project overview, architecture, workflow rules, code standards, UI context, and feature specs 01 to 37.
- Initialized Next.js 15 App Router boilerplate with React 19, TypeScript, Tailwind CSS v4, Prisma 6 (PostgreSQL with `@prisma/adapter-pg` connection pool), Clerk Auth (`middleware.ts`), and Zod validation.
- Verified build and TypeScript compilation (`npm run build`) passing with zero errors.
- Installed and configured 15 required Agent Skills from `skills.sh` into `.agents/skills/` (tracked in `skills-lock.json`).
- Updated context files (`ai-workflow-rules.md`, `code-standards.md`, `architecture-context.md`) mandating that the AI agent uses the installed skills during every implementation step.

## In Progress

- None

## Next Up

- Implement `01-design-system.md` (using `shadcn` and `tailwind-design-system` skills)
- Implement `02-app-shell.md` (using `vercel-react-best-practices` and `nextjs-app-router-patterns`)
- Implement `03-auth.md` (using `clerk-nextjs-patterns` and `clerk-setup`)


## Feature Spec Checklist

Mark a spec done only when it works end to end and `npm run build` passes.

### Foundation

- [ ] `01-design-system.md` — shadcn/ui, tokens, light and dark themes, utilities
- [ ] `02-app-shell.md` — Navbar, role-aware sidebar, placeholder routes
- [ ] `03-auth.md` — Clerk provider, auth pages, route protection
- [ ] `04-prisma-foundation.md` — Prisma setup, User model, client singleton, admin seed
- [ ] `05-user-sync-access.md` — Current user, API helpers, access helpers, /api/me
- [ ] `06-profile-onboarding.md` — Student ID and department, onboarding guard
- [ ] `07-audit-log.md` — Append-only audit model and writer
- [ ] `08-notifications-backend.md` — Notification model, helpers, routes
- [ ] `09-notifications-ui.md` — Bell, dropdown, notifications page

### Clubs, Membership, Governance

- [ ] `10-club-membership-schema.md` — Club, approval, membership, objective models
- [ ] `11-club-registration-api.md` — Submit registration, club reads, advisor list
- [ ] `12-club-registration-ui.md` — Registration form, approval timeline, status page
- [ ] `13-club-approval-api.md` — Two-stage advisor and admin review
- [ ] `14-club-approval-ui.md` — Review queue and decision dialog
- [ ] `15-club-directory.md` — Discover, My Clubs, club page shell
- [ ] `16-club-profile-edit.md` — President edits club profile
- [ ] `17-membership-api.md` — Join, decide, roles, remove, leave
- [ ] `18-membership-ui.md` — Join button, roster, requests, role management
- [ ] `19-club-objectives.md` — Objectives and progress updates

### Events and Communication

- [ ] `20-event-schema-api.md` — Event models, CRUD, status changes
- [ ] `21-event-management-ui.md` — Club event screens and status actions
- [ ] `22-event-registration-api.md` — Register, cancel, capacity-safe
- [ ] `23-event-discovery-ui.md` — Event feed, detail, register button
- [ ] `24-attendance.md` — Manual, bulk, and finalize attendance
- [ ] `25-qr-checkin.md` — Rotating QR and self check-in
- [ ] `26-announcements.md` — Targeted announcements with notifications

### Elections

- [ ] `27-election-schema.md` — Election, candidate, voter record, ballot, result models
- [ ] `28-election-lifecycle-api.md` — Setup, nomination, status lifecycle
- [ ] `29-election-management-ui.md` — Elections tab, election page, officer actions
- [ ] `30-voting.md` — Secret ballot casting and receipts
- [ ] `31-election-results.md` — Tally, publish, presidency transfer, archive

### Analytics, Administration, Delivery

- [ ] `32-admin-dashboard.md` — System analytics and exception lists
- [ ] `33-club-analytics.md` — Club analytics tab
- [ ] `34-reports-export.md` — CSV exports
- [ ] `35-admin-controls.md` — Suspend, advisor reassignment, user roles
- [ ] `36-audit-log-viewer.md` — Admin audit viewer and club history
- [ ] `37-docker-deployment.md` — Dockerfile, compose, migrations, docs

## Open Questions

Each question has a proposed default. Specs are written against the defaults. If a default is changed, update the affected context files before implementing.

| # | Question | Proposed default | Affects |
| --- | --- | --- | --- |
| 1 | Which Next.js version is installed, and does it use `proxy.ts` or `middleware.ts`? | Resolved: Next.js 15.5+ installed with `middleware.ts` and `proxy.ts` re-export. | 03 |
| 2 | Where are club documents (constitution, proof) stored? | **Blocked.** Uploads are excluded until a provider (Vercel Blob, S3, UploadThing) is chosen. | 11, 12 |
| 3 | Are email or push notifications required? | In-app only for now | 08, 26 |
| 4 | What is the hosting target? | Docker containers as in the proposal | 37 |
| 5 | Are advisors pre-provisioned by an admin (platform role ADVISOR) and chosen by the proposer at registration? | Yes | 11, 13, 35 |
| 6 | Can a REJECTED club resubmit? | No. REJECTED is terminal. The proposer submits a new registration. | 13 |
| 7 | Who is the election officer? | The club's advisor, or an admin | 27, 28 |
| 8 | Who can vote and stand? | Any ACTIVE member votes. Members self-nominate and the officer approves. No minimum membership length. | 28, 30 |
| 9 | What happens on a tied election? | Publishing is blocked. The officer cancels and runs a new election. | 31 |
| 10 | Is a single approved candidate enough to open voting? | Yes, at least one approved candidate | 28 |
| 11 | Does the Treasurer have write permissions? | No. Treasurer has read access to rosters, attendance, and analytics only. | 17, 33 |
| 12 | Can a club have several Secretaries or Treasurers? | No. One holder per office. Assigning replaces the previous holder. | 17 |
| 13 | Are events visible to the whole campus or members only? | Per event, default CAMPUS | 20, 23 |
| 14 | Which timezone should dates display in? | `Asia/Kolkata`, set in `lib/config.ts` | 01 |
| 15 | Should sign-up be limited to institutional email addresses? | Configure in the Clerk dashboard. No app-level rule. | 03 |
| 16 | Is there a limit on how many clubs a student can join or lead? | No limit | 11, 17 |

## Architecture Decisions

- Stack is Next.js (App Router), PostgreSQL with Prisma, and Clerk. This overrides the proposal's React/Vue, Node/Python, and MySQL alternatives.
- `User.id` is the Clerk user ID. Platform roles (STUDENT, ADVISOR, ADMIN) live in the database, and the first admin is created by the seed script.
- Club roles (PRESIDENT, TREASURER, SECRETARY, MEMBER) live on `Membership`. One ACTIVE President per club is enforced by a partial unique index.
- Approval routing is two stages: the club's advisor, then an admin. Each stage is a `ClubApproval` row.
- Authorization lives only in `lib/access/`. Status changes go through per-entity transition maps.
- Every state-changing action writes an `AuditLog` row in the same transaction, with `clubId` for club-scoped actions.
- Ballot secrecy comes from schema design: `Ballot` has no user or timestamp, `VoterRecord` has no ballot link, and a unique constraint enforces one vote.
- Election status changes are manual officer actions, and the voting window is enforced at cast time, so no scheduler or background job is needed.
- Notifications are in-app and created after the transaction commits.
- Use shadcn/ui with Tailwind and a token-based light and dark theme.

## Session Notes

