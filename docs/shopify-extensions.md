# Shopify Extensions and embedded UI

This document explains which Shopify extension points and UI injection methods DigiCloset uses, performance expectations, and safe fallbacks.

## Extensions and injection points

- Storefront widget: `shopify-app-core/widget.js` is intended to be injected on Product Detail Pages (PDP) to display a "Complete the Look" outfit bundle or a call-to-action.
- Embedded admin UI: The NodeJS app under `shopify-app-core/` uses Polaris and App Bridge for the merchant-facing admin experience (embedded app frame).

## Performance guarantees

- The storefront widget performs asynchronous API calls to the backend and is loaded asynchronously to avoid blocking page paint.
- Backend AI operations are executed server-side and do not run in the browser. The storefront widget displays cached or progressively loaded results and uses client-side timeouts to avoid blocking the customer experience.

## Fallback behavior

- If the app API or AI service is unavailable, the widget degrades gracefully:
  - It will hide itself or display a minimal fallback message (for example, "Recommendations temporarily unavailable").
  - It will not interrupt or block page interaction or checkout.
- Admin UI actions that depend on Shopify APIs will surface clear error states to the merchant if upstream Shopify API calls fail.

## Checkout safety

- DigiCloset does not modify checkout logic or block checkout. Any cart or checkout-related actions (for example, adding SKUs suggested by the widget) are executed using standard Shopify storefront Javascript APIs and never block or modify payment flows directly.
