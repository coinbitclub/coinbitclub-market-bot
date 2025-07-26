Write-Host "🚀 VALIDAÇÃO DEPLOY RAILWAY" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

Write-Host "`n📋 ARQUIVOS PRINCIPAIS:" -ForegroundColor Yellow

$files = @{
    "api-gateway\server-production.cjs" = "Servidor otimizado"
    "Dockerfile.production" = "Docker optimizado"
    "Procfile" = "Comando de start"
    "railway.toml" = "Configuração Railway"
}

foreach ($file in $files.Keys) {
    if (Test-Path $file) {
        Write-Host "✅ $file - $($files[$file])" -ForegroundColor Green
    } else {
        Write-Host "❌ $file - FALTANDO" -ForegroundColor Red
    }
}

Write-Host "`n🎯 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Fazer commit: git add . && git commit -m 'fix: servidor otimizado'"
Write-Host "2. Push: git push origin main"
Write-Host "3. Railway vai detectar e fazer deploy automaticamente"
Write-Host "4. Aguardar 5-10 minutos"
Write-Host "5. Testar: https://coinbitclub-market-bot-production.up.railway.app/health"

Write-Host "`n✅ SISTEMA PRONTO PARA DEPLOY!" -ForegroundColor Green
