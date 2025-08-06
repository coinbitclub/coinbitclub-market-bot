# Script de monitoramento do deploy Railway - PowerShell
Write-Host "MONITORANDO DEPLOY DO RAILWAY" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

# URLs para verificar
$BACKEND_URL = "https://coinbitclub-market-bot-production.up.railway.app"
$HEALTH_URL = "$BACKEND_URL/health"
$FRONTEND_URL = "https://coinbitclub-market-bot.vercel.app"

# Função para verificar status HTTP
function Check-Url {
    param(
        [string]$Url,
        [string]$Name
    )
    
    Write-Host "Verificando $Name... " -NoNewline -ForegroundColor White
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "OK (200)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "ERRO ($($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    } catch {
        $errorMessage = $_.Exception.Message
        if ($errorMessage -like "*502*") {
            Write-Host "ERRO (502 - Bad Gateway)" -ForegroundColor Red
        } elseif ($errorMessage -like "*404*") {
            Write-Host "ERRO (404 - Not Found)" -ForegroundColor Red
        } elseif ($errorMessage -like "*timeout*") {
            Write-Host "ERRO (Timeout)" -ForegroundColor Red
        } else {
            Write-Host "ERRO (Connection Failed)" -ForegroundColor Red
        }
        return $false
    }
}

# Loop de monitoramento
Write-Host "Iniciando monitoramento em $(Get-Date)" -ForegroundColor Cyan
Write-Host ""

$maxAttempts = 20
$attempt = 1

while ($attempt -le $maxAttempts) {
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host "Tentativa $attempt/$maxAttempts" -ForegroundColor Cyan
    
    # Verificar backend health
    $healthOk = Check-Url -Url $HEALTH_URL -Name "Backend Health"
    
    # Verificar backend root
    $backendOk = Check-Url -Url $BACKEND_URL -Name "Backend Root"
    
    # Verificar frontend
    $frontendOk = Check-Url -Url $FRONTEND_URL -Name "Frontend"
    
    if ($healthOk -and $backendOk -and $frontendOk) {
        Write-Host ""
        Write-Host "TODOS OS SERVICOS ESTAO FUNCIONANDO!" -ForegroundColor Green
        Write-Host "Deploy concluido com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Links funcionais:" -ForegroundColor Cyan
        Write-Host "  Frontend: $FRONTEND_URL" -ForegroundColor White
        Write-Host "  Backend: $BACKEND_URL" -ForegroundColor White
        Write-Host "  Health Check: $HEALTH_URL" -ForegroundColor White
        break
    }
    
    if ($attempt -eq $maxAttempts) {
        Write-Host ""
        Write-Host "Algumas verificacoes ainda falhando apos $maxAttempts tentativas" -ForegroundColor Yellow
        Write-Host "O deploy pode ainda estar em progresso..." -ForegroundColor Yellow
        break
    }
    
    Write-Host ""
    Write-Host "Proxima verificacao em 30 segundos..." -ForegroundColor Yellow
    
    Start-Sleep -Seconds 30
    $attempt++
}

Write-Host ""
Write-Host "Monitoramento finalizado em $(Get-Date)" -ForegroundColor Cyan
