# Monitor continuo Railway com detalhes
Write-Host "=== MONITOR RAILWAY POS-PUSH ULTRA-MINIMAL ===" -ForegroundColor Cyan
Write-Host "Push realizado: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
Write-Host "Commit: dedd1a509 - servidor ultra-minimal" -ForegroundColor Green

$url = "https://coinbitclub-market-bot-production.up.railway.app"
$attempts = 0
$maxAttempts = 40  # 20 minutos
$lastError = ""

while ($attempts -lt $maxAttempts) {
    $attempts++
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    Write-Host "`n[$timestamp] Tentativa $attempts/$maxAttempts..." -ForegroundColor Yellow
    
    try {
        # Teste health endpoint
        $response = Invoke-RestMethod -Uri "$url/health" -Method GET -TimeoutSec 15
        
        Write-Host "🎉 SUCESSO! Railway deployou o ultra-minimal!" -ForegroundColor Green
        Write-Host "Response /health:" -ForegroundColor Green
        $response | ConvertTo-Json
        
        # Testar endpoint raiz tambem
        try {
            $rootResponse = Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 10
            Write-Host "`nResponse /:" -ForegroundColor Green  
            $rootResponse | ConvertTo-Json
        } catch {
            Write-Host "`nEndpoint raiz ainda com erro: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        }
        
        # Testar webhook
        Write-Host "`nTestando webhook..." -ForegroundColor Cyan
        $webhookData = @{
            test = "ultra_minimal_success"
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            attempt = $attempts
        } | ConvertTo-Json
        
        try {
            $webhookResponse = Invoke-RestMethod -Uri "$url/webhook/signal1" -Method POST -Body $webhookData -ContentType "application/json" -TimeoutSec 10
            Write-Host "✅ Webhook funcionando!" -ForegroundColor Green
            $webhookResponse | ConvertTo-Json
        } catch {
            Write-Host "⚠️ Webhook erro: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        }
        
        Write-Host "`n🎊 DEPLOY ULTRA-MINIMAL CONCLUIDO COM SUCESSO!" -ForegroundColor Green
        Write-Host "⏰ Tempo: $([math]::Round($attempts * 30 / 60, 1)) minutos" -ForegroundColor Green
        break
        
    } catch {
        $currentError = $_.Exception.Response.StatusCode
        
        if ($currentError -ne $lastError) {
            Write-Host "Status mudou: $lastError -> $currentError" -ForegroundColor Magenta
            $lastError = $currentError
        }
        
        if ($currentError -eq "BadGateway") {
            Write-Host "❌ 502 Bad Gateway - Railway ainda processando..." -ForegroundColor Red
        } else {
            Write-Host "❌ Erro: $currentError" -ForegroundColor Red
        }
        
        # Progresso a cada 5 tentativas
        if ($attempts % 5 -eq 0) {
            $minutes = [math]::Round($attempts * 30 / 60, 1)
            Write-Host "`n📊 PROGRESSO: $attempts tentativas em $minutes minutos" -ForegroundColor Magenta
            Write-Host "💡 Railway pode demorar até 15-20 minutos para deploy completo" -ForegroundColor White
            
            if ($attempts -eq 20) {
                Write-Host "`n⚠️ 10 minutos sem sucesso. Pode ser necessario:" -ForegroundColor Yellow
                Write-Host "1. Verificar logs no painel Railway" -ForegroundColor White
                Write-Host "2. Fazer redeploy manual" -ForegroundColor White
                Write-Host "3. Verificar se app esta crashando no startup" -ForegroundColor White
            }
        }
        
        Start-Sleep -Seconds 30
    }
}

if ($attempts -ge $maxAttempts) {
    Write-Host "`n⚠️ TIMEOUT: 20 minutos sem sucesso" -ForegroundColor Yellow
    Write-Host "🔧 ACOES RECOMENDADAS:" -ForegroundColor Yellow
    Write-Host "1. Acessar painel Railway: https://railway.app" -ForegroundColor White
    Write-Host "2. Verificar logs de build e deploy" -ForegroundColor White
    Write-Host "3. Procurar por erros: 'npm install', 'node server', etc" -ForegroundColor White
    Write-Host "4. Se necessario, fazer redeploy manual" -ForegroundColor White
} 

Write-Host "`n=== MONITORAMENTO CONCLUIDO ===" -ForegroundColor Cyan
