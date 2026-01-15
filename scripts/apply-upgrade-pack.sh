#!/usr/bin/env bash
set -euo pipefail

# apply-upgrade-pack.sh
# Usage: ./apply-upgrade-pack.sh /path/to/upgrade-pack.zip [target-repo-path]
#
# This script:
# 1. Unpacks the upgrade pack to a temp dir
# 2. Creates a new branch in the target repo
# 3. Copies files into the repo (asks before overwriting)
# 4. Runs npm ci, npm run lint, npm run test (if present)
# 5. Commits changes and generates a patch file
# 6. Optional automatic GitHub PR creation
#
# SAFE, INTERACTIVE, REVERSIBLE

ZIP_PATH="${1:-}"
TARGET_REPO="${2:-.}"

if [[ -z "$ZIP_PATH" ]]; then
  echo "Usage: $0 /path/to/upgrade-pack.zip [target-repo-path]"
  exit 2
fi

if [[ ! -f "$ZIP_PATH" ]]; then
  echo "Zip not found: $ZIP_PATH"
  exit 3
fi

ZIP_PATH="$(cd "$(dirname "$ZIP_PATH")" && pwd)/$(basename "$ZIP_PATH")"
TARGET_REPO="$(cd "$TARGET_REPO" && pwd)"

TMPDIR="$(mktemp -d /tmp/upgrade-pack.XXXX)"
echo "Unpacking $ZIP_PATH to $TMPDIR"
unzip -q "$ZIP_PATH" -d "$TMPDIR"

pushd "$TARGET_REPO" > /dev/null

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree not clean. Commit or stash changes first."
  exit 4
fi

BRANCH="upgrade/enterprise-pack-$(date +%Y%m%d%H%M%S)"
echo "Creating branch $BRANCH"
git checkout -b "$BRANCH"

echo "Backing up repo to .upgrade_backup/"
mkdir -p .upgrade_backup
rsync -a --delete --exclude='.git' "$TARGET_REPO/" .upgrade_backup/

echo "Copying files from upgrade pack..."
OVERWRITE_ALL="no"
SKIP_ALL="no"

while IFS= read -r -d '' file; do
  rel="${file#"$TMPDIR"/}"
  dest="$TARGET_REPO/$rel"
  mkdir -p "$(dirname "$dest")"

  if [[ -e "$dest" && "$OVERWRITE_ALL" != "yes" && "$SKIP_ALL" != "yes" ]]; then
    echo "File exists: $rel"
    PS3="Choose action: "
    select opt in "Overwrite" "Skip" "Overwrite-All" "Skip-All" "Show-Diff" "Cancel"; do
      case $REPLY in
        1) cp -a "$file" "$dest"; break;;
        2) echo "Skipping $rel"; break;;
        3) OVERWRITE_ALL="yes"; cp -a "$file" "$dest"; break;;
        4) SKIP_ALL="yes"; echo "Skipping $rel"; break;;
        5)
          echo "----- DIFF FOR $rel -----"
          git --no-pager diff --no-index "$dest" "$file" || true
          ;;
        6) echo "Cancelled."; exit 5;;
        *) echo "Invalid.";;
      esac
    done
  else
    cp -a "$file" "$dest"
  fi
done < <(find "$TMPDIR" -type f -print0)

echo "Files copied. Running git status..."
git add -A
git status --short

echo "Running optional npm checks..."
if [[ -f package.json ]]; then
  if command -v npm >/dev/null 2>&1; then
    echo "npm ci..."
    npm ci || true
    echo "npm run lint..."
    npm run lint || true
    echo "npm run test..."
    npm run test || true
  fi
else
  echo "No package.json found; skipping npm checks."
fi

echo "Committing..."
git commit -m "chore: apply enterprise upgrade pack" || echo "No changes."

PATCHFILE="../upgrade-pack-$(date +%Y%m%d%H%M%S).patch"
echo "Generating patch at $PATCHFILE"
git format-patch origin/main --stdout > "$PATCHFILE" || git diff origin/main > "$PATCHFILE"

echo "Patch created: $PATCHFILE"

if command -v gh >/dev/null 2>&1; then
  read -p "Create GitHub PR now? (y/N) " ans
  if [[ "${ans,,}" == "y" ]]; then
    gh pr create --fill
  fi
fi

popd > /dev/null
echo "Migration finished. Review before merging."
