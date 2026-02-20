#!/usr/bin/env bash
set -euo pipefail

echo "[STEP] Python syntax compile"
python -m py_compile inference_service/main.py python/app/ai_service.py
echo "[PASS] Python syntax compile"

echo "[STEP] Inference service import smoke"
python -c "import inference_service.main as m; assert callable(getattr(m, 'health')); print('ok')"
echo "[PASS] Inference service import smoke"

echo "[STEP] API route files present"
for f in app/routes/api.analyze.ts app/routes/api.v1.analyze.ts app/routes/api.analyze.shared.server.ts; do
  [[ -f "$f" ]] || { echo "[FAIL] missing required route file: $f"; exit 1; }
done
echo "[PASS] API route files present"

echo "[STEP] Targeted pytest (inference health)"
pytest -q tests/unit/test_inference_enterprise.py
echo "[PASS] Targeted pytest (inference health)"

echo "Offline smoke verification passed."
