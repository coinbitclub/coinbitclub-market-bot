# Verificar se Railway deployou as mudancas
Write-Host "Verificando deploy no Railway..." -ForegroundColor Cyan

$RAILWAY_URL = "https://coinbitclub-market-bot-production.up.railway.app"

# Loop de verificacao por 5 minutos
$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "`nTentativa $attempt de $maxAttempts..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$RAILWAY_URL/health" -Method GET -TimeoutSec 10
        Write-Host "SUCESSO! Railway esta funcionando!" -ForegroundColor Green
        Write-Host "Response:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 2
        
        # Testar webhook tambem
        Write-Host "`nTestando webhook..." -ForegroundColor Cyan
        $webhookData = @{
            test = "true"
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        } | ConvertTo-Json
        
        try {
            $webhookResponse = Invoke-RestMethod -Uri "$RAILWAY_URL/webhook/signal1" -Method POST -Body $webhookData -ContentType "application/json"
            Write-Host "Webhook funcionando!" -ForegroundColor Green
            $webhookResponse | ConvertTo-Json -Depth 2
        } catch {
            Write-Host "Webhook ainda com erro: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
        
        break
    } catch {
        Write-Host "Ainda com erro 502, aguardando..." -ForegroundColor Red
        Start-Sleep -Seconds 10
    }
}

if ($attempt -ge $maxAttempts) {
    Write-Host "Railway ainda nao deployou apos 5 minutos. Verificar painel Railway." -ForegroundColor Red
} else {
    Write-Host "Railway funcionando apos $attempt tentativas!" -ForegroundColor Green
}
