# Permissions requested and justification

This document lists the Shopify OAuth scopes the app requests and why each is required. Only the scopes present or implied in the repository are listed.

## Scopes requested

- `read_products` — Required to read product catalog data (title, images, variants) to generate outfit bundles and to display product suggestions in the admin UI and storefront widget.

- `write_products` — Required only when the app is configured to write lightweight product metadata or metafields (for example, to tag products that have generated outfit bundles or to store small metadata used by the app). This permission is not used to modify pricing or inventory.

## Justification

- `read_products`: The core feature (catalog analysis and outfit generation) requires product information. The app only requests the minimal product read permission required to build recommendations.

- `write_products`: Some stores may opt to store small metadata back on the product (metafields or tags) to cache recommendation state. This scope allows safe upserts of those metadata fields. If your deployment does not write to product metadata, you may omit this scope.

## Impact if permission is revoked

- If `read_products` is revoked, the app cannot generate or refresh outfit bundles; product-dependent features in the admin UI and storefront widget will be disabled until permissions are restored.
- If `write_products` is revoked, the app will continue to function for read-only workflows but cannot persist product-level metadata or tags; the app will still provide recommendations in-memory or via cached results if available.
