# Database Migrations (Supabase)

Recommended approach:
- Use SQL migration files in a `db/migrations/` folder.
- Use supabase CLI or pg_dump for backups and schema management.
- Example flow:
  1. Create migration SQL: `db/migrations/2025-10-09-add-users-role.sql`
  2. Apply locally with `psql` or `supabase migrations run`
  3. Test in staging before applying to production