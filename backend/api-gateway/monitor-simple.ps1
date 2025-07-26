# Monitor simples Railway
Write-Host "Monitorando Railway apos push..." -ForegroundColor Cyan

$url = "https://coinbitclub-market-bot-production.up.railway.app"
$attempts = 0
$maxAttempts = 30

while ($attempts -lt $maxAttempts) {
    $attempts++
    Write-Host "Tentativa $attempts..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$url/health" -Method GET -TimeoutSec 15
        Write-Host "SUCESSO! Railway funcionando!" -ForegroundColor Green
        $response | ConvertTo-Json
        
        # Testar webhook
        Write-Host "Testando webhook..." -ForegroundColor Cyan
        $webhookData = '{"test": "success"}' 
        $webhookResponse = Invoke-RestMethod -Uri "$url/webhook/signal1" -Method POST -Body $webhookData -ContentType "application/json"
        Write-Host "Webhook OK!" -ForegroundColor Green
        $webhookResponse | ConvertTo-Json
        
        break
    } catch {
        Write-Host "Erro: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Start-Sleep -Seconds 20
    }
}

Write-Host "Monitoramento concluido!" -ForegroundColor Cyan
