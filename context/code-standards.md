# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes. Do not layer workarounds.
- Do not mix unrelated concerns in one component or route.
- Respect the system boundaries defined in `architecture-context.md`.

## TypeScript

- The AI agent must follow the installed `typescript-advanced-types` skill (`.agents/skills/typescript-advanced-types/SKILL.md`) for type design.
- Strict mode is required throughout the project.
- Avoid `any`. Use explicit interfaces or narrowly scoped types.
- Validate unknown external input at system boundaries before trusting it.
- Use `interface` for object contracts.
- Import Prisma enums from the generated client instead of redefining string unions.

## Next.js

- The AI agent must strictly adhere to the installed `vercel-react-best-practices` (`.agents/skills/vercel-react-best-practices/SKILL.md`), `nextjs-app-router-patterns` (`.agents/skills/nextjs-app-router-patterns/SKILL.md`), and `vercel-composition-patterns` (`.agents/skills/vercel-composition-patterns/SKILL.md`) skills during implementation.
- Default to React Server Components.
- Add `"use client"` only when the component needs browser interactivity or hooks.
- Read data in Server Components through `lib/data/*`. Mutate through `app/api/*` route handlers.
- Keep route handlers focused on a single responsibility.
- Pages that depend on the current user or live data are dynamic. Do not cache them.

## Styling

- The AI agent must follow the installed `tailwind-design-system` (`.agents/skills/tailwind-design-system/SKILL.md`) and `shadcn` (`.agents/skills/shadcn/SKILL.md`) skills for all UI and component development.
- Use the CSS custom property tokens defined in `globals.css`. No raw Tailwind palette classes such as `zinc-*` or `blue-*`, and no hardcoded hex values.
- Reference tokens through their Tailwind utility names: `bg-base`, `bg-surface`, `text-copy-primary`, `border-surface-border`, `text-brand`, and so on (full list in `ui-context.md`).
- Maintain the border radius scale: `rounded-xl` for small elements, `rounded-2xl` for cards, `rounded-3xl` for modals.
- Every screen must work in light and dark themes and at mobile widths.

## API Routes

- The AI agent must use the installed `clerk-nextjs-patterns` (`.agents/skills/clerk-nextjs-patterns/SKILL.md`) and `clerk-backend-api` (`.agents/skills/clerk-backend-api/SKILL.md`) skills for authentication and route guarding.
- Order of operations in every handler:


1. Authenticate (`401` if no session).
2. Authorize through `lib/access/` (`403` if not permitted, `404` if the resource must not be revealed).
3. Parse and validate input with the Zod schema from `lib/validation/` (`400` on failure).
4. Check current state against the transition map (`409` if invalid).
5. Mutate inside a transaction, including the audit entry.
6. Fire notifications after commit.

Response shapes:

- Success: `{ "data": <payload> }`
- Failure: `{ "error": { "code": string, "message": string, "fields"?: Record<string, string> } }`
- Error codes: `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `VALIDATION_ERROR` (400), `CONFLICT` (409), `INVALID_STATE` (409)
- List endpoints use cursor pagination: `?cursor=<id>&limit=<n>`, default 20, max 100, and return `{ "data": [...], "nextCursor": string | null }`.

Use the helpers in `lib/api/`. Do not hand-build response objects in handlers.

## Data and Storage

- The AI agent must use the installed `prisma-client-api` (`.agents/skills/prisma-client-api/SKILL.md`), `prisma-driver-adapter-implementation` (`.agents/skills/prisma-driver-adapter-implementation/SKILL.md`), and `prisma-cli` (`.agents/skills/prisma-cli/SKILL.md`) skills for all database queries, migrations, and model definitions.
- All application data lives in PostgreSQL via Prisma.
- Use `prisma.$transaction` for any change that touches more than one row or needs an audit entry.
- Use `select` or `include` deliberately. Do not return full models containing fields the client does not need.
- Never expose `Ballot`, `VoterRecord`, or vote tokens through any endpoint beyond what the voting spec defines.
- Never store raw tokens or secrets. Store hashes.
- Audit entries for club-scoped actions must include `clubId`. Audit metadata never contains secrets, tokens, or how someone voted.
- Large binary content is not stored in the database. See Open Questions for the storage decision.

## Validation

- The AI agent must strictly follow the installed `zod` skill (`.agents/skills/zod/SKILL.md`) for schema creation, safe parsing, and type inference.
- One Zod schema per request body or query, exported from `lib/validation/<domain>.ts`.
- The same schema is used by the route handler and the form resolver.
- Trim and normalize free-text names before uniqueness checks.

## Dates and Time

- Store UTC. Format for display with a single utility in `lib/format.ts` using the institution timezone from `lib/config.ts`.
- Compare election windows and event times on the server, never on the client.

## Forms and UX

- Use shadcn `Form` with react-hook-form and the Zod resolver.
- Show field-level errors from `error.fields` returned by the API.
- Destructive or irreversible actions (remove member, cancel event, publish result) require a confirmation `AlertDialog`.
- Show success and failure through toasts. Show loading with skeletons or disabled buttons, never blank screens.

## File Organization

- `lib/` holds shared infrastructure and domain rules. No JSX.
- `components/` holds UI composition only. No business rules and no Prisma calls.
- `app/api/` holds route handlers. Keep them thin and push logic into `lib/`.
- Name files after the responsibility they contain, not the technology.
- Co-locate a domain's transition map, validation, and access helpers by domain name (`lib/clubs/`, `lib/events/`, `lib/elections/`).
