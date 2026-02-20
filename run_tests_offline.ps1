# Offline-safe smoke verification (no Docker, no network).
Write-Host "Running offline smoke verification..."

$ErrorActionPreference = "Stop"
$failed = $false

function Step($name, $action) {
    Write-Host ("[STEP] " + $name)
    try {
        & $action
        Write-Host ("[PASS] " + $name) -ForegroundColor Green
    }
    catch {
        Write-Host ("[FAIL] " + $name + " -> " + $_.Exception.Message) -ForegroundColor Red
        $script:failed = $true
    }
}

Step "Python syntax compile" {
    python -m py_compile inference_service\main.py python\app\ai_service.py
}

Step "Inference service import smoke" {
    python -c "import inference_service.main as m; assert callable(getattr(m, 'health')); print('ok')"
}

Step "API route files present" {
    $required = @(
        "app/routes/api.analyze.ts",
        "app/routes/api.v1.analyze.ts",
        "app/routes/api.analyze.shared.server.ts"
    )
    foreach ($f in $required) {
        if (!(Test-Path $f)) { throw "Missing required route file: $f" }
    }
}

Step "Targeted pytest (inference health)" {
    pytest -q tests\unit\test_inference_enterprise.py
}

if ($failed) {
    Write-Host "Offline smoke verification failed." -ForegroundColor Red
    exit 1
}

Write-Host "Offline smoke verification passed." -ForegroundColor Green
