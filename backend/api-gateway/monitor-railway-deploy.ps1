# Monitoramento continuo do Railway apos push GitHub
Write-Host "Monitorando Railway apos push GitHub..." -ForegroundColor Cyan
Write-Host "Push realizado com sucesso em: $(Get-Date)" -ForegroundColor Green
Write-Host "Aguardando Railway fazer redeploy automatico..." -ForegroundColor Yellow

$RAILWAY_URL = "https://coinbitclub-market-bot-production.up.railway.app"
$maxAttempts = 60  # 10 minutos
$attempt = 0
$deployDetected = $false

while ($attempt -lt $maxAttempts) {
    $attempt++
    $currentTime = Get-Date -Format "HH:mm:ss"
    Write-Host "`n[$currentTime] Tentativa $attempt/$maxAttempts..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "$RAILWAY_URL/health" -Method GET -TimeoutSec 10
        Write-Host "🎉 SUCESSO! Railway deployou as correcoes!" -ForegroundColor Green
        Write-Host "Response:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 2
        
        # Testar outros endpoints
        Write-Host "`nTestando outros endpoints..." -ForegroundColor Cyan
        
        try {
            $rootResponse = Invoke-RestMethod -Uri $RAILWAY_URL -Method GET -TimeoutSec 10
            Write-Host "✅ Endpoint raiz OK" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Endpoint raiz ainda com problema" -ForegroundColor Yellow
        }
        
        try {
            $apiHealthResponse = Invoke-RestMethod -Uri "$RAILWAY_URL/api/health" -Method GET -TimeoutSec 10
            Write-Host "✅ /api/health OK" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ /api/health ainda com problema" -ForegroundColor Yellow
        }
        
        # Testar webhook
        Write-Host "`nTestando webhook..." -ForegroundColor Cyan
        $webhookData = @{
            test = "railway_deploy_success"
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            deploy_attempt = $attempt
        } | ConvertTo-Json
        
        try {
            $webhookResponse = Invoke-RestMethod -Uri "$RAILWAY_URL/webhook/signal1" -Method POST -Body $webhookData -ContentType "application/json" -TimeoutSec 10
            Write-Host "✅ Webhook funcionando!" -ForegroundColor Green
            $webhookResponse | ConvertTo-Json -Depth 2
        } catch {
            Write-Host "⚠️ Webhook ainda com problema: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        }
        
        $deployDetected = $true
        break
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode
        if ($statusCode -eq "BadGateway") {
            Write-Host "❌ Ainda 502 - Railway processando deploy..." -ForegroundColor Red
        } else {
            Write-Host "❌ Erro diferente: $statusCode" -ForegroundColor Red
        }
        
        # A cada 10 tentativas, mostrar progresso
        if ($attempt % 10 -eq 0) {
            Write-Host "`n📊 PROGRESSO: $attempt tentativas em $([math]::Round($attempt * 10 / 60, 1)) minutos" -ForegroundColor Yellow
            Write-Host "💡 Railway pode demorar até 10 minutos para deploy completo" -ForegroundColor White
        }
        
        Start-Sleep -Seconds 10
    }
}

if ($deployDetected) {
    Write-Host "`n🎊 DEPLOY CONCLUIDO COM SUCESSO!" -ForegroundColor Green
    Write-Host "⏰ Tempo total: $([math]::Round($attempt * 10 / 60, 1)) minutos" -ForegroundColor Green
    Write-Host "🔗 URL: $RAILWAY_URL" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Deploy ainda nao detectado apos 10 minutos" -ForegroundColor Yellow
    Write-Host "💡 Verifique o painel Railway para logs de deploy" -ForegroundColor White
    Write-Host "🔗 https://railway.app" -ForegroundColor White
}

Write-Host "`n✅ Monitoramento concluido!" -ForegroundColor Cyan
