Write-Host "=== Testing Demo Connectivity ===" -ForegroundColor Cyan

try {
    $r = Invoke-WebRequest -Uri 'http://localhost:8080' -UseBasicParsing -TimeoutSec 10
    Write-Host "[OK] Demo (8080): HTTP $($r.StatusCode) - $($r.Content.Length) bytes" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Demo (8080): $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $r2 = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 10
    Write-Host "[OK] evalUA (3000): HTTP $($r2.StatusCode) - $($r2.Content.Length) bytes" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] evalUA (3000): $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Docker Container Status ===" -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"