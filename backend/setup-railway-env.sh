#!/bin/bash

# Script para configurar variáveis de ambiente no Railway
# Execute: chmod +x setup-railway-env.sh && ./setup-railway-env.sh

echo "🚀 Configurando variáveis de ambiente no Railway para CoinBitClub Market Bot"
echo "=================================================="

# Verificar se o Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado. Instale com: npm install -g @railway/cli"
    exit 1
fi

echo "📝 Configurando variáveis de ambiente essenciais..."

# Configurações básicas
railway variables set NODE_ENV=production
railway variables set PORT=8080
railway variables set LOG_LEVEL=info

# Configurações de segurança
echo "🔐 Configure as seguintes variáveis de segurança manualmente no Railway Dashboard:"
echo "   JWT_SECRET=<sua-jwt-secret-aqui>"
echo "   SESSION_SECRET=<sua-session-secret-aqui>"
echo "   WEBHOOK_SECRET=<sua-webhook-secret-aqui>"

# Configurações de API Trading
echo "📊 Configure as seguintes variáveis de API Trading:"
echo "   BINANCE_API_KEY=<sua-binance-api-key>"
echo "   BINANCE_SECRET_KEY=<sua-binance-secret-key>"
echo "   BYBIT_API_KEY=<sua-bybit-api-key>"
echo "   BYBIT_SECRET=<sua-bybit-secret>"

# Configurações de AI
echo "🤖 Configure a variável de AI:"
echo "   OPENAI_API_KEY=<sua-openai-api-key>"

# Configurações de Email
echo "📧 Configure as variáveis de Email:"
echo "   SMTP_HOST=<seu-smtp-host>"
echo "   SMTP_PORT=587"
echo "   SMTP_USER=<seu-smtp-user>"
echo "   SMTP_PASS=<sua-smtp-password>"

# Configurações de Payment
echo "💳 Configure as variáveis de Payment:"
echo "   STRIPE_SECRET_KEY=<sua-stripe-secret-key>"
echo "   STRIPE_PUBLISHABLE_KEY=<sua-stripe-publishable-key>"

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

echo "✅ Variáveis básicas configuradas!"
echo ""
echo "🔧 Próximos passos:"
echo "1. Configure o PostgreSQL addon no Railway"
echo "2. Configure o Redis addon no Railway"
echo "3. Configure as variáveis de segurança listadas acima"
echo "4. Execute: railway up"
echo ""
echo "📖 Para mais informações, consulte o README.md"
