Package the app for deployment as containers, as described in the proposal. Confirm the hosting target in `progress-tracker.md` Open Questions before starting.

## Implementation

1. Next.js config.

   Enable standalone output in the Next.js config.

2. Dockerfile.

   Multi-stage build: install dependencies, generate the Prisma client and build, then a slim runtime image running as a non-root user. Do not copy `.env` files or secrets into the image.

3. Compose.

   Create `docker-compose.yml` with:
   - `app` service built from the Dockerfile
   - `db` service using the official PostgreSQL image with a named volume and a healthcheck
   - `app` depends on a healthy `db`
   - configuration through an env file referenced by `env_file`

4. Migrations.

   Add an entrypoint script that runs `prisma migrate deploy` before starting the server. Never run `migrate dev` in containers.

5. Ignore file.

   Create `.dockerignore` excluding `node_modules`, `.next`, `.git`, `.env*`, and `context/`.

6. Documentation.

   Add a "Deployment" section to `README.md` covering required env vars (from `architecture-context.md`), how Clerk public keys must be provided at build time, how to run the seed script, and backup and restore guidance for the database volume.

## Scope Limits

- No CI/CD pipelines
- No orchestration manifests (Kubernetes and similar)

## Check When Done

- `docker compose up --build` starts the app and database
- Migrations apply on first start and are idempotent on restart
- The image contains no secrets
- Sign-in works against the configured Clerk instance
- `npm run build` still passes outside Docker
