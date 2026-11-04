# Online Club Registration System

## Overview

A web platform that moves student club administration from scattered forms, spreadsheets, and chat messages into one guided, role-aware, auditable workflow. Students discover clubs, join them, and register for events. Club leaders run their rosters, events, announcements, and annual elections. Advisors and administrators approve new clubs, oversee governance, and view institution-wide analytics.

Each club keeps its own identity, objectives, and operations (autonomy) while following shared institutional rules (governance).

## Goals

1. Faster registration: replace paper and email steps with a guided digital workflow.
2. Better transparency: approval, election, and role-change history is visible to authorized users.
3. Reliable records: one current source of truth for clubs, members, events, and leaders.
4. Controlled access: each role gets only the permissions its responsibilities require.
5. Actionable reporting: summaries of membership, participation, elections, and activity.

## Roles

| Role | Scope | Description |
| --- | --- | --- |
| Student | Platform | Any signed-in user. Can discover clubs, request membership, register for events, vote in their clubs' elections. |
| Club Member | Club | Student with an ACTIVE membership. |
| Treasurer | Club | Club role. Read access to rosters, attendance, and club analytics. |
| Secretary | Club | Club role. Manages roster requests, events, attendance, announcements. |
| President | Club | Club role. Full club management, including role assignment. One per club. |
| Advisor | Platform + per club | Faculty reviewer assigned to a club. First approval stage. Election officer for that club. |
| Administrator | Platform | Final approval, suspension, user roles, system analytics, audit log. |

The full permission matrix lives in `architecture-context.md`.

## Core User Flows

### Club registration
1. A student completes their profile and submits a club registration (name, description, objectives, advisor).
2. The advisor reviews and approves or rejects.
3. On advisor approval, an administrator gives final approval or rejects.
4. The club becomes ACTIVE (or REJECTED) and every step is audit-logged and notified.

### Membership
1. A student opens an ACTIVE club and requests to join.
2. President or Secretary approves or rejects.
3. The student appears on the roster. The President can assign Treasurer and Secretary roles.

### Events
1. President or Secretary creates and publishes an event.
2. Students see published events and register (capacity enforced).
3. Organizers mark attendance manually or students check in through a QR link.
4. Registrants receive notifications and announcements.

### Annual election
1. The election officer (club advisor or admin) creates the election for the cycle.
2. Active members nominate themselves; the officer approves candidates.
3. Voting opens; each active member casts exactly one secret ballot.
4. The officer closes voting, publishes the result, and the new President takes over. The record is archived and immutable.

## Features

### Authentication and Profiles
- Clerk sign-in, sign-up, and route protection.
- Local user record keyed by Clerk user ID with institutional student ID and department.

### Club Registration and Approval
- Registration form, two-stage approval routing (advisor, then admin), visible status.

### Membership and Governance
- Join requests, rosters, club roles, club profile editing, objective tracking.

### Events and Communication
- Event CRUD, registration with capacity, attendance, QR check-in, announcements, in-app notifications.

### Elections
- Nomination, candidate approval, secret voting, integrity checks, result publication and archive.

### Administration and Analytics
- Admin dashboard, club dashboards, CSV report exports, user and club controls, audit log viewer.

## Scope

### In Scope
- Clerk authentication and local user profiles
- Club registration with two-stage approval
- Membership, club roles, and rosters
- Club profiles and objective tracking
- Events, registration, attendance (manual and QR)
- Announcements and in-app notifications
- Annual presidential election per club
- Append-only audit trail
- Admin and club analytics, CSV exports
- Responsive web UI (desktop, tablet, mobile browsers)

### Out Of Scope
- Native mobile apps
- Push notifications and email delivery (revisit after Open Questions are resolved)
- Calendar, SIS, or LMS integrations
- Payments, dues, or treasury accounting
- Multi-institution (multi-tenant) support
- Real-time collaboration or chat
- Club document/file uploads until the storage provider is decided (see Open Questions)

## Success Criteria

1. A signed-in student can complete a profile and submit a club registration.
2. A registration moves through advisor and admin approval with visible status and a full audit record.
3. Students can join clubs and officers can manage rosters and roles within their permissions.
4. Officers can publish events; students can register; attendance is recorded and time-stamped.
5. A club can run a full election where each eligible member votes at most once and ballots cannot be linked to voters.
6. Published election results are immutable and the new President is applied atomically.
7. Admins can view system-wide analytics and the audit log.
8. Every role sees only what it is permitted to see and do.
