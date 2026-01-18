# Repository Rules for DigiCloset

1. **No Duplicate Folders:**
   - Do not add folders that duplicate existing functionality or services. Refactor or extend the canonical implementation instead.
2. **Experimental Code:**
   - All experimental features must be gated by a feature flag in `config/features.json`.
   - Experimental code must not be added as separate folders or services.
3. **Frontends:**
   - Only one canonical frontend is allowed in `apps/frontend/` unless explicit approval is granted by maintainers.
   - Proposals for additional frontends must be discussed and approved via an issue or RFC.
4. **Pull Request Checks:**
   - PRs introducing duplicate folders, ungated experimental code, or unapproved frontends will be rejected.

For more details, see CONTRIBUTING.md.
