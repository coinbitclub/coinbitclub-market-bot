#!/bin/bash

# Script para Deploy Railway - API Gateway
echo "🚂 CONFIGURANDO RAILWAY API GATEWAY"
echo "=================================="

# Criar diretório temporário para o backend
mkdir -p railway-backend
cd railway-backend

# Copiar arquivos necessários
cp ../api-gateway-server.js server.js
cp ../package-railway.json package.json

# Criar arquivo .env com as variáveis corretas
cat > .env << EOF
NODE_ENV=production
PORT=8080

# Frontend URL for CORS
FRONTEND_URL=https://coinbitclub-market-bot.vercel.app

# Database Configuration
DATABASE_URL=postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway

# JWT Configuration
JWT_SECRET=coinbitclub-super-secure-jwt-secret-2025
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=coinbitclub-refresh-secret-2025

# Stripe Configuration (Production)
STRIPE_SECRET_KEY=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
STRIPE_PUBLISHABLE_KEY=pk_live_51QCOIiBbdaDz4TVOX8Vh9KlFguewjyA2B2FNSSx5i5bUtzcei1aD399iUTyIk6PGQ3N8EW2lCO2lNRd1dWPp2E2X00ydaBMVUI
STRIPE_WEBHOOK_SECRET=whsec_cJ97DwC5rzz84PqCSbmTJfyQxykcrStU

# Stripe URLs
STRIPE_SUCCESS_URL=https://coinbitclub-market-bot.vercel.app/sucesso?session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=https://coinbitclub-market-bot.vercel.app/cancelado

# External APIs
OPENAI_API_KEY=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
COINSTATS_API_KEY=ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=

# Twilio API
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
TWILIO_VERIFY_SERVICE_SID=your-twilio-verify-service-sid
TWILIO_TEST_MODE=false

# Security
SYSTEM_API_KEY=coinbitclub-system-key-2025
ENCRYPTION_KEY=coinbitclub-encryption-key-32chars
TRADINGVIEW_WEBHOOK_SECRET=coinbitclub-tradingview-secret

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
echo "   - .env (variáveis de ambiente)"
echo ""
echo "📤 Próximos passos:"
echo "1. Acesse: https://railway.app/dashboard"
echo "2. Projeto: coinbitclub-market-bot"
echo "3. Deploy files da pasta railway-backend/"
echo "4. Configure as variáveis do .env"
echo ""
echo "🔧 Start Command: node server.js"
