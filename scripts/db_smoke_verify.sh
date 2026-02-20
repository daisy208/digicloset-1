#!/usr/bin/env bash
set -euo pipefail

echo "[STEP] Required DB paths exist"
[[ -f "prisma/schema.prisma" ]] || { echo "[FAIL] missing prisma/schema.prisma"; exit 1; }
[[ -d "db/migrations" ]] || { echo "[FAIL] missing db/migrations"; exit 1; }
[[ -d "db/migrations/rollbacks" ]] || { echo "[FAIL] missing db/migrations/rollbacks"; exit 1; }
echo "[PASS] Required DB paths exist"

echo "[STEP] Prisma schema static sanity"
grep -Eq "generator[[:space:]]+client" prisma/schema.prisma || { echo "[FAIL] missing generator client block"; exit 1; }
grep -Eq "datasource[[:space:]]+db" prisma/schema.prisma || { echo "[FAIL] missing datasource db block"; exit 1; }
grep -Eq "model[[:space:]]+[A-Za-z0-9_]+" prisma/schema.prisma || { echo "[FAIL] no Prisma model definitions"; exit 1; }
echo "[PASS] Prisma schema static sanity"

echo "[STEP] Migration filename policy"
shopt -s nullglob
for f in db/migrations/*.sql; do
  name="$(basename "$f")"
  [[ "$name" =~ ^[0-9]{14}_[a-z0-9_]+\.sql$ ]] || { echo "[FAIL] invalid migration filename: $name"; exit 1; }
done
echo "[PASS] Migration filename policy"

echo "[STEP] Forward/rollback pairing"
for f in db/migrations/*.sql; do
  name="$(basename "$f")"
  [[ -f "db/migrations/rollbacks/$name" ]] || { echo "[FAIL] missing rollback for migration: $name"; exit 1; }
done
echo "[PASS] Forward/rollback pairing"

echo "[STEP] SQL sanity and dry-run plan"
order=()
for f in $(ls db/migrations/*.sql 2>/dev/null | xargs -n1 basename | sort); do
  path="db/migrations/$f"
  [[ -s "$path" ]] || { echo "[FAIL] empty migration file: $f"; exit 1; }
  grep -Eiq '\bBEGIN\b' "$path" || { echo "[FAIL] missing BEGIN in $f"; exit 1; }
  grep -Eiq '\bCOMMIT\b' "$path" || { echo "[FAIL] missing COMMIT in $f"; exit 1; }
  grep -q ';' "$path" || { echo "[FAIL] missing statement terminator in $f"; exit 1; }
  order+=("$f")
done
echo "Dry-run order: ${order[*]:-<no migrations yet>}"
echo "[PASS] SQL sanity and dry-run plan"

echo "DB smoke verification passed."
