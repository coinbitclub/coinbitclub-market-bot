# Script para testar Railway apos correcoes
Write-Host "Testando Railway apos correcoes..." -ForegroundColor Cyan

$RAILWAY_URL = "https://coinbitclub-market-bot-production.up.railway.app"

# Teste basico
Write-Host "`nTestando endpoint raiz..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $RAILWAY_URL -Method GET -TimeoutSec 30
    Write-Host "SUCESSO na raiz!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 2
} catch {
    Write-Host "Erro na raiz: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Teste health
Write-Host "`nTestando /health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$RAILWAY_URL/health" -Method GET -TimeoutSec 30
    Write-Host "SUCESSO no /health!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 2
} catch {
    Write-Host "Erro no /health: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Teste api/health
Write-Host "`nTestando /api/health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$RAILWAY_URL/api/health" -Method GET -TimeoutSec 30
    Write-Host "SUCESSO no /api/health!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 2
} catch {
    Write-Host "Erro no /api/health: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`nTeste concluido!" -ForegroundColor Cyan
