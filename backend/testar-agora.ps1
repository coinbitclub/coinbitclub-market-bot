Write-Host "TESTANDO SISTEMA V3 NO RAILWAY" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

$url = "https://coinbitclub-market-bot.up.railway.app"

Write-Host "Testando health check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$url/health" -Method GET -TimeoutSec 15
    Write-Host "SUCESSO: $($health | ConvertTo-Json)" -ForegroundColor Green
    
    if ($health.version -like "*3*" -and $health.service -notlike "*multiservice*") {
        Write-Host "SISTEMA V3 CONFIRMADO!" -ForegroundColor Green
    } else {
        Write-Host "AINDA E SISTEMA ANTIGO" -ForegroundColor Red
    }
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTestando painel de controle..." -ForegroundColor Yellow
try {
    $control = Invoke-WebRequest -Uri "$url/control" -Method GET -TimeoutSec 15
    Write-Host "Painel Status: $($control.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Painel ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nPara acessar o painel:" -ForegroundColor Cyan
Write-Host "$url/control" -ForegroundColor Yellow
