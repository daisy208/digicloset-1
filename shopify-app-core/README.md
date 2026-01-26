# DigiCloset Shopify Private App

This is a private Shopify app for DigiCloset, enabling "Complete the Look" outfit bundles on product pages.

## Features
- OAuth install flow
- Secure credential storage (in-memory for dev, TODO: use DB for prod)
- Minimal merchant admin UI (React + Polaris)
- Webhook for app uninstall (store cleanup)
- Billing scaffolding (placeholder)
- Storefront widget for outfit bundles (calls backend API)

## Setup
1. Copy `.env` and fill in your Shopify app credentials.
2. Run `npm install`.
3. Start with `npm run dev`.

## TODO
- Implement production credential storage
- Complete React admin UI
- Implement webhook and widget logic
- Add billing logic
