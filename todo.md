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