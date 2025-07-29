Write-Host "🎯 VALIDAÇÃO FINAL - SISTEMA MULTIUSUÁRIO HÍBRIDO" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Yellow

# Verificar sistema local
Write-Host "`n📍 VERIFICANDO SISTEMA LOCAL" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/status" -TimeoutSec 5
    $status = $response.Content | ConvertFrom-Json
    Write-Host "✅ Sistema local ativo: $($status.service)" -ForegroundColor Green
    Write-Host "   📦 Versão: $($status.version)" -ForegroundColor White
    Write-Host "   🎯 Multiusuário: $($status.multiuser_system.enabled)" -ForegroundColor White
    Write-Host "   🔄 Modo Híbrido: $($status.multiuser_system.hybrid_mode)" -ForegroundColor White
    Write-Host "   ⚡ Tempo Real: $($status.multiuser_system.realtime_enabled)" -ForegroundColor White
}
catch {
    Write-Host "❌ Sistema local não disponível" -ForegroundColor Red
}

# Verificar Railway
Write-Host "`n📍 VERIFICANDO RAILWAY" -ForegroundColor Cyan
try {
    $prodResponse = Invoke-WebRequest -Uri "https://coinbitclub-market-bot.up.railway.app/api/status" -TimeoutSec 10
    $prodStatus = $prodResponse.Content | ConvertFrom-Json
    Write-Host "✅ Railway ativo: $($prodStatus.service)" -ForegroundColor Green
    Write-Host "   📦 Versão: $($prodStatus.version)" -ForegroundColor White
    Write-Host "   🎯 Multiusuário: $($prodStatus.multiuser_system.enabled)" -ForegroundColor White
}
catch {
    Write-Host "⚠️ Railway ainda em deploy ou indisponível" -ForegroundColor Yellow
}

Write-Host "`n🎉 SISTEMA MULTIUSUÁRIO HÍBRIDO ATIVADO!" -ForegroundColor Green
