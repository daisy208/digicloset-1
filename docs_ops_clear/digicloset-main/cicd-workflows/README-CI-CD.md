
# CI / CD Workflows for virtualfit-enterprise

This archive contains several example CI/CD configurations tailored to this Vite React project.

Included:
- `.github/workflows/ci.yml` — Standard CI (install, lint, build).
- `.github/workflows/deploy-gh-pages.yml` — Build and deploy to GitHub Pages (push to `main`).
- `.gitlab-ci.yml` — GitLab CI pipeline (install, lint, build, pages deploy).
- `bitbucket-pipelines.yml` — Bitbucket Pipelines example.
- `README-CI-CD.md` (this file)

## Notes & required secrets

### GitHub
- For `deploy-gh-pages.yml`, no extra secret is required beyond the default `GITHUB_TOKEN`.

### GitLab
- For pushing images to GitLab Container Registry or deploying to another target, set `CI_REGISTRY_USER` and `CI_REGISTRY_PASSWORD` in project CI/CD settings.

### Bitbucket
- Add repository variables for any credentials used during deployment (S3, Netlify, SSH, etc).

## Deployment targets
This project is a static frontend (Vite). Common targets:
- **Vercel** — Connect GitHub repo for instant deployments.
- **Netlify** — Connect repo or use `netlify` CLI in CI to deploy `dist`.
- **GitHub Pages** — Configured in `deploy-gh-pages.yml`.

## Customization
- If you have tests, add a `test` job and run `npm test`.
- Adjust Node versions in the workflows if your project requires a different runtime.
- Replace `publish_dir` or `dist` paths if your Vite config outputs elsewhere.
