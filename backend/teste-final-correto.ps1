# 🚀 TESTE FINAL DO SISTEMA V3
# URL Correta: https://coinbitclub-market-bot.up.railway.app

Write-Host "🔗 TESTANDO SISTEMA NO LINK CORRETO" -ForegroundColor Cyan
Write-Host "URL: https://coinbitclub-market-bot.up.railway.app" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan

$URL = "https://coinbitclub-market-bot.up.railway.app"

# Teste 1: Health Check
Write-Host "`n1️⃣ HEALTH CHECK..." -ForegroundColor Green
try {
    $health = Invoke-RestMethod -Uri "$URL/health" -Method GET -TimeoutSec 15
    Write-Host "✅ SUCESSO: $($health | ConvertTo-Json)" -ForegroundColor Green
    
    if ($health.version -eq "3.0") {
        Write-Host "🎉 SISTEMA V3 CONFIRMADO!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ FALHOU: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 2: Control Panel
Write-Host "`n2️⃣ CONTROL PANEL..." -ForegroundColor Green
try {
    $control = Invoke-WebRequest -Uri "$URL/control" -Method GET -TimeoutSec 15
    Write-Host "✅ PAINEL: Status $($control.StatusCode)" -ForegroundColor Green
    
    if ($control.Content -like "*Sistema V3*" -or $control.Content -like "*Dashboard*") {
        Write-Host "🎉 PAINEL V3 ATIVO!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ PAINEL FALHOU: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 3: API Status
Write-Host "`n3️⃣ API STATUS..." -ForegroundColor Green
try {
    $api = Invoke-RestMethod -Uri "$URL/api/status" -Method GET -TimeoutSec 15
    Write-Host "✅ API: $($api | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ API FALHOU: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 RESULTADO:" -ForegroundColor Magenta
Write-Host "Se todos passaram = Sistema V3 ATIVO! 🚀" -ForegroundColor Green
Write-Host "Acesse: https://coinbitclub-market-bot.up.railway.app/control" -ForegroundColor Cyan
Write-Host "Para ativar o trading real!" -ForegroundColor Yellow

Read-Host "`nPressione Enter para continuar"
