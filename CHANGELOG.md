# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **CI/CD**: Added backend build jobs to `.github/workflows/docker-image.yml` to ensure backend services are built and tested in the CI pipeline.
- **Scripts**: Added `local_verification.ps1` PowerShell script to facilitate local testing of Docker builds for all services (model-service, backend) in both upgrade packs.
- **Documentation**: Added maintainer information for Aditi Singh to `package.json`, `README.md`, and `CONTRIBUTING.md`.
- **Backend Configuration**: Restored missing `requirements.txt` and `Dockerfile` for `digicloset-upgrade-pack/backend` and `digicloset-upgrade-pack-complete/backend`.
- **Model Service Configuration**: Restored missing `requirements.txt` for `digicloset-upgrade-pack/model-service` and `digicloset-upgrade-pack-complete/model-service`.

### Changed
- **Dockerfiles**: Updated `digicloset-upgrade-pack/model-service/Dockerfile` and `digicloset-upgrade-pack-complete/model-service/Dockerfile` to use correct `COPY` paths relative to the build context.
- **Workflow**: Fixed syntax error in `.github/workflows/generator-generic-ossf-slsa3-publish.yml` (removed duplicate `uses:` key).

### Fixed
- **Root Configuration**: Restored missing `package.json` in the project root to fix frontend build dependency resolution.
- **CI Pipeline**: Resolved failures in the "Docker Image CI" workflow caused by missing backend build definitions and incorrect Dockerfile paths.

## [1.0.0] - 2026-02-13
### Initialized
- Initial project structure and documentation.
