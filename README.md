
# DigiCloset: Shopify "Complete the Look" Outfit Bundles

DigiCloset is a Shopify custom/private app for merchants. It uses AI to generate “Complete the Look” outfit bundles from your product catalog, helping you increase average order value and deliver personalized shopping experiences.

## What It Does
- Analyzes your Shopify product catalog
- Suggests AI-powered outfit bundles (tops, bottoms, accessories, etc.)
- Designed for Shopify merchants and store staff
- Simple, focused, and production-ready for merchant use

## API Contract
- Canonical application API routes use `/api/v1/...`.
- Primary analyze endpoint: `/api/v1/analyze`.
- Legacy endpoint `/api/analyze` is compatibility-only and will be removed in a future cleanup.

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
   The project consists of a frontend (Shopify app), a backend (FastAPI), and a model service (AI stub).
   
   **Using Docker Compose:**
   ```bash
   docker-compose -f digicloset-upgrade-pack/docker-compose.dev.yml up --build
   ```
   This command starts the Postgres database, MinIO object storage, Backend service (port 8000), and Model service (port 8001).

   **Verifying Builds Locally:**
   A PowerShell script is available to verify that all Docker images build correctly:
   ```powershell
   ./local_verification.ps1
   ```

3. Access the services:
   - **Merchant Dashboard**: http://localhost:3000 (requires frontend dev server)
   - **Backend API**: http://localhost:8000/docs
   - **Model Service**: http://localhost:8001

## Key Folders
- **digicloset-upgrade-pack/**: Contains the main backend `app/`, `model-service/`, and infrastructure configurations for the standard deployment.
- **digicloset-upgrade-pack-complete/**: Contains the complete version of the upgrade pack with additional features or configurations.
- **ai-service-layer/**: Logic for the AI-powered outfit bundle generation.
- **config/**: Configuration files for the application and integrations.
- **legacy/upgrade packs** (`upgrade-pack*`, `enterprise_upgrade_pack*`, `ultimate-enterprise-pack`, `security_hardening_pack_v1`): archive/reference content and non-primary route sets.

## For Developers
- **Focus**: Keep all features focused on the Shopify merchant experience.
- **Restrictions**: Do not add enterprise, hackathon, or experimental scaffolding without approval.
- **Cleanup**: Refer to comments in deprecated folders regarding safe deletion.

## Support
Open an issue or contact the maintainer, **Aditi Singh** ([@aditisingh2310](https://github.com/aditisingh2310)), for assistance with Shopify integration or merchant onboarding.
