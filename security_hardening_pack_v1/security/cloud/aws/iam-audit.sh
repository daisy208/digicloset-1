#!/usr/bin/env bash
set -euo pipefail
echo "Listing IAM users with console access..."
aws iam list-users --output json
echo "Listing inline policies..."
aws iam list-policies --scope Local --output json
