
# DIGICLOSET - Upgrade Pack v2

This upgrade pack contains scripts, templates and configuration to modernize and fix the repository you provided.
Run `./apply-upgrade-pack.sh` from the repository root (it will only *print* actions; inspect before running).

**Main fixes included:**
- Normalize directory names (remove trailing spaces)
- Add GitHub Actions CI pipeline (lint, test, build)
- Consolidate environment variables and examples
- Add dependency manifests (requirements.txt, package.json consolidated)
- Add skeleton unit tests and linting config
- Add monitoring/telemetry starter configs
- Provide migration and safety scripts

See UPGRADE_NOTES.md for details and next steps.
