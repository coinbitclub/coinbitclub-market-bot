# Teste completo Railway - Pos correcao
# Executa testes apos as correcoes aplicadas

$RAILWAY_URL = "https://coinbitclub-market-bot-production.up.railway.app"

Write-Host "=== TESTE RAILWAY POS-CORRECAO ===" -ForegroundColor Cyan
Write-Host "Aguardando 60 segundos para Railway atualizar..." -ForegroundColor Yellow

# Aguardar deploy
Start-Sleep -Seconds 60

Write-Host "`nTESTE 1: Endpoint Health" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$RAILWAY_URL/health" -Method GET -TimeoutSec 15
    Write-Host "SUCCESS: /health funcionando!" -ForegroundColor Green
    $health | ConvertTo-Json
} catch {
    Write-Host "FAIL: /health com erro" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`nTESTE 2: Endpoint API Health" -ForegroundColor Yellow
try {
    $apiHealth = Invoke-RestMethod -Uri "$RAILWAY_URL/api/health" -Method GET -TimeoutSec 15
    Write-Host "SUCCESS: /api/health funcionando!" -ForegroundColor Green
    $apiHealth | ConvertTo-Json
} catch {
    Write-Host "FAIL: /api/health com erro" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`nTESTE 3: Endpoint Root" -ForegroundColor Yellow
try {
    $root = Invoke-RestMethod -Uri "$RAILWAY_URL/" -Method GET -TimeoutSec 15
    Write-Host "SUCCESS: / funcionando!" -ForegroundColor Green
    $root | ConvertTo-Json
} catch {
    Write-Host "FAIL: / com erro" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`nTESTE 4: Webhook TradingView" -ForegroundColor Yellow
$webhookData = @{
    token = "coinbitclub_webhook_secret_2024"
    strategy = "Railway_Test_Post_Fix"
    symbol = "BTCUSDT"
    action = "BUY"
    price = 68000.00
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    test_mode = $true
} | ConvertTo-Json -Depth 3

try {
    $webhookResponse = Invoke-RestMethod -Uri "$RAILWAY_URL/api/webhooks/tradingview" -Method POST -Body $webhookData -ContentType "application/json" -TimeoutSec 15
    Write-Host "SUCCESS: Webhook funcionando!" -ForegroundColor Green
    $webhookResponse | ConvertTo-Json
} catch {
    Write-Host "FAIL: Webhook com erro" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`n=== RESULTADO FINAL ===" -ForegroundColor Cyan
if ($health -and $apiHealth -and $root) {
    Write-Host "Railway esta funcionando corretamente!" -ForegroundColor Green
    Write-Host "Problema 502 resolvido!" -ForegroundColor Green
} else {
    Write-Host "Ainda ha problemas no Railway" -ForegroundColor Red
    Write-Host "Verificar logs: railway logs" -ForegroundColor Yellow
}
