# Upgrade Pack — How to apply

This upgrade pack provides templates and actionable files to raise enterprise readiness.

## What is included
- GitHub Actions: CodeQL, CI (lint/test/build), Weekly dependency scan
- Dependabot config for automated dependency update PRs
- Jest sample tests and jest.config.js
- nginx.conf suitable for single-page apps
- Kubernetes manifests and a minimal Helm chart
- Terraform skeleton (AWS S3 example)
- SECURITY.md, THREAT_MODEL.md, CODEOWNERS, .editorconfig

## How to apply
1. Merge the `.github/` folder into your repository root.
3. Run `npm ci` and `npm run test` locally to validate the sample tests.
4. Add secrets to GitHub (e.g., DOCKER_REGISTRY, KUBE_CONFIG) before enabling deployment workflows.
5. Review `terraform/` and replace AWS placeholders with your settings if you use Terraform.

## Notes
- These files are templates. Review, adapt, and harden them before production use.
- Add a dedicated SSO/OAuth integration and a secrets manager (AWS Secrets Manager, HashiCorp Vault).
