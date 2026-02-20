
#!/usr/bin/env bash
set -eu

echo "=== DIGICLOSET Upgrade Pack v2 ==="
echo "This script will print recommended commands to apply to your repository."
echo "Review them before running."

REPO_ROOT="$(pwd)"
echo
echo "1) Detect files and directories with trailing or interior spaces:"
echo "   Run: find . -name '* *' -print"
echo
echo "Sample rename commands (use 'git mv' to keep history):"
echo
# We'll produce mapping by scanning current repo with python - but here we print recommended steps
cat <<'CMD'
# Example (adapt paths as necessary):
# git mv "DIGICLOSET /model_registry_enterprise.py" "DIGICLOSET/model_registry_enterprise.py"
# git mv "DIGICLOSET /metrics_enterprise.py" "DIGICLOSET/metrics_enterprise.py"
# git commit -m "Rename files: remove spaces from DIGICLOSET paths"
CMD

echo
echo
echo "3) Add CI pipeline (.github/workflows/ci.yml)."
echo "   Push to remote to trigger pipeline."
echo
echo "4) Consolidate env files: copy env.example -> .env and fill secrets."
echo
echo "5) Run tests and linters locally:"
echo "   npm install && npm test && flake8 ."
echo
echo "Upgrade pack contains templates. Apply changes with `git` to preserve history."
