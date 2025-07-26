# Script simplificado para verificar Railway
Write-Host "Verificando deploy Railway..." -ForegroundColor Cyan

$RAILWAY_URL = "https://coinbitclub-market-bot-production.up.railway.app"

# Teste 1: Endpoint raiz
Write-Host "`nTestando endpoint raiz..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $RAILWAY_URL -Method GET -TimeoutSec 30 -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))" -ForegroundColor Gray
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Teste 2: Health endpoint
Write-Host "`nTestando /health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$RAILWAY_URL/health" -Method GET -TimeoutSec 30 -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Teste 3: API Health endpoint
Write-Host "`nTestando /api/health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$RAILWAY_URL/api/health" -Method GET -TimeoutSec 30 -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`nVerificacao concluida." -ForegroundColor Cyan
