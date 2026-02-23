# Billing

This document explains how DigiCloset uses Shopify Billing APIs, trial behavior, upgrade/downgrade flows, and cancellation behavior.

## Billing integration

- The repository contains billing scaffolding under `shopify-billing/` and `backend/billing_service.py`. The NodeJS portion uses the `@shopify/shopify-api` billing helpers (see `shopify-billing/billing.js`) to create and verify charges using Shopify's Billing API.

## Trial behavior

- The app supports trial periods via Shopify's Billing API billing plans (trial length is configured when the charge is created). During the trial the app grants the merchant access to app features.
- Merchant credit card capture and payment processing remain handled by Shopify; the app receives billing activation callbacks and records the subscription locally for bookkeeping.

## Upgrade / downgrade flow

- Upgrades and downgrades are handled by initiating a new billing charge/plan via Shopify's billing flow. The merchant is redirected to Shopify's hosted approval page to accept the change.
- After the merchant approves the new plan, the app receives the confirmation and updates local billing records. The app should enforce entitlement checks on feature access based on the active plan.

## Cancellation behavior

- Cancellation occurs when a recurring charge is cancelled in Shopify or the merchant uninstalls the app.
- On uninstall (app/uninstalled webhook), the app removes merchant data and revokes access as described in `docs/data-deletion.md`.

## Notes for review

- The app relies on Shopify Billing APIs and does not handle sensitive payment data directly.
- For any production release, ensure you create billing plans in the Partner Dashboard and test the full billing flow in partner-preview stores prior to publishing.
