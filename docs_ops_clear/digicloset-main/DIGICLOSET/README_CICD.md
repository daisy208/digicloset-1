# README_CICD.md

## Overview
This pack adds enterprise-grade **CI/CD automation** for Digicloset.

### Key Features
- ✅ Automatic testing on each PR or commit to `main`
- 🔍 Security scanning (Bandit, ESLint, Trivy)
- 🗄 Supabase DB migration automation

### GitHub Secrets Required
| Secret | Description |
|---------|--------------|
| `GHCR_PAT` | GitHub Personal Access Token with `write:packages` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for migration script |

### How to Enable
1. Commit this folder to your repo.
2. Add required secrets under **Repo → Settings → Secrets → Actions**.
3. Push to `main` to trigger CI/CD.

### Output
- GHCR images pushed to: `ghcr.io/<your-username>/digicloset-backend:latest`
- GitHub Actions dashboard shows test & deploy status.

---
✅ *This pack ensures automated, secure, and consistent deployments for enterprise environments.*
