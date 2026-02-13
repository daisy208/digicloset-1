# Contributing to DigiCloset

Thank you for your interest in contributing! To keep the codebase clean and maintainable, please follow these guidelines:

## Folder Structure
- **Do not create duplicate folders** (e.g., multiple versions of the same service or feature). Consolidate improvements into the canonical folder.
- **Experimental code** must be clearly marked and controlled by feature flags in `config/features.json`. Do not add experimental features as separate folders or services.
- **Multiple frontends** are not allowed without explicit approval from project maintainers. All user-facing apps should live under `apps/` and be reviewed before addition.

## Pull Request Requirements
- Explain any new folders or major structural changes in your PR description.
- Reference the feature flag or configuration for any experimental or in-development code.
- PRs introducing duplicate or redundant code will be rejected.

## Best Practices
- Reuse and extend existing modules where possible.
- Keep documentation up to date for any new features or changes.

For questions, open an issue or contact the maintainer, **Aditi Singh** ([@aditisingh2310](https://github.com/aditisingh2310)).
