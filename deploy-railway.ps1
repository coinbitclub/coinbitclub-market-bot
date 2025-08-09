# Script PowerShell para deploy no Railway
Write-Host "🚄 RAILWAY DEPLOY - COINBITCLUB MARKET BOT" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Verificar se Railway CLI está instalado
try {
    $null = railway --version
    Write-Host "✅ Railway CLI já está instalado" -ForegroundColor Green
}
catch {
    Write-Host "📦 Instalando Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Login no Railway
Write-Host "🔐 Fazendo login no Railway..." -ForegroundColor Blue
railway login

# Verificar se já existe projeto
if (-not (Test-Path "railway.json")) {
    Write-Host "🏗️  Inicializando projeto Railway..." -ForegroundColor Yellow
    railway init
}

# Fazer deploy
Write-Host "🚀 Fazendo deploy..." -ForegroundColor Magenta
railway up

# Verificar resultado
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy no Railway realizado com sucesso!" -ForegroundColor Green
    Write-Host "🌐 Abrindo aplicação..." -ForegroundColor Blue
    railway open
}
else {
    Write-Host "❌ Erro no deploy do Railway" -ForegroundColor Red
    Write-Host "📋 Verificando logs..." -ForegroundColor Yellow
    railway logs
    exit 1
}

Write-Host ""
Write-Host "✅ DEPLOY RAILWAY COMPLETO!" -ForegroundColor Green
Write-Host "=========================="
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Configurar variáveis de ambiente no Railway"
Write-Host "2. Configurar banco de dados PostgreSQL"
Write-Host "3. Testar a aplicação"
Write-Host ""
Write-Host "🔗 Comandos úteis:" -ForegroundColor Cyan
Write-Host "- Ver logs: railway logs"
Write-Host "- Abrir app: railway open"
Write-Host "- Ver status: railway status"
Write-Host "- Configurar env: railway variables"
