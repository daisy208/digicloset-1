# DigiCloset — Shopify App Architecture

This document describes the DigiCloset Shopify embedded app architecture, request lifecycle, where AI/inference runs, and operational boundaries relevant to Shopify App Store review.

## App type

- Embedded Shopify App (merchant admin UI and an embeddable product page widget).
- The repository contains a NodeJS Shopify app scaffold under `shopify-app-core/` and a Python backend under `app/` which provides AI and API endpoints.

## OAuth / Install flow

- The NodeJS app (see `shopify-app-core/index.js` and `shopify.config.js`) implements the standard OAuth install flow using `@shopify/shopify-api`:
  1. Merchant clicks install and the app redirects to Shopify's OAuth authorization (`shopify.auth.begin`).
  2. Merchant consents to requested scopes. The app exchanges the temporary code in the callback (`shopify.auth.callback`) for a permanent access token.
  3. The app stores the shop session information server-side and registers required webhooks and script injections.

## Backend request lifecycle

- UI requests originate from either the embedded admin UI (App Bridge/Polaris) or the injected storefront widget (`shopify-app-core/widget.js`).
- Frontend calls backend APIs under the FastAPI service (`app/`) at endpoints mounted under `/api/*` (see `app/main.py` and `app/api/router.py`).
- Requests that require Shopify access are proxied through the NodeJS Shopify adapter or the Python Shopify adapter, using the stored shop access token to call Shopify REST/GraphQL APIs.

## Where AI / inference runs

- AI inference components are implemented in the Python backend under `app/ai/`:
  - `app/ai/services/ai_service.py` — central AI service abstraction with lazy model loading and async-safe execution.
  - `app/ai/pipelines/` — model pipeline loaders that perform lazy imports (so models are only loaded when needed).
- Inference runs server-side in the Python service. Blocking model calls are executed in a thread pool or background tasks to avoid blocking the event loop.
- Tests and CI are designed to mock the AI service so real model downloads are not required during review.

## Shopify APIs used

- The app integrates with Shopify via the official `@shopify/shopify-api` (NodeJS) adapter (see `shopify-app-core/shopify.config.js`).
- Scopes configured in the repository include product read/write scopes (see `python/app/logging_conf_enterprise.py` and CI workflows). The app primarily uses:
  - Products API (REST or GraphQL) — to read product data for generating outfit bundles and to optionally write product metafields or tags.
  - Billing API via `@shopify/shopify-api` billing helpers (see `shopify-billing/` and `shopify-billing/billing.js`).

## Data storage boundaries

- Persistent merchant data stored by the app (examples in repository):
  - Lightweight file-backed logs such as `feedback_log.jsonl` (under `app/services`) used to collect merchant feedback.
  - Billing records stored in `backend/billing_store.json` (billing service scaffold).
  - Optional SQL models in `digicloset-upgrade-pack-complete/backend/app/models.py` (Shopify product/variant mapping) for stores that enable the upgrade pack.
- Shopify-hosted data (products, orders, checkout) remains on Shopify. The app only stores the merchant access token and merchant-scoped metadata required to operate the app.

## Safe failure behavior

- Web and widget endpoints are designed to fail gracefully:
  - The storefront widget performs API calls asynchronously and falls back to a no-op UI if the app or API is unavailable.
  - AI inference endpoints return a graceful degraded response if the model is unavailable or if timeouts occur (see `app/ai/services/ai_service.py`).
  - App uninstall webhook triggers cleanup of stored merchant data (see `docs/data-deletion.md`).

If you need additional details for the review (example OAuth traces or exact scope lists for a release), I can provide them or include them in the repo.
