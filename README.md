
# DigiCloset: Shopify "Complete the Look" Outfit Bundles

DigiCloset is a Shopify custom/private app for merchants. It uses AI to generate “Complete the Look” outfit bundles from your product catalog, helping you increase average order value and deliver personalized shopping experiences.

## What It Does
- Analyzes your Shopify product catalog
- Suggests AI-powered outfit bundles (tops, bottoms, accessories, etc.)
- Designed for Shopify merchants and store staff
- Simple, focused, and production-ready for merchant use

## How to Use
1. **Install the app** in your Shopify store (private/custom app setup)
2. **Sync your product catalog** (automatic or manual trigger)
3. **View and edit suggested outfit bundles** in the merchant dashboard
4. **Publish bundles** to your storefront or use in marketing

## Local Development
1. Clone this repository:
   ```bash
   git clone <repo-url>
   cd digicloset
   ```
2. Install dependencies and start services:
   ```bash
   # Example using Docker Compose
   docker-compose -f digicloset-upgrade-pack/docker-compose.dev.yml up
   ```
3. Access the merchant dashboard at http://localhost:3000 (or as configured)

## Key Folders
- **digicloset-upgrade-pack/**: Main backend, model service, and infra for Shopify merchant use
- **ai-service-layer/**: AI logic for outfit bundle generation
- **config/**: App and integration configuration

## For Developers
- Keep all features merchant/store-focused
- Do not add enterprise, hackathon, or experimental scaffolding
- See comments in deprecated folders for what is safe to delete

## Support
Open an issue or contact the maintainers for help with Shopify integration or merchant onboarding.
