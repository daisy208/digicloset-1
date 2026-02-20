# Database Migrations

Canonical migration location: `db/migrations/`

## Naming Format
- Use: `YYYYMMDDHHmmss_short_description.sql`
- Example: `20260217013000_add_ai_result_indexes.sql`

## Workflow
1. Update `prisma/schema.prisma`.
2. Add a forward migration SQL file in `db/migrations/`.
3. Add a paired rollback SQL file in `db/migrations/rollbacks/` using the same base filename.
4. Run offline smoke checks:
   - `./scripts/db_smoke_verify.ps1` (Windows)
   - `./scripts/db_smoke_verify.sh` (Linux/macOS)
5. Apply in staging, then production.

## Rollback Policy
- Every forward migration must have a rollback file.
- Rollbacks must reverse only the corresponding forward migration.
- Do not bundle multiple migration rollbacks into a single file.
