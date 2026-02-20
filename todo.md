## Recommended Next Upgrades
1. **Fix Python service wiring first (highest priority)**
   - `python/app/ai_service.py` currently has conflicting app definitions near the end of the file.
   - Add missing imports (for example `base64`) and ensure one canonical `FastAPI` app instance.
   - Confirm `uvicorn.run(...)` module path matches the real package layout.

2. **Fix test import mismatch so tests run reliably**
   - `tests/unit/test_inference_enterprise.py` imports `inference_service.main`, which is not currently available in this repo layout.
   - Update tests to import the real module path or add a compatibility module.

3. **Standardize one backend route contract**
   - Keep one canonical API version contract (recommended: `/api/v1/...`).
   - Mark other route sets in archive/legacy packs as non-primary in documentation.

4. **Replace demo AI stub in production path**
   - `app/ai/analyzeProduct.server.ts` is currently stubbed.
   - Upgrade it to call a real inference service with timeout, retry, and fallback behavior.

5. **Add offline-safe local verification**
   - Add a minimal smoke-test path that does not require Docker or internet access.
   - Keep Docker verification as an additional layer, not the only local validation path.

6. **Security and reliability hardening**
   - Add strict input validation for analyze endpoints.
   - Add authorization checks before metafield writes.
   - Add rate limiting, idempotency keys, and request correlation IDs.

7. **Align database migration strategy documentation**
   - `docs/README.md` currently references Alembic while the repo uses Prisma + SQL/Supabase patterns.
   - Pick one canonical migration path and update docs to match.

8. **Complete Prisma schema scaffolding**
   - `prisma/schema.prisma` currently has only a model definition.
   - Add canonical `datasource` and `generator` blocks and document naming/index conventions.

9. **Add indexes and constraints for AI results**
   - Add indexes on `shop`, `productId`, and `createdAt` in `AiResult`.
   - Add a composite index for common query patterns (for example `(shop, productId, createdAt)`).
   - Add a dedupe guard strategy (unique key or request-id-based uniqueness) for repeat writes.

10. **Standardize SQL timestamp semantics**
    - Normalize SQL usage to timezone-aware timestamps (`TIMESTAMPTZ`) and UTC.
    - Ensure SQL scripts and Prisma models use consistent time semantics.

11. **Harden consent tracking table integrity**
    - Add integrity checks (for example `revoked_at >= granted_at` when present).
    - Add indexes for frequent lookups (for example `user_id`, `consent_type`, `granted_at`).
    - Consider controlled values for `consent_type` (enum or reference table).

12. **Create and enforce migration folder workflow**
    - Create a canonical `db/migrations/` structure in-repo.
    - Define migration naming format and rollback policy in docs.

13. **Add offline-safe database smoke verification**
    - Add local checks for Prisma schema validation and SQL script sanity.
    - Add a minimal migration dry-run path for local/CI validation without full Docker dependency.
