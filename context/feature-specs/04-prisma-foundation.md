Prisma is already installed. Add the PostgreSQL connection, split schema setup, the `User` model, the client singleton, the first migration, and an admin seed script.

## Setup

- Configure `prisma.config.ts` with a split schema folder at `prisma/models/` and a base `prisma/schema.prisma` containing only the generator and datasource.
- Create `.env.example` listing every variable in `architecture-context.md` with placeholder values.

## Models

Create `prisma/models/user.prisma`.

Enum `PlatformRole`: `STUDENT`, `ADVISOR`, `ADMIN`.

`User`:

- `id` String, primary key (this is the Clerk user ID, no default)
- `email` unique
- `name`
- optional `studentId`, unique
- optional `department`
- `role` PlatformRole, default `STUDENT`
- timestamps
- indexes on `role`

Do not add extra fields unless required by Prisma.

## Prisma Client

Create `lib/prisma.ts` as a cached singleton.

Branch by `DATABASE_URL`:

- if it starts with `prisma+postgres://`, use Accelerate
- otherwise use the direct `@prisma/adapter-pg` driver

Cache the client on `global` in development for hot reloads.

## Seed

Create `prisma/seed.ts` and register it in the Prisma config.

- Read `SEED_ADMIN_EMAIL`.
- If a `User` with that email exists, set `role = ADMIN`.
- If none exists, log that the user must sign in once first, then re-run the seed.
- The seed must be idempotent.

## Migration

Run `npx prisma migrate dev --name init_user` and generate the client.

## Dependencies

Already installed or add if missing: `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `@types/pg`, and a TypeScript runner for the seed script.

## Check When Done

- Schema has the `User` model with correct indexes
- `lib/prisma.ts` exports one cached Prisma instance
- Migration runs successfully
- Seed script runs twice without error
- `npm run build` passes
