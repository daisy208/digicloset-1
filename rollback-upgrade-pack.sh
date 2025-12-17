#!/usr/bin/env bash
set -euo pipefail

# rollback-upgrade-pack.sh
# Usage: ./rollback-upgrade-pack.sh
# Restores from .upgrade_backup

if [[ ! -d ".upgrade_backup" ]]; then
  echo "No .upgrade_backup found. Cannot rollback."
  exit 1
fi

echo "This will restore from .upgrade_backup. Continue? (y/N)"
read -r ans
if [[ "${ans,,}" != "y" ]]; then
  echo "Aborted."
  exit 0
fi

echo "Restoring..."
rsync -a --delete .upgrade_backup/ ./

echo "Committing rollback..."
git add -A
git commit -m "chore: rollback upgrade pack" || echo "Nothing to commit."

echo "Rollback complete. Run tests."
