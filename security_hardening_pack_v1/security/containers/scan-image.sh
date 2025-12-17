#!/usr/bin/env bash
set -euo pipefail
IMAGE=$1
if [ -z "$IMAGE" ]; then
  echo "Usage: $0 <image:tag>"
  exit 2
fi
echo "Scanning $IMAGE with trivy..."
trivy image --severity HIGH,CRITICAL "$IMAGE"
