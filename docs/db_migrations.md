# Database Migrations (Prisma + SQL/Supabase)

Canonical approach:
- Use Prisma schema as the source of truth for application models in `prisma/schema.prisma`.
- Use SQL migration files in `db/migrations/` for DB changes and Supabase/Postgres rollout.
- Use Supabase CLI and `pg_dump` for backup, restore, and operational workflows.

## Migration Flow
1. Update `prisma/schema.prisma` for model-level changes.
2. Create migration SQL file, for example: `db/migrations/20260217013000_add_users_role.sql`.
3. Create matching rollback SQL file in `db/migrations/rollbacks/` with the same filename.
4. Run offline smoke checks:
   - `./scripts/db_smoke_verify.ps1` (Windows)
   - `./scripts/db_smoke_verify.sh` (Linux/macOS)
5. Apply locally with `psql` or `supabase migrations run`.
6. Validate in staging before production rollout.

## Naming Conventions
- Model names: `PascalCase` (for example `AiResult`).
- Field names: `camelCase` (for example `productId`, `createdAt`).
- Migration file names: `YYYYMMDDHHmmss_short_description.sql`.

## Rollback Policy
- Every forward migration in `db/migrations/` must have a paired rollback migration in `db/migrations/rollbacks/`.
- Rollback filenames must exactly match their corresponding forward migration filename.
- Rollbacks should only undo the matching migration and must not include unrelated changes.

## Index Conventions
- Add single-column indexes for high-selectivity filter fields.
- Add composite indexes for common multi-column query patterns.
- Name indexes by purpose and column order, for example `idx_ai_result_shop_product_created_at`.

## Timestamp Semantics
- Use timezone-aware timestamps (`TIMESTAMPTZ`) in SQL and persist all values in UTC.
- In Prisma, map `DateTime` fields to `@db.Timestamptz(6)` for Postgres-backed models.
