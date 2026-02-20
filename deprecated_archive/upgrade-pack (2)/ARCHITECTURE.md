        # Architecture Overview (high level)
        ## Components
        - Frontend: React + TypeScript (served by Node or static site CDN)
        - Backend API: Node.js (Express) or Python microservice(s)
        - Database: PostgreSQL (recommended)
        - Cache: Redis (recommended for rate-limiting, sessions)
        - Messaging: Optional RabbitMQ or SQS for async jobs (image processing, etc)
        - Storage: Cloud object store (S3-compatible) for user assets

## Deployment
        - Kubernetes for orchestration (Deployment, Service, Ingress)
        - CI builds images and pushes to private registry; CD deploys Helm chart

## Observability & Security
        - Metrics (Prometheus), Tracing (Jaeger), and centralized logs (ELK / Loki)
        - Image scanning in CI (Trivy), dependency scanning (Snyk/Dependabot)
        - Secrets from a managed secret store (KMS, Vault, or GitHub Secrets)
