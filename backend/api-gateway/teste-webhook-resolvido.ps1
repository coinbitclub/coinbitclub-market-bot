# TESTE FINAL: Webhook TradingView com STATUS 200
Write-Host "🎯 TESTANDO WEBHOOK TRADINGVIEW APÓS CORREÇÃO..." -ForegroundColor Green

$url = "https://coinbitclub-market-bot-production.up.railway.app/api/webhooks/tradingview"
$headers = @{
    "Content-Type" = "application/json"
    "User-Agent" = "TradingView-Webhook/1.0"
}

$payload = @{
    symbol = "BTCUSDT"
    action = "BUY"
    price = 50000
    volume = 0.01
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    token = "coinbitclub_webhook_secret_2024"
    signal_id = "SIGNAL_" + (Get-Random -Maximum 99999)
} | ConvertTo-Json -Depth 3

Write-Host "📡 URL: $url" -ForegroundColor Cyan
Write-Host "📋 Payload:" -ForegroundColor Yellow
Write-Host $payload -ForegroundColor White

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $payload -Headers $headers -ErrorAction Stop
    Write-Host "✅ SUCESSO! Status: 200" -ForegroundColor Green
    Write-Host "📄 Resposta: $($response | ConvertTo-Json)" -ForegroundColor White
    
    # Teste endpoint genérico também
    $urlGenerico = "https://coinbitclub-market-bot-production.up.railway.app/webhook/signal1"
    $responseGenerico = Invoke-RestMethod -Uri $urlGenerico -Method POST -Body $payload -Headers $headers -ErrorAction Stop
    Write-Host "✅ Endpoint genérico também funcionando!" -ForegroundColor Green
    Write-Host "📄 Resposta genérica: $($responseGenerico | ConvertTo-Json)" -ForegroundColor White
    
    Write-Host "🎉 WEBHOOK TRADINGVIEW ESTÁ FUNCIONANDO PERFEITAMENTE!" -ForegroundColor Magenta
} catch {
    Write-Host "❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}
