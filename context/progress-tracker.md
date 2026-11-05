# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

Audit log viewer and club history timeline (`feature-specs/36-audit-log-viewer.md`) complete. Ready to proceed with `feature-specs/37-docker-deployment.md`.

## Current Goal

Implement feature spec `feature-specs/37-docker-deployment.md` — Dockerfile, docker-compose, migrations, and deployment documentation.

## Completed

- Authored the `context/` directory: project overview, architecture, workflow rules, code standards, UI context, and feature specs 01 to 37.
- Initialized Next.js 15 App Router boilerplate with React 19, TypeScript, Tailwind CSS v4, Prisma 6 (PostgreSQL with `@prisma/adapter-pg` connection pool), Clerk Auth (`middleware.ts`), and Zod validation.
- Verified build and TypeScript compilation (`npm run build`) passing with zero errors.
- Installed and configured 15 required Agent Skills from `skills.sh` into `.agents/skills/` (tracked in `skills-lock.json`).
- Updated context files (`ai-workflow-rules.md`, `code-standards.md`, `architecture-context.md`) mandating that the AI agent uses the installed skills during every implementation step.
- Implemented `01-design-system.md`:
  - Installed and configured all required shadcn/ui primitives (`button`, `card`, `dialog`, `alert-dialog`, `input`, `textarea`, `label`, `select`, `checkbox`, `tabs`, `table`, `badge`, `avatar`, `separator`, `skeleton`, `sheet`, `dropdown-menu`, `form`, `sonner`, `field`).
  - Defined all color tokens and state variants in `app/globals.css` for `:root` and `.dark`, mapped to Tailwind v4 `@theme inline`.
  - Added `ThemeProvider` and Sonner `Toaster` in `app/layout.tsx`.
  - Created `components/layout/theme-toggle.tsx` supporting light, dark, and system modes.
  - Implemented utilities: `lib/utils.ts` (`cn`), `lib/config.ts` (`INSTITUTION_TIMEZONE`), `lib/format.ts` (`formatDate`, `formatDateTime`, `formatRelative`).
  - Created verification showcase at `app/examples/page.tsx` displaying all components with zero hardcoded palette classes.
  - Verified `npm run build` passes with zero type or lint errors.
- Implemented `02-app-shell.md`:
  - Created navigation config and role filtering in `lib/navigation.ts` (`PlatformRole`, `NavItem`, `NAV_ITEMS`, `getNavItems`).
  - Created reusable layout primitives: `components/layout/page-header.tsx` and `components/layout/empty-state.tsx`.
  - Created fixed top navigation bar `components/layout/app-navbar.tsx` with sidebar toggle, branding, mock role switcher, notification placeholder, `ThemeToggle`, and user menu slot.
  - Created role-aware sidebar `components/layout/app-sidebar.tsx` (persistent on desktop, accessible overlay `Sheet` on mobile) highlighting the active route.
  - Implemented application shell wrapper `components/layout/app-shell.tsx` and route group layout `app/(app)/layout.tsx`.
  - Implemented placeholder pages with headers and empty states for `/dashboard`, `/clubs`, `/events`, `/reviews`, and `/admin`.
  - Verified responsive layouts, mobile sheet behavior, role filtering, token usage, and passed `npm run build` with zero errors.
- Implemented `03-auth.md`:
  - Configured `middleware.ts` (and `proxy.ts` re-export) defining public auth routes dynamically from environment variables and enforcing `await auth.protect()` across all other application routes.
  - Configured `ClerkProvider` in `app/layout.tsx` mapping Clerk appearance variables and elements to design system tokens with zero hardcoded colors.
  - Implemented two-panel responsive layout at `app/(auth)/layout.tsx` (brand and text-only feature list on desktop, clean centered form on mobile).
  - Authored `app/(auth)/sign-in/[[...sign-in]]/page.tsx` and `app/(auth)/sign-up/[[...sign-up]]/page.tsx` as Server Components.
  - Updated root page `app/page.tsx` to evaluate `await auth()`, redirecting authenticated users to `/dashboard` and unauthenticated users to `/sign-in`.
  - Integrated Clerk's `UserButton` into `components/layout/app-navbar.tsx` with custom design token styling.
  - Passed `npm run build` with zero type errors and verified token compliance.
- Implemented `04-prisma-foundation.md`:
  - Installed `tsx` dev dependency for TypeScript script execution.
  - Configured `prisma.config.ts` with multi-file schema support and registered the seed script.
  - Updated `.env.example` and `.env.local` with all system variables including `SEED_ADMIN_EMAIL`.
  - Created base schema `prisma/schema.prisma` and User model at `prisma/models/user.prisma` with `PlatformRole` enum, indexed on `role`.
  - Verified `lib/prisma.ts` singleton handling Accelerate vs direct `@prisma/adapter-pg` driver pooling.
  - Created idempotent seed script `prisma/seed.ts` handling `ADMIN` promotion.
  - Ran migration `20261104092243_init_user`, generated Prisma client, and ran `prisma db seed` twice with 0 errors.
  - Verified `npm run build` passes with zero type or build errors.
- Implemented `05-user-sync-access.md`:
  - Created `lib/auth/get-current-user.ts` with `getCurrentUser()`, `requireUser()`, and `isProfileComplete()` resolving Clerk sessions and syncing with PostgreSQL (upserting name/email while preserving role, studentId, and department).
  - Created `lib/api/errors.ts` (`ApiError` with factory functions for all standard error codes).
  - Created `lib/api/response.ts` (`ok`, `paginated`, `handleError` with Zod mapping and opaque 500 error shields).
  - Created `lib/access/index.ts` with authorization helpers (`requireAdmin`, `requireProfileComplete`, `getClubMembership`, `requireClubManager`, `requireClubPresident`, `requireClubOfficer`, `requireClubAdvisor`).
  - Implemented `GET /api/me` returning current user profile and `profileComplete` status.
  - Wired real user role into `app/(app)/layout.tsx` and `components/layout/app-shell.tsx` for dynamic role-based navigation.
  - Verified build and type check passing with zero errors.
- Implemented `06-profile-onboarding.md`:
  - Created Zod validation schema in `lib/validation/profile.ts` enforcing trimmed `studentId` (3-32 chars) and `department` (2-80 chars) while strictly omitting `role`.
  - Implemented `PATCH /api/me` handling self-service profile updates with `studentId` uniqueness check returning 409 `CONFLICT` on duplicate.
  - Created reusable `ProfileForm` component with shadcn `Form` and field-level error mapping.
  - Built `app/(app)/onboarding/page.tsx` for new user completion and `app/(app)/profile/page.tsx` with read-only identity cards and pre-filled form.
  - Configured server-side redirect guard in `middleware.ts` (`x-pathname` header) and `app/(app)/layout.tsx` routing users with incomplete profiles to `/onboarding`.
  - Verified `npm run build` passes with zero type or build errors.
- Implemented `07-audit-log.md`:
  - Created `AuditLog` model in `prisma/models/audit.prisma` with unconstrained plain string IDs and indexes on `(entityType, entityId)`, `(actorId, createdAt)`, `(clubId, createdAt)`, and `createdAt`.
  - Defined strongly-typed action names in `lib/audit/actions.ts` (`user.profile_updated`).
  - Built append-only transaction writer `logAudit()` in `lib/audit/log.ts`.
  - Applied database migration `20261104094808_add_audit_log` and regenerated client.
  - Wired profile updates in `PATCH /api/me` to log `user.profile_updated` in a single transaction with changed field names in metadata.
  - Verified no update/delete paths exist for audit entries and verified build passed.
- Implemented `08-notifications-backend.md`:
  - Created `Notification` model and `NotificationType` enum in `prisma/models/notification.prisma` with indexes on `(userId, createdAt)` and `(userId, readAt)`.
  - Added reverse relation `notifications Notification[]` on `User` in `prisma/models/user.prisma`.
  - Applied database migration `20261104095307_add_notification` and generated Prisma client.
  - Created safe delivery helpers `notifyUser` and `notifyUsers` in `lib/notifications/notify.ts` that safely swallow and log errors without throwing.
  - Implemented cursor-paginated `GET /api/notifications` supporting `?unread=true` and limit validation with Zod.
  - Implemented `GET /api/notifications/unread-count` returning `{ data: { count } }`.
  - Implemented `POST /api/notifications/[notificationId]/read` verifying ownership and marking single notification read.
  - Implemented `POST /api/notifications/read-all` marking all unread notifications for the user as read.
  - Verified end-to-end functionality via test script and verified `npm run build` exits 0.
- Implemented `09-notifications-ui.md`:
  - Created `components/layout/notification-bell.tsx` with unread count badge (capped at `9+`), 60-second interval polling, and window-focus refresh.
  - Built interactive dropdown preview displaying the latest 10 notifications with unread dots, relative timestamps, single mark-as-read on click, "Mark all read" action, and "View all" navigation.
  - Integrated `NotificationBell` into `components/layout/app-navbar.tsx`.
  - Created `app/(app)/notifications/page.tsx` as a Server Component fetching authenticated notifications.
  - Created `components/notifications/notifications-view.tsx` client component featuring filter tabs ("All" vs "Unread"), batch mark-all-read action, direct link-outs, and fallback to `EmptyState`.
  - Verified cross-component synchronized badge updates without page reload via `notifications:refresh` custom event.
  - Verified build and TypeScript compilation: `npm run build` exits 0 on all 18 routes.
- Implemented `10-club-membership-schema.md`:
  - Created models `Club`, `ClubApproval`, `Membership`, `ClubObjective`, and `ClubObjectiveUpdate` in `prisma/models/club.prisma`.
  - Defined enums `ClubStatus`, `ApprovalStage`, `ApprovalDecision`, `ClubRole`, `MembershipStatus`, and `ObjectiveStatus`.
  - Added reverse relations to `User` in `prisma/models/user.prisma`.
  - Appended PostgreSQL constraints to migration `20261104100906_add_club_and_membership`:
    - Partial unique index on `Membership(clubId)` where `role = 'PRESIDENT' AND status = 'ACTIVE'`.
    - Case-insensitive unique index on `Club(lower("name"))`.
  - Applied migration to PostgreSQL and generated Prisma client.
  - Implemented `lib/clubs/transitions.ts` (`CLUB_TRANSITIONS`, `canTransition`).
  - Implemented full access helpers in `lib/access/index.ts` (`getClubMembership`, `requireClubManager`, `requireClubPresident`, `requireClubOfficer`, `requireClubAdvisor`) with platform ADMIN override access.
  - Expanded `lib/audit/actions.ts` with `club.*`, `approval.*`, `membership.*`, and `objective.*` actions.
  - Verified database constraints, transition rules, and access helpers via automated script.
  - Verified `npm run build` passes with 0 errors across all routes.
- Implemented `11-club-registration-api.md`:
  - Created Zod validation schemas in `lib/validation/club.ts` (`clubRegistrationSchema`, `clubListQuerySchema`).
  - Implemented `POST /api/clubs` registration endpoint executing an atomic transaction:
    - Verifies user profile completion.
    - Validates that `advisorId` belongs to an existing `ADVISOR` user.
    - Checks for case-insensitive duplicate club names (returning 409).
    - Creates `Club` (status `PENDING`), proposer `Membership` (`PRESIDENT`, `ACTIVE`), `ClubObjective` records (`PLANNED`), and `ClubApproval` (`ADVISOR`, `PENDING`).
    - Logs audit action `club.submitted`.
    - Dispatches async notification (`CLUB_REVIEW_REQUESTED`) to the selected advisor after transaction commit.
  - Implemented `GET /api/clubs` listing `ACTIVE` clubs with case-insensitive search (`?q=`) and cursor pagination.
  - Implemented `GET /api/clubs/mine` returning clubs where user has any membership or is the proposer.
  - Implemented `GET /api/clubs/[clubId]` enforcing visibility matrix:
    - `ACTIVE`: Any signed-in user.
    - `SUSPENDED`: Active club members and admins only (404 otherwise).
    - `PENDING` / `REJECTED`: Proposer, assigned advisor, and admins only (404 otherwise).
    - Approval history included only for authorized review viewers.
  - Implemented `GET /api/advisors` returning users with platform role `ADVISOR`.
  - Verified validation, atomic creation, advisor notifications, and visibility restrictions via automated test script.
  - Verified build and TypeScript compilation: `npm run build` exits 0 on all 21 routes.
- Implemented `12-club-registration-ui.md`:
  - Created `components/clubs/status-badge.tsx` rendering semantic badge colors using design tokens (`PENDING`, `ACTIVE`, `SUSPENDED`, `REJECTED`).
  - Created `components/clubs/approval-timeline.tsx` visualizing two-stage review progress (Advisor review, Admin review) with status badges, timestamps, reviewer identity, and comment callout boxes.
  - Created `components/clubs/club-registration-form.tsx` using shadcn `Form` with server field error binding, advisor dropdown selection, and dynamic objective row repeater (1–5).
  - Created Server Component `app/(app)/clubs/new/page.tsx` guarded by profile completion and loading active faculty advisors.
  - Created `app/(app)/clubs/[clubId]/page.tsx` status view displaying mission, objectives, advisor/proposer identity cards, and conditional `ApprovalTimeline` for pending/rejected proposals with strict `notFound()` access guards.
  - Added "Register a club" action buttons on `app/(app)/clubs/page.tsx`.
  - Verified build and TypeScript compilation: `npm run build` exits 0 on all 22 routes.
- Implemented `13-club-approval-api.md`:
  - Defined `clubReviewSchema` in `lib/validation/club.ts` validating `decision` ("APPROVED" | "REJECTED") and enforcing comment >= 5 chars on rejection.
  - Added `ACTIVATED: "club.activated"` and `REJECTED: "club.rejected"` in `lib/audit/actions.ts`.
  - Implemented `GET /api/reviews` returning role-specific pending queues (ADVISOR sees assigned clubs with pending advisor review; ADMIN sees advisor-approved clubs with pending admin review; others receive 403).
  - Implemented `POST /api/clubs/[clubId]/review` executing atomic transactions:
    - Verifies current stage and rejects unauthorized actors (403).
    - Updates `ClubApproval` with reviewer identity, decision, comment, and timestamp.
    - Logs `approval.decided` audit entry.
    - On advisor approval: creates `ADMIN` pending stage.
    - On admin approval: transitions club to `ACTIVE` and logs `club.activated`.
    - On rejection at either stage: transitions club to `REJECTED` and logs `club.rejected`.
    - Post-commit notifications: alerts admins on advisor approval (`CLUB_REVIEW_REQUESTED`); alerts proposer on final decision (`CLUB_DECISION`).
  - Verified role guards, sequential stage progression, rejection validation, audit trails, and notification dispatch via automated script.
  - Verified build and TypeScript compilation: `npm run build` exits 0 on all 23 routes.
- Implemented `14-club-approval-ui.md`:
  - Created `lib/data/reviews.ts` with `getReviewQueue(user)` and `getDecidedReviews(user, limit)` for server components.
  - Created `components/clubs/review-dialog.tsx` client component featuring proposal inspection, charter objective checklist, prior advisor review notes (for admins), feedback textarea, rejection comment validation, and `AlertDialog` confirmation guard.
  - Created `components/clubs/review-queue.tsx` with responsive layout (desktop `Table` and mobile stacked cards) and fallback to `EmptyState`.
  - Created Server Component `app/(app)/reviews/page.tsx` guarded for `ADVISOR` and `ADMIN` platform roles (others receive `notFound()`), rendering the pending queue and recent decision history table.
  - Verified build and TypeScript compilation: `npm run build` exits 0 on all 23 routes.
- Implemented `15-club-directory.md`:
  - Created `lib/data/clubs.ts` with `getActiveClubs(q)`, `getMyClubs(userId)`, and `getClubDetails(clubId, userId)` handling search, active member counts, and officer relations.
  - Created `components/clubs/club-search-bar.tsx` for server-side search querying on `/clubs`.
  - Created two-tab club directory in `app/(app)/clubs/page.tsx`:
    - **Discover**: Displays `ACTIVE` clubs in responsive grid with name, description, member count, advisor info, and search bar (`?q=`).
    - **My Clubs**: Displays organizations the user belongs to or proposed, with club `StatusBadge` and role chip.
    - Added fallbacks to `EmptyState` when queries return no results.
  - Extended `app/(app)/clubs/[clubId]/page.tsx` into a multi-tab profile shell:
    - Added warning banner for `SUSPENDED` clubs.
    - Rendered `StatusBadge`, viewer role chip, member count, and charter approval timeline (for pending/rejected proposals).
    - Added **Overview** tab displaying mission description, read-only charter objectives with statuses, designated executive officers (President, Secretary, Treasurer), and faculty advisor card.
    - Added role-gated tabs with `EmptyState` placeholders: **Events** (all viewers), **Members**, **Objectives**, **Elections**, **Announcements** (active members only), and **Settings** (managers and admins only). Non-members see no member-only tabs.
  - Verified build and TypeScript compilation: `npm run build` exits 0 on all 23 routes.
- Implemented `16-club-profile-edit.md`:
  - Added audit action `PROFILE_UPDATED: "club.profile_updated"` in `lib/audit/actions.ts`.
  - Added `clubProfileUpdateSchema` in `lib/validation/club.ts` for validating optional `name` and `description` with trimming and length constraints.
  - Refined access helper `requireClubPresident` in `lib/access/index.ts` to return 403 `FORBIDDEN` if caller is a member but not President, and 404 `NOT_FOUND` if not a member (with `ADMIN` platform bypass).
  - Implemented `PATCH /api/clubs/[clubId]`:
    - Checks `requireClubPresident(clubId)`.
    - Restricts edits to `ACTIVE` clubs (unless caller is platform `ADMIN`).
    - Validates against case-insensitive name collisions across other clubs (returns 409 `CONFLICT`).
    - Updates name and description in an atomic Prisma transaction and appends `club.profile_updated` audit log with metadata `changedFields`.
  - Created client component `components/clubs/club-settings-form.tsx` with pre-filled fields, form validation, relative `updatedAt` display, API error toast mapping, and non-active club warning state.
  - Integrated `ClubSettingsForm` into `app/(app)/clubs/[clubId]/page.tsx` within the **Settings** tab, gated strictly to the club President and platform Admins.
  - Verified authorization boundaries (President/Admin vs Secretary/Member/Non-member), name collision handling, and audit trail via automated test script.
  - Verified build and TypeScript compilation: `npm run build` exits 0 on all 23 routes.
- Implemented `17-membership-api.md`:
  - Added audit action `LEFT: "membership.left"` in `lib/audit/actions.ts`.
  - Created Zod validation schemas in `lib/validation/membership.ts` (`membershipQuerySchema`, `membershipActionSchema` discriminated union supporting `approve`, `reject`, `remove`, and `set_role`).
  - Implemented `POST /api/clubs/[clubId]/members` (Request to join):
    - Requires authenticated user with complete profile; club must be `ACTIVE`.
    - Handles re-application by reviving `REMOVED` memberships to `PENDING`.
    - Prevents duplicate requests with 409 `CONFLICT`.
    - Dispatches async notifications (`MEMBERSHIP_REQUEST`) to all active club managers (`PRESIDENT`, `SECRETARY`).
  - Implemented `GET /api/clubs/[clubId]/members` (Roster):
    - Strict access control: only active members, club faculty advisor, and platform admins can view the roster (unauthorized callers receive 404).
    - `?status=PENDING` list restricted strictly to managers and platform admins (others receive 404).
    - Field projection & privacy: regular members see name, role, and joined date only (email and studentId masked); managers, officers (`TREASURER`), advisor, and admins view full details including email and student ID.
  - Implemented `PATCH /api/clubs/[clubId]/members/[membershipId]` (Decide, change role, remove):
    - `approve` / `reject`: manager/admin only, updates `PENDING` membership to `ACTIVE` (with timestamp) or `REMOVED`. Emits post-commit `MEMBERSHIP_DECISION` notification.
    - `remove`: manager can remove `MEMBER`; only `PRESIDENT` or platform admin can remove `TREASURER` or `SECRETARY`. President cannot be removed through this route. Emits post-commit `MEMBERSHIP_DECISION` notification.
    - `set_role`: `PRESIDENT` or platform admin only, sets `TREASURER`, `SECRETARY`, or `MEMBER` on active members. Enforces one holder per office: previous holder is atomically demoted to `MEMBER` in the same transaction. Emits `ROLE_CHANGED` notifications to both target and demoted member.
  - Implemented `DELETE /api/clubs/[clubId]/members/me` (Self-leave):
    - Any active non-president member can leave the club (`REMOVED` status). President is blocked (400) until presidency transfer.
  - Verified all transitions, single-office constraints, database partial unique index on President, and audit trails via automated test script.
  - Verified build and TypeScript compilation: `npm run build` exits 0 on all 23 routes.
- Implemented `18-membership-ui.md`:
  - Updated `DELETE /api/clubs/[clubId]/members/me` to support cancelling pending membership requests (`status: { in: ["ACTIVE", "PENDING"] }`).
  - Created server data helpers in `lib/data/members.ts`: `getClubRoster` (enforcing field masking for regular members) and `getClubPendingRequests` (restricted to managers and admins).
  - Created client component `components/clubs/join-button.tsx`:
    - Handles Join, Request Pending (with cancel via `AlertDialog` confirmation), and Member states (with Leave in a dropdown menu guarded by `AlertDialog`).
    - Hidden for the President and when the club is not active.
  - Created client component `components/clubs/member-actions-menu.tsx`:
    - Provides President with per-row role management: "Make Treasurer", "Make Secretary", "Make Member", and "Remove from Club".
    - Intercepts role changes with an `AlertDialog` naming the currently seated officer who will be replaced and demoted.
    - Requires an `AlertDialog` for member removal.
  - Created client component `components/clubs/club-members-view.tsx`:
    - Sub-tabs for **Roster** (with count badge) and **Requests** (with pending count badge, visible to managers and admins only).
    - Client-side real-time name filter for the roster.
    - Desktop `Table` and mobile card views with avatar, name, role chip, joined date, and conditional student ID / email.
    - Inline Approve and Reject controls for pending requests with optimistic UI removal and toast feedback.
  - Integrated `<JoinButton />` and `<ClubMembersView />` into `app/(app)/clubs/[clubId]/page.tsx`, unlocking the Members tab for active members, advisors, and platform admins.
  - Updated `app/(app)/dashboard/page.tsx` with a responsive "My Clubs" widget displaying active organizations, role chips, advisor details, and fallback prompt to explore clubs.
  - Verified roster privacy masking, request cancellation, and data fetching via automated script.
  - Verified build and TypeScript compilation: `npm run build` exits 0 on all 23 routes.
- Implemented `19-club-objectives.md`:
  - Added audit action `DELETED: "objective.deleted"` in `lib/audit/actions.ts`.
  - Created Zod validation schemas in `lib/validation/objective.ts` (`objectiveCreateSchema`, `objectiveUpdateSchema`, and `objectiveProgressSchema`).
  - Implemented `GET /api/clubs/[clubId]/objectives` returning all objectives with latest update and update counts.
  - Implemented `POST /api/clubs/[clubId]/objectives` enforcing manager/admin access, active club status, 20-objective limit (409 conflict if reached), and `objective.created` audit logging.
  - Implemented `PATCH /api/clubs/[clubId]/objectives/[objectiveId]` supporting edits to title, description, status, and target date with `objective.updated` audit logging.
  - Implemented `DELETE /api/clubs/[clubId]/objectives/[objectiveId]` with cascading update deletion and `objective.deleted` audit logging.
  - Implemented `GET /api/clubs/[clubId]/objectives/[objectiveId]/updates` returning the full progress history timeline ordered newest first.
  - Implemented `POST /api/clubs/[clubId]/objectives/[objectiveId]/updates` recording progress notes, optionally updating objective status concurrently, and appending `objective.progress_added` audit log.
  - Created server data helper `lib/data/objectives.ts` (`getClubObjectives`).
  - Created UI components:
    - `components/clubs/objective-status-badge.tsx` with design system state tokens for `PLANNED`, `IN_PROGRESS`, `ACHIEVED`, and `DROPPED`.
    - `components/clubs/club-objectives-view.tsx` with objective counter (`X / 20`), manager Add/Edit/Delete dialogs, inline Add Progress dialog, and interactive Progress Timeline modal (newest first).
  - Integrated into `app/(app)/clubs/[clubId]/page.tsx`, unlocking the **Objectives** tab for all signed-in viewers on active clubs and displaying live status badges in the **Overview** tab charter objectives list.
  - Verified 20-objective limit, manager access boundaries, progress timeline ordering, and audit logging via automated test script.
  - Verified build and TypeScript compilation: `npm run build` exits 0 on all 23 routes.
- Implemented `20-event-schema-api.md`:
  - Created `prisma/models/event.prisma` with `Event` and `EventRegistration` models, along with `EventStatus`, `EventVisibility`, and `AttendanceStatus` enums.
  - Added reverse relations in `prisma/models/user.prisma` (`createdEvents`, `eventRegistrations`) and `prisma/models/club.prisma` (`events`).
  - Applied PostgreSQL migration `20261104152741_add_events` and regenerated Prisma Client.
  - Implemented strict state machine transition maps: `lib/events/transitions.ts` (`EVENT_TRANSITIONS`, `canTransitionEvent`) and `lib/events/attendance-transitions.ts` (`ATTENDANCE_TRANSITIONS`, `canTransitionAttendance`).
  - Added audit actions in `lib/audit/actions.ts`: `event.created`, `event.updated`, `event.published`, `event.cancelled`, `event.completed`.
  - Created Zod validation schemas in `lib/validation/event.ts` (`eventCreateSchema`, `eventUpdateSchema`, `eventStatusChangeSchema`, and `eventFeedQuerySchema`).
  - Implemented `POST /api/clubs/[clubId]/events` (creates `DRAFT` event for active clubs by managers/admins with `event.created` audit log).
  - Implemented `GET /api/clubs/[clubId]/events` (managers see all statuses including `DRAFT`; members see non-draft including `MEMBERS_ONLY`; outsiders see `CAMPUS` events).
  - Implemented `GET /api/events` (campus feed: cursor-paginated, upcoming by default, excludes `DRAFT`s, restricts `MEMBERS_ONLY` to active club members, supports `q`, `from`, `to`, `clubId` filters).
  - Implemented `GET /api/events/[eventId]` (event detail with active registration count and strict visibility gating).
  - Implemented `PATCH /api/events/[eventId]` (allowed for `DRAFT` or `PUBLISHED` events; validates that capacity cannot be reduced below current non-cancelled registrations count; logs `event.updated`).
  - Implemented `POST /api/events/[eventId]/status` (validates transition rules via state machine; enforces future start time on publish; enforces passed start time on completion; logs audit entries; fires post-commit `EVENT_PUBLISHED` or `EVENT_CANCELLED` notifications).
  - Verified state machine transitions, feed visibility, capacity constraints, and audit logging via automated test script.
  - Verified build and TypeScript compilation: `npm run build` exits 0 on all 24 routes.
- Implemented `21-event-management-ui.md`:
  - Added timezone helpers `utcToDatetimeLocalInput` and `datetimeLocalInputToUTC` in `lib/format.ts` to convert cleanly between UTC database timestamps and `<input type="datetime-local">` values for the campus timezone (`INSTITUTION_TIMEZONE`).
  - Created `components/events/event-status-badge.tsx` rendering semantic badge colors for `DRAFT`, `PUBLISHED`, `COMPLETED`, and `CANCELLED`.
  - Created data access helpers in `lib/data/events.ts`:
    - `getClubEvents(clubId, userId, isManager, isActiveMember)`: returns categorized upcoming and past events with registration counts and visibility rules.
    - `getEventManagementDetail(eventId, userId, isManager)`: returns event details, manager check, active registration counts, and valid next status transitions.
  - Built reusable `components/events/event-form.tsx` for creating and editing events with title, description, location, datetime-local inputs, capacity toggle, and visibility radio options.
  - Built create route `app/(app)/clubs/[clubId]/events/new/page.tsx` creating new `DRAFT` events with redirect to event management view.
  - Built edit route `app/(app)/clubs/[clubId]/events/[eventId]/edit/page.tsx` pre-filling current values and enforcing capacity reduction boundaries.
  - Built `components/events/event-status-actions.tsx` providing Publish, Cancel, and Mark Completed status transitions guarded by `AlertDialog` modals.
  - Built manager event detail page `app/(app)/clubs/[clubId]/events/[eventId]/page.tsx` displaying event metadata, status badges, capacity stats, management action buttons, and attendance placeholder.
  - Built `components/clubs/club-events-tab.tsx` displaying upcoming and past events with status badges, visibility tags, registration counts, and "Create Event" button for managers.
  - Integrated `ClubEventsTab` into `app/(app)/clubs/[clubId]/page.tsx` unlocking the **Events** tab for club visitors and members.
  - Verified build and TypeScript compilation: `npm run build` exits 0 on all 24 routes.
- Implemented `22-event-registration-api.md`:
  - Added audit actions `REGISTERED: "event.registered"` and `REGISTRATION_CANCELLED: "event.registration_cancelled"` in `lib/audit/actions.ts`.
  - Created Zod validation schemas in `lib/validation/event-registration.ts` (`registrationsQuerySchema` and `myEventsQuerySchema`).
  - Implemented `POST /api/events/[eventId]/registrations`:
    - Gated by `requireProfileComplete()`.
    - Enforces `PUBLISHED` status and unexpired `endsAt`.
    - Enforces `MEMBERS_ONLY` active club membership check.
    - Employs strict row-level lock (`SELECT ... FOR UPDATE` via `tx.$queryRaw`) within transaction to serialize concurrent attempts.
    - Enforces capacity limit with 409 conflict when full.
    - Handles first-time registrations and revives cancelled registrations with updated `statusChangedAt`.
    - Appends `event.registered` audit log.
  - Implemented `DELETE /api/events/[eventId]/registrations/me`:
    - Allows cancellation only while status is `REGISTERED` and `startsAt > new Date()`.
    - Updates status to `CANCELLED`, sets `statusChangedAt: new Date()`, and logs `event.registration_cancelled`.
  - Implemented `GET /api/events/[eventId]/registrations`:
    - Restricted to managers (`PRESIDENT`, `SECRETARY`), officer (`TREASURER`), club advisor, and platform `ADMIN`.
    - Supports status filtering (`?status=`) and cursor-based pagination.
    - Projects full member details (name, email, student ID, status, timestamps).
  - Implemented `GET /api/events/mine`:
    - Segregates registrations into `?when=upcoming` (default) and `?when=past` with cursor pagination.
  - Verified concurrent capacity serialization, revival, cancellations, and access control via automated test script.
  - Verified build and TypeScript compilation: `npm run build` exits 0 on all 25 routes.
- Implemented `23-event-discovery-ui.md`:
  - Added server data access helpers in `lib/data/events.ts`:
    - `getDiscoveryEvents(userId, filters)`: returns published events with active registration counts, spots remaining, and viewer registration status.
    - `getMyRegisteredEvents(userId)`: returns user registrations split into upcoming reservations and past event history.
    - `getPublicEventDetail(eventId, userId)`: returns public event metadata, spots remaining, capacity percentage, club details, and viewer registration status.
    - `getDashboardUpcomingEvents(userId)`: returns upcoming events from the user's registrations and active clubs.
  - Built client component `components/events/register-button.tsx`:
    - Handles all interactive and disabled states: Register, Registered, Full, Members Only, Event Ended, and Event Cancelled.
    - Guards cancellation with an `AlertDialog` confirmation and calls `DELETE /api/events/[eventId]/registrations/me`.
    - Handles registration via `POST /api/events/[eventId]/registrations` with feedback toasts and page refresh.
  - Built `components/events/event-card.tsx` with title, club link, formatted datetime (`INSTITUTION_TIMEZONE`), location, spots remaining counter, and registration badge.
  - Built `components/events/event-search-filters.tsx` supporting search (`?q=`), club dropdown (`?clubId=`), and date range pickers (`?from=`, `?to=`).
  - Implemented student discovery page `app/(app)/events/page.tsx` featuring tabbed navigation ("Upcoming Events" vs "My Registrations"), responsive grid, and empty states.
  - Implemented event detail page `app/(app)/events/[eventId]/page.tsx` with full description, organizer bio card, institution timezone formatting, capacity progress bar, and `<RegisterButton />`.
  - Added "Upcoming Events & Activities" widget to `app/(app)/dashboard/page.tsx`.
  - Verified build and TypeScript compilation: `npm run build` exits 0 on all 25 routes.
- Implemented `24-attendance.md`:
  - Added audit actions `attendance.marked` and `attendance.finalized` under `AUDIT_ACTIONS.ATTENDANCE` in `lib/audit/actions.ts`.
  - Created Zod validation schemas in `lib/validation/attendance.ts` (`attendanceSingleSchema` and `attendanceBulkSchema`).
  - Implemented `PATCH /api/events/[eventId]/registrations/[registrationId]`:
    - Enforces manager/admin access control.
    - Validates event state: allowed only if event is `PUBLISHED` and already started (`startsAt <= now`), or `COMPLETED`. Draft, cancelled, or future events return 409 `INVALID_STATE`.
    - Enforces attendance transition machine (`canTransitionAttendance`), blocking cancelled registrations.
    - Updates `status`, `statusChangedAt`, and sets `checkedInAt` if marking `PRESENT`.
    - Logs `attendance.marked` audit entry.
  - Implemented `POST /api/events/[eventId]/attendance/bulk`:
    - Validates batch of up to 200 registration IDs.
    - Performs atomic updates inside a transaction, setting `status`, `statusChangedAt`, and `checkedInAt` for `PRESENT` entries.
    - Writes a single `attendance.marked` audit entry with count and target status.
  - Implemented `POST /api/events/[eventId]/attendance/finalize`:
    - Sets all remaining `REGISTERED` rows to `ABSENT` in a single transaction.
    - Writes a single `attendance.finalized` audit entry with count.
  - Built interactive client component `components/events/event-attendance-manager.tsx`:
    - Summary KPI cards (Total RSVPs, Unmarked, Present, Absent).
    - Real-time search and status dropdown filtering.
    - Multi-select checkbox strip for bulk "Mark Present" and "Mark Absent".
    - Row-level instant action buttons for Present and Absent.
    - "Finalize Attendance" action guarded by `AlertDialog` confirmation modal.
    - Helpful warning banner when the event has not started yet.
    - Updates counters and rows optimistically without page reload.
  - Integrated `EventAttendanceManager` into manager event page `app/(app)/clubs/[clubId]/events/[eventId]/page.tsx`.
  - Verified transitions, guards, bulk update, finalize, and audit logs via automated test script.
  - Verified build and TypeScript compilation: `npm run build` exits 0 on all 25 routes.
- Implemented `25-qr-checkin.md`:
  - Installed `qrcode.react` dependency for rendering high-contrast SVG QR codes.
  - Added audit action `attendance.checked_in` under `AUDIT_ACTIONS.ATTENDANCE` in `lib/audit/actions.ts`.
  - Created `lib/events/checkin-token.ts`:
    - Generates HMAC-SHA256 tokens using `CHECKIN_SECRET` and 60-second time buckets (`Math.floor(now / 60000)`).
    - Timing-safe verification (`crypto.timingSafeEqual`) accepting current and 2 prior buckets (up to 3 minutes window).
  - Implemented `GET /api/events/[eventId]/checkin-code`:
    - Restricted to club managers and platform admins.
    - Returns active check-in URL with token and bucket expiration countdown.
  - Implemented `POST /api/events/[eventId]/check-in`:
    - Timing-safe token verification against rotating buckets.
    - Enforces event time window: check-in opens 30 minutes before `startsAt` and closes 60 minutes after `endsAt`.
    - Requires existing registration; rejects unregistered students with 409 conflict (strictly prevents auto-registration).
    - Idempotently succeeds if student is already marked `PRESENT`.
    - Atomically updates status to `PRESENT`, records `checkedInAt` and `statusChangedAt`, and logs `attendance.checked_in`.
  - Built manager component `components/events/event-qr-dialog.tsx`:
    - "Show check-in QR" action in event manage header.
    - Large high-contrast pure black on pure white QR code for projector readability.
    - Live 30-second token rotation ticker with visual countdown bar and copy URL action.
  - Built student check-in page `app/(app)/events/[eventId]/check-in/page.tsx`:
    - Auto-verifies token on arrival, rendering dedicated cards for Success, Already Checked In, Registration Required (with link to register), and Expired/Invalid Token.
  - Verified token rotation, timing attacks protection, window guards, and unregistered user rejection via automated test script.
  - Verified build and TypeScript compilation: `npm run build` exits 0 on all 25 routes.
- Implemented `26-announcements.md`:
  - Created `Announcement` model and `AnnouncementAudience` enum in `prisma/models/announcement.prisma` with relations to `Club`, `User` (author), and optional `Event`.
  - Added reverse relations in `prisma/models/club.prisma`, `prisma/models/user.prisma`, and `prisma/models/event.prisma`.
  - Applied migration `20261104172420_add_announcements` to remote pooled PostgreSQL database and regenerated Prisma Client.
  - Added audit actions `announcement.created` and `announcement.deleted` under `AUDIT_ACTIONS.ANNOUNCEMENT` in `lib/audit/actions.ts`.
  - Created Zod validation schemas in `lib/validation/announcement.ts` (`announcementCreateSchema` and `announcementsQuerySchema`).
  - Implemented `POST /api/clubs/[clubId]/announcements`:
    - Gated by club managers or platform admins; requires active club status.
    - Validates cross-club event boundary when targeting `EVENT_REGISTRANTS`.
    - Creates announcement in transaction with `announcement.created` audit log.
    - Resolves audience (`ALL_MEMBERS` excludes author, `EVENT_REGISTRANTS` excludes cancelled and author) and dispatches in-app notifications with `type: "ANNOUNCEMENT"` pointing to Announcements tab.
  - Implemented `GET /api/clubs/[clubId]/announcements`:
    - Cursor-paginated (newest first).
    - Access restricted to active members, the club advisor, and platform admins.
  - Implemented `DELETE /api/clubs/[clubId]/announcements/[announcementId]`:
    - Gated by club managers or platform admins.
    - Deletes announcement in transaction with `announcement.deleted` audit log.
  - Created data access helper `getClubAnnouncements` in `lib/data/announcements.ts`.
  - Built interactive client component `components/clubs/club-announcements-tab.tsx`:
    - Feed of announcements with author info, timestamps, audience tag, and event pill.
    - "New Announcement" dialog with audience selector and conditional event picker.
    - Confirmed delete dialog with `AlertDialog`.
    - Empty state fallback.
  - Integrated `ClubAnnouncementsTab` into `app/(app)/clubs/[clubId]/page.tsx`, unlocking Tab 6 for all active members, club advisors, and admins.
  - Verified audience notification resolution, access control, and deletion via automated test script.
  - Verified build and TypeScript compilation: `npm run build` exits 0 on all 25 routes.

## In Progress

- None

## Next Up

- Implement `08-notifications-backend.md` (using `prisma-client-api`)
- Implement `09-notifications-ui.md` (using `shadcn` and `lucide-react`)


## Feature Spec Checklist

Mark a spec done only when it works end to end and `npm run build` passes.

### Foundation

- [x] `01-design-system.md` — shadcn/ui, tokens, light and dark themes, utilities
- [x] `02-app-shell.md` — Navbar, role-aware sidebar, placeholder routes
- [x] `03-auth.md` — Clerk provider, auth pages, route protection
- [x] `04-prisma-foundation.md` — Prisma setup, User model, client singleton, admin seed
- [x] `05-user-sync-access.md` — Current user, API helpers, access helpers, /api/me
- [x] `06-profile-onboarding.md` — Student ID and department, onboarding guard
- [x] `07-audit-log.md` — Append-only audit model and writer
- [x] `08-notifications-backend.md` — Notification model, helpers, routes
- [x] `09-notifications-ui.md` — Bell, dropdown, notifications page

### Clubs, Membership, Governance

- [x] `10-club-membership-schema.md` — Club, approval, membership, objective models
- [x] `11-club-registration-api.md` — Submit registration, club reads, advisor list
- [x] `12-club-registration-ui.md` — Registration form, approval timeline, status page
- [x] `13-club-approval-api.md` — Two-stage advisor and admin review
- [x] `14-club-approval-ui.md` — Review queue and decision dialog
- [x] `15-club-directory.md` — Discover, My Clubs, club page shell
- [x] `16-club-profile-edit.md` — President edits club profile
- [x] `17-membership-api.md` — Join, decide, roles, remove, leave
- [x] `18-membership-ui.md` — Join button, roster, requests, role management
- [x] `19-club-objectives.md` — Objectives and progress updates

### Events and Communication

- [x] `20-event-schema-api.md` — Event models, CRUD, status changes
- [x] `21-event-management-ui.md` — Club event screens and status actions
- [x] `22-event-registration-api.md` — Register, cancel, capacity-safe
- [x] `23-event-discovery-ui.md` — Event feed, detail, register button
- [x] `24-attendance.md` — Manual, bulk, and finalize attendance
- [x] `25-qr-checkin.md` — Rotating QR and self check-in
- [x] `26-announcements.md` — Targeted announcements with notifications

### Elections (Skipped for MVP — Refer to context/mvp-election-skip.md)

- [x] `mvp-election-skip.md` — MVP skip directive & Coming Soon UI/API endpoints
- [x] `27-election-schema.md` — Skipped for MVP (Deferred to v2.0)
- [x] `28-election-lifecycle-api.md` — Skipped for MVP (Deferred to v2.0)
- [x] `29-election-management-ui.md` — Skipped for MVP (Deferred to v2.0)
- [x] `30-voting.md` — Skipped for MVP (Deferred to v2.0)
- [x] `31-election-results.md` — Skipped for MVP (Deferred to v2.0)

### Analytics, Administration, Delivery

- [x] `32-admin-dashboard.md` — System analytics and exception lists
- [x] `33-club-analytics.md` — Club analytics tab
- [x] `34-reports-export.md` — CSV exports
- [x] `35-admin-controls.md` — Suspend, advisor reassignment, user roles
- [x] `36-audit-log-viewer.md` — Admin audit viewer and club history
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

