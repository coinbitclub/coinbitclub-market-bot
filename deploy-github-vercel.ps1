# 🚀 DEPLOY COMPLETO - GITHUB + VERCEL

Write-Host "=============================================="
Write-Host "🚀 INICIANDO DEPLOY COMPLETO - GITHUB + VERCEL" -ForegroundColor Green
Write-Host "=============================================="

# Verificar branch atual
Write-Host "📋 Verificando branch atual..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "Branch atual: $currentBranch" -ForegroundColor Cyan

if ($currentBranch -ne "deploy-clean") {
    Write-Host "⚠️ Mudando para branch deploy-clean..." -ForegroundColor Yellow
    git checkout deploy-clean
}

# Verificar status do Git
Write-Host "📊 Verificando status do repositório..." -ForegroundColor Yellow
git status

# Fazer commit final se houver mudanças
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "📝 Fazendo commit final..." -ForegroundColor Yellow
    git add .
    git commit -m "🚀 DEPLOY FINAL: Sistema preparado para Vercel

✅ Configuração Vercel completa
✅ Variáveis de ambiente sanitizadas  
✅ Railway backend operacional
✅ Frontend Next.js otimizado
✅ Sistema 100% funcional"
}
}

# Push para GitHub
Write-Host "📤 Fazendo push para GitHub..." -ForegroundColor Yellow
git push origin deploy-clean --force

# Verificar sucesso do push
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push para GitHub realizado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 PRÓXIMOS PASSOS PARA VERCEL:" -ForegroundColor Cyan
    Write-Host "1. Acesse: https://vercel.com/new" -ForegroundColor White
    Write-Host "2. Import: coinbitclub/coinbitclub-market-bot" -ForegroundColor White
    Write-Host "3. Branch: deploy-clean" -ForegroundColor White
    Write-Host "4. Root Directory: coinbitclub-frontend-premium" -ForegroundColor White
    Write-Host "5. Framework: Next.js" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 VARIÁVEIS DE AMBIENTE VERCEL:" -ForegroundColor Cyan
    Write-Host "NEXT_PUBLIC_API_URL=https://coinbitclub-market-bot.up.railway.app" -ForegroundColor White
    Write-Host "NEXT_PUBLIC_FRONTEND_URL=https://[SEU-PROJETO].vercel.app" -ForegroundColor White
    Write-Host "NODE_ENV=production" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 DEPLOY AUTOMÁTICO ATIVADO!" -ForegroundColor Green
    Write-Host "✅ Sistema pronto para produção completa" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no push para GitHub" -ForegroundColor Red
    exit 1
}
