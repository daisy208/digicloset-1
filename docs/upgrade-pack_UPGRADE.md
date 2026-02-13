# Upgrade Pack Integration Guide

This guide outlines the steps to integrate the upgrade pack into your repository.

## 1. Inspect and Adapt Templates
- **Dependencies**: Review `upgrade-pack/package.json` and merge dependencies into your project's `package.json`.
- **Docker Configuration**: Update environment variables, ports, and start commands in the `Dockerfile` to match your application requirements.
- **CI/CD**: Edit `.github/workflows/ci-cd.yml` to configure image registry secrets and any project-specific build steps.

## 2. File Integration
Copy the following files from the `upgrade-pack` directory to your repository root:
- `LICENSE` -> `/LICENSE`
- `Dockerfile` -> `/Dockerfile`
- `.dockerignore` -> `/.dockerignore`
- `package.json` -> `/package.json` (Merge with existing)
- `.github/workflows/ci-cd.yml` -> `/.github/workflows/ci-cd.yml`
- `CONTRIBUTING.md` -> `/CONTRIBUTING.md`
- `SECURITY.md` -> `/SECURITY.md`
- `UPGRADE.md` -> `/UPGRADE.md`

## 3. Local Validation
1. **Install Dependencies**:
   ```bash
   npm ci
   ```
2. **Build Project**:
   ```bash
   npm run build
   ```
3. **Run Tests**:
   ```bash
   npm test
   ```
4. **Start Application**:
   ```bash
   npm run dev
   ```

## 4. CI/CD Testing
Push your changes to a feature branch and open a Pull Request. Ensure that the configured GitHub Actions workflows run and pass successfully.

## 5. Containerization & Deployment
1. **Build Docker Image**:
   ```bash
   docker build -t myregistry/digicloset:prerelease .
   ```
2. **Push Image**: Push the image to your container registry or ensure the CI workflow performs this step on release.

## 6. Security & Scanning
- Enable Dependabot and GitHub Code Scanning.
- Generate and verify SBOMs as part of the CI pipeline.