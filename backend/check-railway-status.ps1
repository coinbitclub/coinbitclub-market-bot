# Script PowerShell para verificar status do projeto RailwaWrite-Host ""
Write-Host "📚 Comandos Úteis:" -ForegroundColor Yellow
Write-Host "   railway logs           - Ver logs"
Write-Host "   railway up             - Deploy"
Write-Host "   railway shell          - Conectar via shell"
Write-Host "   railway restart        - Reiniciar servico"xecute: .\check-railway-status.ps1

Write-Host "🔍 Verificando Status do Projeto CoinBitClub Market Bot no Railway" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Yellow

# Verificar se o Railway CLI está instalado
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI não encontrado. Instale com: npm install -g @railway/cli" -ForegroundColor Red
    exit 1
}

# Verificar status do projeto
Write-Host "📊 Status do Projeto:" -ForegroundColor Cyan
railway status

Write-Host ""
Write-Host "🏗️ Serviços Disponíveis:" -ForegroundColor Cyan
railway services

Write-Host ""
Write-Host "📋 Variáveis de Ambiente:" -ForegroundColor Cyan
railway variables

Write-Host ""
Write-Host "🔗 Deployments Recentes:" -ForegroundColor Cyan
railway deployments

Write-Host ""
Write-Host "📈 Uso de Recursos:" -ForegroundColor Cyan
railway usage

Write-Host ""
Write-Host "🌐 URLs do Projeto:" -ForegroundColor Cyan
railway domain

Write-Host ""
Write-Host "💾 Banco de Dados:" -ForegroundColor Yellow
$variables = railway variables 2>$null
if ($variables -match "DATABASE_URL") {
    Write-Host "✅ PostgreSQL configurado" -ForegroundColor Green
    Write-Host "🔗 DATABASE_URL está definida" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL não configurado" -ForegroundColor Red
    Write-Host "💡 Execute: railway add postgresql" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔐 Variáveis Críticas:" -ForegroundColor Yellow
$criticalVars = @("JWT_SECRET", "OPENAI_API_KEY", "BINANCE_API_KEY", "BYBIT_API_KEY")

foreach ($var in $criticalVars) {
    if ($variables -match $var) {
        Write-Host "✅ $var - Configurada" -ForegroundColor Green
    } else {
        Write-Host "❌ $var - Não configurada" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📚 Comandos Úteis:" -ForegroundColor Yellow
Write-Host "   railway logs           - Ver logs"
Write-Host "   railway up             - Deploy"
Write-Host "   railway shell          - Conectar via shell"
Write-Host "   railway restart        - Reiniciar serviço"
