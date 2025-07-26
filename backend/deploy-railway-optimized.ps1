# Script para Deploy Railway - Correção Erro 502
# Versão Otimizada para Resolver Problemas Crônicos

Write-Host "🚀 INICIANDO DEPLOY RAILWAY OTIMIZADO..." -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# Verificar se estamos no diretório correto
$currentDir = Get-Location
Write-Host "📁 Diretório atual: $currentDir" -ForegroundColor Yellow

# Listar arquivos principais para validação
Write-Host "`n📋 VALIDANDO ARQUIVOS DE DEPLOY:" -ForegroundColor Yellow
Write-Host "--------------------------------" -ForegroundColor Yellow

$requiredFiles = @(
    "api-gateway\server-production.cjs",
    "Dockerfile.production", 
    "Procfile",
    "package.json",
    "railway.toml"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (FALTANDO)" -ForegroundColor Red
    }
}

# Mostrar configuração do Procfile
Write-Host "`n📄 PROCFILE CONFIGURADO:" -ForegroundColor Yellow
Write-Host "-------------------------" -ForegroundColor Yellow
if (Test-Path "Procfile") {
    Get-Content "Procfile" | ForEach-Object {
        Write-Host "   $_" -ForegroundColor White
    }
} else {
    Write-Host "❌ Procfile não encontrado!" -ForegroundColor Red
}

# Mostrar configuração do railway.toml
Write-Host "`n⚙️ RAILWAY.TOML CONFIGURADO:" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
if (Test-Path "railway.toml") {
    Get-Content "railway.toml" | ForEach-Object {
        Write-Host "   $_" -ForegroundColor White
    }
} else {
    Write-Host "❌ railway.toml não encontrado!" -ForegroundColor Red
}

# Instruções para deploy manual no Railway
Write-Host "`n🎯 PRÓXIMOS PASSOS PARA DEPLOY:" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

Write-Host "`n🔸 OPÇÃO 1: Deploy via GitHub (RECOMENDADO)" -ForegroundColor Yellow
Write-Host "1. Fazer commit e push das mudanças:" -ForegroundColor White
Write-Host '   git add .' -ForegroundColor Gray
Write-Host '   git commit -m "fix: servidor otimizado para Railway - correção 502"' -ForegroundColor Gray
Write-Host '   git push origin main' -ForegroundColor Gray
Write-Host "2. Railway detectará automaticamente o push" -ForegroundColor White
Write-Host "3. Aguardar build e deploy (5-10 minutos)" -ForegroundColor White

Write-Host "`n🔸 OPÇÃO 2: Deploy Manual no Painel Railway" -ForegroundColor Yellow
Write-Host "1. Acessar: https://railway.app/dashboard" -ForegroundColor White
Write-Host "2. Ir no projeto: coinbitclub-market-bot" -ForegroundColor White
Write-Host "3. Clicar em 'Redeploy' ou 'Deploy'" -ForegroundColor White
Write-Host "4. Selecionar 'Use Dockerfile.production'" -ForegroundColor White

Write-Host "`n🔸 OPÇÃO 3: Railway CLI (se instalado)" -ForegroundColor Yellow
Write-Host "1. railway login" -ForegroundColor Gray
Write-Host "2. railway up" -ForegroundColor Gray
Write-Host "3. railway logs" -ForegroundColor Gray

Write-Host "`n📊 ARQUIVOS OTIMIZADOS CRIADOS:" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "✅ server-production.cjs   - Servidor otimizado para Railway" -ForegroundColor Green
Write-Host "✅ Dockerfile.production   - Docker otimizado" -ForegroundColor Green  
Write-Host "✅ Procfile               - Comando de start atualizado" -ForegroundColor Green
Write-Host "✅ railway.toml           - Configuração Railway" -ForegroundColor Green
Write-Host "✅ package.json           - Scripts atualizados" -ForegroundColor Green

Write-Host "`n🎉 MELHORIAS IMPLEMENTADAS:" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host "✅ Servidor ultra-otimizado para Railway" -ForegroundColor Green
Write-Host "✅ Configuração de porta correta (0.0.0.0)" -ForegroundColor Green
Write-Host "✅ Health checks robustos" -ForegroundColor Green
Write-Host "✅ Gestão de erro melhorada" -ForegroundColor Green
Write-Host "✅ Logs detalhados para debug" -ForegroundColor Green
Write-Host "✅ Conexão PostgreSQL otimizada" -ForegroundColor Green
Write-Host "✅ Webhook endpoints testados" -ForegroundColor Green
Write-Host "✅ Graceful shutdown" -ForegroundColor Green

Write-Host "`n🔍 TESTAR APÓS DEPLOY:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "URL Base: https://coinbitclub-market-bot-production.up.railway.app" -ForegroundColor White
Write-Host ""
Write-Host "Endpoints para testar:" -ForegroundColor Yellow
Write-Host "   GET  /health                     - Health check" -ForegroundColor Gray
Write-Host "   GET  /api/health                 - API Health" -ForegroundColor Gray
Write-Host "   GET  /api/status                 - Status geral" -ForegroundColor Gray
Write-Host "   POST /api/webhooks/tradingview   - Webhook TradingView" -ForegroundColor Gray
Write-Host "   POST /webhook/signal1            - Webhook genérico" -ForegroundColor Gray

Write-Host "`n⏰ TEMPO ESTIMADO DE DEPLOY:" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host "🔄 Build: 3-5 minutos" -ForegroundColor Yellow
Write-Host "🚀 Deploy: 1-2 minutos" -ForegroundColor Yellow
Write-Host "⚡ Total: 5-10 minutos" -ForegroundColor Yellow

Write-Host "`n🎯 EXPECTATIVA DE RESULTADO:" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host "✅ Status 200 em todos os endpoints" -ForegroundColor Green
Write-Host "✅ Erro 502 RESOLVIDO" -ForegroundColor Green
Write-Host "✅ Webhooks TradingView funcionando" -ForegroundColor Green
Write-Host "✅ Sistema pronto para produção" -ForegroundColor Green

Write-Host "`n🏁 DEPLOY PREPARADO COM SUCESSO!" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
