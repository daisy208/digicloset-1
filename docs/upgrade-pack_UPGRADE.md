```text
Upgrade pack: how to apply in this repository

1) Inspect and adapt templates
   - Review upgrade-pack/package.json and add your actual dependencies.
   - Edit .github/workflows/ci-cd.yml: set image registry secrets and any project-specific steps.

2) Copy files into repo
   - Create a directory `upgrade-pack` in repo root for review, or move files into appropriate roots:
     - LICENSE -> /LICENSE
     - package.json -> /package.json (merge with existing if present)
     - .github/workflows/ci-cd.yml -> /.github/workflows/ci-cd.yml
     - CONTRIBUTING.md -> /CONTRIBUTING.md
     - SECURITY.md -> /SECURITY.md
     - UPGRADE.md -> /UPGRADE.md (keep a copy here)

3) Validate locally
   - Install dependencies: npm ci (or yarn/pnpm)
   - Build: npm run build
   - Run tests: npm test
   - Run locally: npm start (or npm run dev)

4) Test CI
   - Push to a feature branch and open a PR. Ensure workflow runs and passes.

5) Containerization & deployment
   - Push to your registry or configure workflow to push on release.

6) Security & scanning
   - Enable Dependabot (or Snyk) and GitHub code scanning.
   - Generate SBOM as part of CI if required.

```
