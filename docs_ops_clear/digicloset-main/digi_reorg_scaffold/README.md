# DigiCloset — Reorganized Scaffold

## What this scaffold includes
- Single `Makefile` with common commands
- `services/` monorepo layout:
  - `backend/` (Node.js + Express) with unified package.json and README
  - `frontend/` (React + TypeScript minimal app)
  - `worker/` (Python placeholder for image/ML tasks)
- `.github/workflows/ci.yml` simple CI pipeline example
- `migrations/` placeholder with a recommended pattern
- LICENSE (MIT)

## How to use
1. Copy `.env.example` to `.env` and fill credentials.
3. Use `make test` and `make lint` as basic checks.

---
This scaffold is intentionally minimal — it gives a single source-of-truth structure and the tools to expand safely.
