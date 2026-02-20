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


5. **Engineering Discipline Rules:**
   - **No Model Change Without Registry Update:** Any change to the model selection must be reflected in `docs/model_registry.yaml`.
   - **No Credit Spending Without Experiment Log:** all cost-incurring runs must be logged in `docs/experiments/`.
   - **No Parameter Change Without Changelog Entry:** Any change to generation parameters (steps, guidance, etc.) must be documented in `CHANGELOG.md`.
   - **No Production Switch Without Quantitative Comparison:** Switching the production model requires a quantitative comparison (SSIM, Keypoint Deviation) against the baseline.

For more details, see CONTRIBUTING.md.
