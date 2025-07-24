# Script PowerShell para configurar variaveis de ambiente no Railway
# Execute: .\setup-railway-env.ps1

Write-Host "🚀 Configurando variaveis de ambiente no Railway para CoinBitClub Market Bot" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Yellow

# Verificar se o Railway CLI esta instalado
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI nao encontrado. Instale com: npm install -g @railway/cli" -ForegroundColor Red
    exit 1
}

# Verificar se esta conectado a um projeto
try {
    railway status | Out-Null
} catch {
    Write-Host "❌ Nao conectado a um projeto Railway. Execute: railway link coinbitclub-market-bot" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Variaveis existentes:" -ForegroundColor Cyan
railway variables

Write-Host ""
Write-Host "📝 Configurando/Atualizando variaveis de ambiente essenciais..." -ForegroundColor Yellow

# Configuracoes basicas
Write-Host "🔧 Configurando variaveis basicas..." -ForegroundColor Cyan
railway variables set NODE_ENV=production
railway variables set PORT=8080
railway variables set LOG_LEVEL=info

# Rate Limiting
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=100

# Trading Configuration
railway variables set DEFAULT_LEVERAGE=10
railway variables set DEFAULT_RISK_PERCENTAGE=2
railway variables set MAX_CONCURRENT_TRADES=5

# CORS Configuration
railway variables set CORS_ORIGIN=https://coinbitclub-market-bot.vercel.app
railway variables set CORS_CREDENTIALS=true

# Health Check
railway variables set HEALTH_CHECK_PATH=/health
railway variables set METRICS_PATH=/metrics

Write-Host ""
Write-Host "🔐 Configure as seguintes variaveis de seguranca manualmente no Railway Dashboard:" -ForegroundColor Yellow
Write-Host "   JWT_SECRET=<sua-jwt-secret-aqui>"
Write-Host "   SESSION_SECRET=<sua-session-secret-aqui>"
Write-Host "   WEBHOOK_SECRET=<sua-webhook-secret-aqui>"

Write-Host ""
Write-Host "📊 Configure as seguintes variaveis de API Trading:" -ForegroundColor Yellow
Write-Host "   BINANCE_API_KEY=<sua-binance-api-key>"
Write-Host "   BINANCE_SECRET_KEY=<sua-binance-secret-key>"
Write-Host "   BYBIT_API_KEY=<sua-bybit-api-key>"
Write-Host "   BYBIT_SECRET=<sua-bybit-secret>"

Write-Host ""
Write-Host "🤖 Configure a variavel de AI:" -ForegroundColor Yellow
Write-Host "   OPENAI_API_KEY=<sua-openai-api-key>"

Write-Host ""
Write-Host "📧 Configure as variaveis de Email:" -ForegroundColor Yellow
Write-Host "   SMTP_HOST=<seu-smtp-host>"
Write-Host "   SMTP_PORT=587"
Write-Host "   SMTP_USER=<seu-smtp-user>"
Write-Host "   SMTP_PASS=<sua-smtp-password>"

Write-Host ""
Write-Host "💳 Configure as variaveis de Payment:" -ForegroundColor Yellow
Write-Host "   STRIPE_SECRET_KEY=<sua-stripe-secret-key>"
Write-Host "   STRIPE_PUBLISHABLE_KEY=<sua-stripe-publishable-key>"

Write-Host ""
Write-Host "✅ Variaveis basicas configuradas!" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Proximos passos:" -ForegroundColor Cyan
Write-Host "1. Configure o PostgreSQL addon no Railway (se ainda nao estiver)"
Write-Host "2. Configure o Redis addon no Railway (se necessario)"
Write-Host "3. Configure as variaveis de seguranca listadas acima"
Write-Host "4. Execute: railway up"
Write-Host ""
Write-Host "📖 Para mais informacoes, consulte o RAILWAY-DEPLOY.md" -ForegroundColor Yellow
