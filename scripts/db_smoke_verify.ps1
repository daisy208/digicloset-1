# Offline-safe DB smoke verification (no Docker required).
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

Step "Required DB paths exist" {
    $required = @("prisma/schema.prisma", "db/migrations", "db/migrations/rollbacks")
    foreach ($path in $required) {
        if (!(Test-Path $path)) { throw "Missing required path: $path" }
    }
}

Step "Prisma schema static sanity" {
    $schema = Get-Content "prisma/schema.prisma" -Raw
    if ($schema -notmatch "generator\s+client") { throw "Missing generator client block" }
    if ($schema -notmatch "datasource\s+db") { throw "Missing datasource db block" }
    if ($schema -notmatch "model\s+\w+") { throw "No Prisma model definitions found" }
}

Step "Migration filename policy" {
    $regex = '^\d{14}_[a-z0-9_]+\.sql$'
    $files = Get-ChildItem "db/migrations" -File -Filter *.sql
    foreach ($f in $files) {
        if ($f.Name -notmatch $regex) {
            throw "Invalid migration filename: $($f.Name)"
        }
    }
}

Step "Forward/rollback pairing" {
    $forwards = Get-ChildItem "db/migrations" -File -Filter *.sql | Select-Object -ExpandProperty Name
    foreach ($name in $forwards) {
        $rollback = Join-Path "db/migrations/rollbacks" $name
        if (!(Test-Path $rollback)) {
            throw "Missing rollback for migration: $name"
        }
    }
}

Step "SQL sanity and dry-run plan" {
    $files = Get-ChildItem "db/migrations" -File -Filter *.sql | Sort-Object Name
    foreach ($f in $files) {
        $sql = Get-Content $f.FullName -Raw
        if ([string]::IsNullOrWhiteSpace($sql)) { throw "Empty migration file: $($f.Name)" }
        if ($sql -notmatch "(?i)\bBEGIN\b") { throw "Missing BEGIN in $($f.Name)" }
        if ($sql -notmatch "(?i)\bCOMMIT\b") { throw "Missing COMMIT in $($f.Name)" }
        if ($sql -notmatch ";") { throw "Missing statement terminator in $($f.Name)" }
    }
    Write-Host ("Dry-run order: " + (($files | Select-Object -ExpandProperty Name) -join ", "))
}

if ($failed) {
    Write-Host "DB smoke verification failed." -ForegroundColor Red
    exit 1
}

Write-Host "DB smoke verification passed." -ForegroundColor Green
