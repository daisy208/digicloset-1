
# Upgrade Notes - DIGICLOSET (v2)

## Goals
- Fix broken paths (directories containing spaces)
- Consolidate environment management and secrets
- Add CI pipeline for code quality and tests
- Provide instructions & automation to apply changes safely

## Steps performed by scripts in this pack
1. Detect directories/filenames containing whitespace and offer renaming mappings.
3. Create `.github/workflows/ci.yml` with lint/test/build steps for Node and Python.
4. Create `requirements.txt` and `package.json` placeholders for dependency management.
5. Add simple unit tests and linters (flake8, eslint) configuration.
6. Add `monitoring/otel-collector.yaml` template and `nginx/nginx.conf` production stub.
7. Provide `apply-upgrade-pack.sh` which will print the suggested git commands to apply fixes.

**Important:** This pack does not automatically modify your repo. It provides scripts & templates. Review before applying.
