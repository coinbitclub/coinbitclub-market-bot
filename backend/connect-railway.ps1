# Script PowerShell para conectar ao projeto Railway existente
# Execute: .\connect-railway.ps1

Write-Host "🚀 Conectando ao projeto Railway existente: coinbitclub-market-bot" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Yellow

# Verificar se o Railway CLI esta instalado
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI nao encontrado. Instale com: npm install -g @railway/cli" -ForegroundColor Red
    exit 1
}

# Login no Railway (se necessario)
Write-Host "🔐 Fazendo login no Railway..." -ForegroundColor Cyan
railway login

# Conectar ao projeto existente
Write-Host "🔗 Conectando ao projeto coinbitclub-market-bot..." -ForegroundColor Cyan
railway link coinbitclub-market-bot

# Verificar conexao
Write-Host "✅ Verificando conexao..." -ForegroundColor Green
railway status

# Listar variaveis existentes
Write-Host "📋 Variaveis de ambiente atuais:" -ForegroundColor Yellow
railway variables

Write-Host ""
Write-Host "🎯 Proximos passos:" -ForegroundColor Green
Write-Host "1. Verificar se todas as variaveis necessarias estao configuradas"
Write-Host "2. Fazer deploy com: railway up"
Write-Host "3. Verificar logs com: railway logs"
Write-Host ""
Write-Host "📚 Para configurar variaveis adicionais, execute:" -ForegroundColor Cyan
Write-Host "   .\setup-railway-env.ps1"
