# PowerShell Script para forçar redeploy no Railway
Write-Host "🚀 FORÇANDO REDEPLOY RAILWAY - SISTEMA MULTIUSUÁRIO HÍBRIDO" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Yellow

# Criar arquivo trigger para forçar rebuild
$triggerContent = "# Railway redeploy trigger - $(Get-Date)"
$triggerContent | Out-File -FilePath ".railway-redeploy-trigger" -Encoding UTF8

Write-Host "📝 Arquivo trigger criado" -ForegroundColor Cyan

# Status do sistema local
Write-Host "🔍 Verificando sistema local..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/status" -TimeoutSec 5
    $status = $response.Content | ConvertFrom-Json
    Write-Host "✅ Sistema local ativo: $($status.service) v$($status.version)" -ForegroundColor Green
    Write-Host "🎯 Multiusuário: $($status.multiuser_system.enabled)" -ForegroundColor Cyan
    Write-Host "🔄 Modo Híbrido: $($status.multiuser_system.hybrid_mode)" -ForegroundColor Cyan
    Write-Host "⚡ Tempo Real: $($status.multiuser_system.realtime_enabled)" -ForegroundColor Cyan
}
catch {
    Write-Host "⚠️ Sistema local não disponível em localhost:3000" -ForegroundColor Yellow
}

Write-Host "`n🚀 Iniciando redeploy..." -ForegroundColor Green

# Comandos git para trigger deploy
git add .
git commit -m "🚀 Force redeploy: Sistema multiusuário híbrido - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git push origin main

Write-Host "`n✅ Deploy disparado! Aguarde alguns minutos para completar." -ForegroundColor Green
Write-Host "🌐 Monitore em: https://railway.app" -ForegroundColor Cyan
Write-Host "📊 URL do serviço: https://coinbitclub-market-bot.up.railway.app" -ForegroundColor Cyan
Write-Host "🔍 Status: https://coinbitclub-market-bot.up.railway.app/api/status" -ForegroundColor Cyan
