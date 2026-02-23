# Data deletion and merchant privacy

This document explains what merchant data the DigiCloset app stores, what is removed on uninstall, timing for deletions, and assurances about post-uninstall persistence.

## What merchant data is stored

Examples of merchant-scoped data stored by the app (present in repository):

- OAuth/shop session tokens needed to call Shopify APIs (stored server-side during install).
- Lightweight feedback logs (example: `feedback_log.jsonl` created by `app/services/feedback_service.py`).
- Billing records (example scaffold: `backend/billing_store.json`).
- Optional product/variant mapping and metadata if the merchant enables the upgrade pack (`digicloset-upgrade-pack-complete/backend/app/models.py`).

The app does not store raw payment information or customer credit card data — those remain with Shopify.

## What is deleted on app uninstall

- On receipt of the `app/uninstalled` webhook the app will:
  - Invalidate and delete any stored access tokens or sessions for the merchant.
  - Remove merchant-scoped records such as product mappings, billing records, and feedback logs associated with that merchant.
  - Optionally remove any Shopify metafields or app-specific annotations the app had written (if configured to do so).

## Deletion timing

- Deletion is triggered immediately upon processing the `app/uninstalled` webhook. For safety and scale the app may enqueue a background cleanup job; the webhook handler will acknowledge receipt immediately while cleanup proceeds.

## Confirmation of no persistent data post-uninstall

- The app is designed to remove merchant-specific data when the uninstall webhook is received. After uninstall cleanup completes the app will not retain merchant OAuth tokens, product mappings, or billing records tied to the uninstalled store.

If you require an export of merchant data before deletion (for merchant compliance or records), implement an admin UI flow that allows merchants to request their data prior to uninstall; the repository includes scaffolding points where this can be added.
