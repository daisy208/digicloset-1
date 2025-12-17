# Suggested Security Improvements
- Add dependency scanning in CI (Snyk/GitHub CodeQL)
- Add container image scanning (Trivy) in CI
- Do not check in secrets; use GitHub Secrets and a secret manager in prod
- Rotate JWT_SECRET and other long-lived secrets periodically
