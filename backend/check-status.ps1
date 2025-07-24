# Script PowerShell para verificar status do projeto Railway
# Execute: .\check-railway-status.ps1

Write-Host "Verificando Status do Projeto CoinBitClub Market Bot no Railway" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Yellow

# Verificar se o Railway CLI esta instalado
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "Railway CLI nao encontrado. Instale com: npm install -g @railway/cli" -ForegroundColor Red
    exit 1
}

# Verificar status do projeto
Write-Host "Status do Projeto:" -ForegroundColor Cyan
railway status

Write-Host ""
Write-Host "Servicos Disponiveis:" -ForegroundColor Cyan
railway services

Write-Host ""
Write-Host "Variaveis de Ambiente:" -ForegroundColor Cyan
railway variables

Write-Host ""
Write-Host "Deployments Recentes:" -ForegroundColor Cyan
railway deployments

Write-Host ""
Write-Host "Uso de Recursos:" -ForegroundColor Cyan
railway usage

Write-Host ""
Write-Host "URLs do Projeto:" -ForegroundColor Cyan
railway domain

Write-Host ""
Write-Host "Banco de Dados:" -ForegroundColor Yellow
$variables = railway variables 2>$null
if ($variables -match "DATABASE_URL") {
    Write-Host "PostgreSQL configurado" -ForegroundColor Green
    Write-Host "DATABASE_URL esta definida" -ForegroundColor Green
} else {
    Write-Host "PostgreSQL nao configurado" -ForegroundColor Red
    Write-Host "Execute: railway add postgresql" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Variaveis Criticas:" -ForegroundColor Yellow
$criticalVars = @("JWT_SECRET", "OPENAI_API_KEY", "BINANCE_API_KEY", "BYBIT_API_KEY")

foreach ($var in $criticalVars) {
    if ($variables -match $var) {
        Write-Host "$var - Configurada" -ForegroundColor Green
    } else {
        Write-Host "$var - Nao configurada" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Comandos Uteis:" -ForegroundColor Yellow
Write-Host "   railway logs           - Ver logs"
Write-Host "   railway up             - Deploy"
Write-Host "   railway shell          - Conectar via shell"
Write-Host "   railway restart        - Reiniciar servico"
