## DigiCloset

DigiCloset is a modular, AI-powered digital wardrobe and fashion management platform. It helps users organize, recommend, and optimize clothing choices using advanced machine learning and data analytics.

### Target Users
- **B2C:** Individual consumers seeking smart wardrobe management, outfit recommendations, and virtual try-on experiences.
- **B2B:** Retailers, fashion brands, and e-commerce platforms integrating AI-driven personalization, inventory insights, and customer engagement tools.

### Architecture Overview
DigiCloset follows a modern, scalable monorepo structure:
- **apps/**: User-facing applications (e.g., frontend web, admin portal)
- **services/**: Core backend, AI/model, and orchestration services
- **packages/**: Shared libraries, utilities, and configuration
- **infra/**: Deployment, CI/CD, and infrastructure as code
All features are controlled via configuration flags, enabling flexible tiering (Free, Pro, Enterprise) without code duplication.

### How to Run Locally
1. Clone the repository and install dependencies:
   ```bash
   git clone <repo-url>
   cd digicloset
   # Install dependencies for all apps/services (use your package manager)
   ```
2. Start required services (e.g., backend, model-service, frontend):
   ```bash
   # Example using Docker Compose
   docker-compose -f infra/docker/docker-compose.dev.yml up
   ```
3. Access the frontend at http://localhost:3000 and API at http://localhost:8000 (ports may vary).

### Where to Add Features
- **Frontend features:** apps/frontend/
- **Backend logic & APIs:** services/backend/
- **AI/model logic:** services/model-service/
- **Shared code/utilities:** packages/
- **Infrastructure/config:** infra/
Enable or restrict features by updating config/features.json.

For more details, see the docs/ directory.
