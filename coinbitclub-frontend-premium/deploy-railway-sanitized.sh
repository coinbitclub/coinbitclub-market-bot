#!/bin/bash

# Script para Deploy Railway - API Gateway (VERSÃO SANITIZADA)
echo "🚂 CONFIGURANDO RAILWAY API GATEWAY"
echo "=================================="

# ⚠️ ATENÇÃO: Este é um script sanitizado para commit público
# As chaves reais devem ser configuradas manualmente no Railway dashboard

# Criar diretório temporário para o backend
mkdir -p railway-backend
cd railway-backend

# Copiar arquivos necessários
cp ../api-gateway-server.js server.js
cp ../package-railway.json package.json

# Criar arquivo .env MODELO (SEM CHAVES REAIS)
cat > .env.example << EOF
NODE_ENV=production
PORT=8080

# Frontend URL for CORS
FRONTEND_URL=https://coinbitclub-market-bot.vercel.app

# Database Configuration (CONFIGURE NO RAILWAY DASHBOARD)
DATABASE_URL=postgresql://postgres:password@host:5432/railway

# JWT Configuration (CONFIGURE NO RAILWAY DASHBOARD)
JWT_SECRET=seu-jwt-secret-aqui
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=seu-refresh-secret-aqui

# Stripe Configuration (CONFIGURE NO RAILWAY DASHBOARD)
STRIPE_SECRET_KEY=sk_live_seu_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_seu_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret

# Stripe URLs
STRIPE_SUCCESS_URL=https://coinbitclub-market-bot.vercel.app/sucesso?session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=https://coinbitclub-market-bot.vercel.app/cancelado

# External APIs (CONFIGURE NO RAILWAY DASHBOARD)
OPENAI_API_KEY=sk_seu_openai_key
COINSTATS_API_KEY=seu_coinstats_key

# Twilio API (CONFIGURE NO RAILWAY DASHBOARD)
TWILIO_ACCOUNT_SID=seu_twilio_account_sid
TWILIO_AUTH_TOKEN=seu_twilio_auth_token
TWILIO_PHONE_NUMBER=seu_twilio_phone_number
TWILIO_VERIFY_SERVICE_SID=seu_twilio_verify_service_sid
TWILIO_TEST_MODE=false

# Security (CONFIGURE NO RAILWAY DASHBOARD)
SYSTEM_API_KEY=seu-system-key
ENCRYPTION_KEY=seu-encryption-key-32chars
TRADINGVIEW_WEBHOOK_SECRET=seu-tradingview-secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# CORS Origins
ALLOWED_ORIGINS=https://coinbitclub-market-bot.vercel.app,https://coinbitclub-market-bot.up.railway.app
EOF

echo "✅ Arquivos preparados para Railway!"
echo "📁 Diretório: railway-backend/"
echo "📄 Arquivos:"
echo "   - server.js (API Gateway completo)"
echo "   - package.json (dependências)"
echo "   - .env.example (modelo de variáveis)"
echo ""
echo "⚠️  IMPORTANTE: Configure as variáveis reais no Railway dashboard!"
echo ""
echo "📤 Próximos passos:"
echo "1. Acesse: https://railway.app/dashboard"
echo "2. Projeto: coinbitclub-market-bot-v3"
echo "3. Configure as variáveis de ambiente manualmente"
echo "4. Deploy files da pasta railway-backend/"
echo ""
echo "🔧 Start Command: node server.js"
echo ""
echo "🔒 SEGURANÇA:"
echo "   - Chaves reais removidas do Git"
echo "   - Configure manualmente no dashboard"
echo "   - Use o arquivo .env.example como referência"
