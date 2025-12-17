#!/usr/bin/env bash
set -euo pipefail
pip install cyclonedx-bom
cyclonedx-bom -o sbom.xml
echo "SBOM generated: sbom.xml"
