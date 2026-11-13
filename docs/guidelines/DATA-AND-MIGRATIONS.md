# Data and migrations

Read before: changing `prisma/schema.prisma`, creating a migration, or changing how something is deleted/archived.

- Every schema change goes through `prisma migrate`, with the migration versioned in the repo. Never edit an applied migration.
- For every migration, assess existing data (backfill), compatibility and rollback. Document it in the PR when non-trivial.
- Migrations are applied by a controlled release step, never at application startup.
- History is preserved: strategic entities (diagnosis, recommendation, objective, target, measurement) are versioned or archived with reason/author, never overwritten or hard-deleted.
