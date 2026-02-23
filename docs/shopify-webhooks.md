# Webhooks

This document lists the Shopify webhooks used by DigiCloset, describes how payloads are used, and explains idempotency and recovery behavior.

## Webhooks (topics)

The app registers or expects the following webhook topics in merchant stores:

- `app/uninstalled` (implemented)
- `products/create` (recommended / used by product-sync flows)
- `products/update` (recommended / used by product-sync flows)
- `orders/create` (optional — used only if billing or order-triggered flows are enabled)

Note: `app/uninstalled` handling is implemented in `shopify-app-core/webhook.js` and is wired to a backend cleanup flow. Product webhooks are implied by the product sync/optimization code paths (`app/optimizations/` and `app/optimizations/adapters/shopify.py`) and should be registered during install. `orders/create` may be used by billing or analytics integrations when enabled.

## How payloads are used

- `app/uninstalled`:
  - Purpose: Remove merchant credentials and stored merchant-specific data.
  - Payload: Shop domain and metadata are used to identify the merchant account to clean up.
  - Implementation: The webhook endpoint acknowledges the webhook and enqueues or executes store cleanup (deleting tokens, mappings, billing records, feedback entries).

- `products/create` / `products/update`:
  - Purpose: Trigger catalog re-indexing or re-analysis so AI-generated outfit bundles remain in sync with the merchant catalog.
  - Payload: The product resource (id, title, variants, images) is used to update internal product mapping or to schedule a re-run of the recommendation pipeline.

- `orders/create`:
  - Purpose (optional): Support analytics, conversion tracking, or billing events if configured.
  - Payload: The order payload can be used to record revenue-attribution events or for usage-based billing calculation.

## Idempotency and retry handling

- Shopify will retry webhook deliveries on non-2xx responses. To avoid duplicate processing the backend:
  - Verifies webhook signatures (HMAC) to authenticate payloads before processing.
  - Uses idempotency keys derived from resource id + topic + delivery timestamp, or persistent webhook delivery IDs if available, to detect and ignore duplicate deliveries.
  - Writes minimal, idempotent updates (e.g., enqueueing a reindex job or upserting product metadata) so repeated deliveries do not create inconsistent state.

## Failure and recovery behavior

- On transient failures (e.g., downstream DB unavailable) the webhook handler returns a non-2xx response so Shopify will retry the delivery according to its retry policy.
- For long-running work (heavy re-indexing or AI tasks) the webhook handler should enqueue an asynchronous job and return 200 immediately to acknowledge receipt.
- If the app detects repeated failures for the same webhook topic and shop, the monitoring/alerting pipeline should notify the maintainers and/or the merchant via the admin UI.

## Endpoints (examples)

- `POST /webhooks/app_uninstalled` — receives uninstall notifications from Shopify.
- `POST /webhooks/products/create` — recommended; handler should enqueue product sync job.
- `POST /webhooks/products/update` — recommended; handler should upsert product data and re-schedule analysis.
- `POST /webhooks/orders/create` — optional; used for analytics or usage billing events.
