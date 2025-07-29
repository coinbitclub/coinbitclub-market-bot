# SCRIPT DE TESTE DIRETO
Write-Host "🚀 TESTANDO SISTEMA V3 NO RAILWAY..." -ForegroundColor Green

$URL = "https://coinbitclub-market-bot.up.railway.app"
Write-Host "📡 URL Base: $URL" -ForegroundColor Yellow

# Teste 1: Health Check
Write-Host "`n1️⃣ TESTANDO HEALTH CHECK..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-RestMethod -Uri "$URL/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Health Check: $($healthResponse | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check falhou: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 2: Control Panel
Write-Host "`n2️⃣ TESTANDO CONTROL PANEL..." -ForegroundColor Cyan
try {
    $controlResponse = Invoke-WebRequest -Uri "$URL/control" -Method GET -TimeoutSec 10
    if ($controlResponse.StatusCode -eq 200) {
        Write-Host "✅ Control Panel: Status 200 OK" -ForegroundColor Green
        if ($controlResponse.Content -like "*Sistema V3*" -or $controlResponse.Content -like "*Dashboard*") {
            Write-Host "✅ SISTEMA V3 DETECTADO!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Sistema antigo pode estar ativo" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Control Panel falhou: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 3: API Status
Write-Host "`n3️⃣ TESTANDO API STATUS..." -ForegroundColor Cyan
try {
    $apiResponse = Invoke-RestMethod -Uri "$URL/api/status" -Method GET -TimeoutSec 10
    Write-Host "✅ API Status: $($apiResponse | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ API Status falhou: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 RESULTADO FINAL:" -ForegroundColor Magenta
Write-Host "Se todos os testes passaram = Sistema V3 ativo! ✅" -ForegroundColor Green
Write-Host "Se algum falhou = Verificar configurações ⚠️" -ForegroundColor Yellow
Write-Host "`nPróximo passo: Acessar $URL/control para ativar trading" -ForegroundColor Cyan

Read-Host "`nPressione Enter para finalizar"
