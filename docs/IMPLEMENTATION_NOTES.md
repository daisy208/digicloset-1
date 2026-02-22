# Implementation Notes — Optimization Platform

This file lists suggested next steps to implement the features scaffolded in `app/optimizations`.

High-level phases:

- Phase 1 — Core data and APIs
  - Implement persistent models (ORM migrations).
  - Add REST/GraphQL endpoints for product optimization, snapshot, revert, and jobs.
  - Wire `config/feature_flags.json` into runtime configuration.

- Phase 2 — Background engine & scoring
  - Implement background worker with durable queue (Celery/RQ/Kafka).
  - Build scoring models for growth score, SEO health, conversion strength.

- Phase 3 — Integrations
  - Add connectors for Shopify, Klaviyo, Google Shopping, Meta Ads, and Shopify Flow.
  - Add telemetry for AI credit usage and per-action accounting.

- Phase 4 — UX and dashboards
  - Multi-store and agency dashboards.
  - RBAC enforcement and admin controls.
  - Alerts UI and email/reporting schedules.

- Phase 5 — Experiments & learning
  - A/B testing engine, analytics, and winner promotion.
  - AI feedback loop to capture human validation and retrain models.

Minimal API surface to add in Phase 1 (examples):

- `POST /api/optimize/product` — submit product for optimization (dry-run option).
- `POST /api/optimize/catalog` — one-click full-catalog optimization.
- `GET /api/optimize/snapshot/{id}` — view snapshot and allow revert.
- `POST /api/abtest` — create A/B test for product title/description.

Recommended immediate tasks:

- Add unit tests for `app/optimizations/manager.py` stubs.
- Add db migration stubs for snapshots and records.
- Create integration adapters directory: `app/optimizations/adapters/`.
