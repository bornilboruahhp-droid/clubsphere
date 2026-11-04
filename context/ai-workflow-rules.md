# Development Workflow

## Approach

Build this project incrementally using a spec-driven workflow. Context files define what to build, how to build it, and what the current state of progress is. Always implement against these specs. Do not infer or invent behavior from scratch.

## Mandatory Agent Skills Execution

The AI agent MUST load, consult, and adhere to the installed agent skills located in `.agents/skills/` during every implementation step according to the technology and domain being touched:

- **Next.js 15 App Router & React 19 Implementation**:
  - `vercel-react-best-practices` (`.agents/skills/vercel-react-best-practices/SKILL.md`): Apply all prioritized performance and RSC boundary rules whenever authoring or modifying React/Next.js components.
  - `nextjs-app-router-patterns` (`.agents/skills/nextjs-app-router-patterns/SKILL.md`): Use for App Router layouts, route handlers, async route parameters, streaming, and Server Actions.
  - `vercel-composition-patterns` (`.agents/skills/vercel-composition-patterns/SKILL.md`): Use for composable component APIs, compound components, and render props.
- **Database & Prisma ORM Implementation**:
  - `prisma-client-api` (`.agents/skills/prisma-client-api/SKILL.md`): Use for all database model queries, CRUD operations, transactions, and filters.
  - `prisma-driver-adapter-implementation` (`.agents/skills/prisma-driver-adapter-implementation/SKILL.md`): Consult when touching database client connection pooling (`pg.Pool` with `@prisma/adapter-pg`).
  - `prisma-orm-setup` & `prisma-cli` (`.agents/skills/prisma-orm-setup/SKILL.md`, `.agents/skills/prisma-cli/SKILL.md`): Use for schema setup, migrations (`prisma migrate dev`), and client generation.
- **Authentication & Authorization (Clerk)**:
  - `clerk-nextjs-patterns` (`.agents/skills/clerk-nextjs-patterns/SKILL.md`): Mandatory for route protection, middleware (`clerkMiddleware`), `auth()`, and Server Actions auth.
  - `clerk-setup` & `clerk-custom-ui` (`.agents/skills/clerk-setup/SKILL.md`, `.agents/skills/clerk-custom-ui/SKILL.md`): Follow when configuring Clerk provider, auth screens, and user management.
  - `clerk-backend-api` (`.agents/skills/clerk-backend-api/SKILL.md`): Use when calling backend user and organization endpoints.
- **UI, Styling & Components (Tailwind v4 & shadcn/ui)**:
  - `shadcn` (`.agents/skills/shadcn/SKILL.md`): Mandatory when adding, customizing, or styling shadcn/ui components (`components/ui/*`).
  - `tailwind-design-system` (`.agents/skills/tailwind-design-system/SKILL.md`): Apply for design tokens, OKLCH variables, and responsive layout styling.
- **Validation & TypeScript**:
  - `zod` (`.agents/skills/zod/SKILL.md`): Mandatory for all schema definitions, `safeParse`, type inference (`z.infer`), and form validation.
  - `typescript-advanced-types` (`.agents/skills/typescript-advanced-types/SKILL.md`): Apply for complex typing, discriminated unions, and strict null safety.

Every time the agent implements or refactors code, it must verify compliance against the relevant installed skill.


## Scoping Rules

- Work on one feature unit or subsystem at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single implementation step.
- Feature specs are numbered. Implement them in order unless `progress-tracker.md` says otherwise.

## When To Split Work

Split an implementation step if it combines:

- Schema changes (Prisma models and migrations) and a large UI build
- Business rules for one domain and UI for another
- Multiple unrelated API routes
- Election logic and any other module
- Authorization rule changes and feature work
- Behavior that is not clearly defined in the context files

If a change cannot be verified end to end quickly, the scope is too broad. Split it.

## Handling Missing Requirements

- Do not invent product behavior that is not defined in the context files.
- If a requirement is ambiguous, resolve it in the relevant context file before implementing.
- If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing.
- If a spec depends on an unresolved open question, stop and ask instead of choosing a default silently.

## Authorization Discipline

- Every route handler authenticates first, then authorizes through `lib/access/`, then validates and mutates.
- Do not write role or membership checks inline. If a rule is missing from `lib/access/`, add it there and reuse it.
- When a new permission is introduced, update the Permission Matrix in `architecture-context.md` in the same change.

## Database Discipline

- One migration per feature unit, named after the feature (for example `add_club_and_membership`).
- Never edit a migration that has already been applied. Add a new one.
- Raw SQL constraints listed in `architecture-context.md` go inside the migration that creates the table.
- Do not add fields, indexes, or models that the current spec does not list, unless Prisma requires them.

## Protected Foundation Components

Do not modify generated third-party foundation components unless explicitly instructed.

This includes:

- `components/ui/*` (shadcn/ui components)
- Third-party library internals
- Applied Prisma migrations

Project-specific styling, layout changes, and feature logic must be implemented in app-level components instead.

## Keeping Docs In Sync

Update the relevant context file whenever implementation changes:

- System architecture or boundaries
- Data model, enums, or constraints
- Permission matrix
- Code conventions or standards
- Feature scope

Progress state must reflect the actual state of the implementation, not the intended state.

## Before Moving To The Next Unit

1. The current unit works end to end within its defined scope.
2. No invariant defined in `architecture-context.md` was violated.
3. `npm run build` passes with no type errors.
4. `progress-tracker.md` reflects the completed work and the spec checklist is updated.
