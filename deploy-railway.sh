#!/bin/bash

# MARKETBOT RAILWAY DEPLOYMENT - URGENTE
# Deploy direto sem GitHub

echo "🚀 INICIANDO DEPLOY RAILWAY MARKETBOT..."
echo "⏰ TradingView signals chegando em poucos minutos!"

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado. Instalando..."
    npm install -g @railway/cli
fi

# Login no Railway (se necessário)
echo "🔐 Fazendo login no Railway..."
railway login --browser

# Conectar ao projeto
echo "🔗 Conectando ao projeto..."
railway link coinbitclub-market-bot

# Deploy direto
echo "🚀 Fazendo deploy..."
railway up --detach

echo "✅ DEPLOY INICIADO!"
echo "📡 Webhook URL: https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal?token=210406"
echo "⏰ Sistema estará online em 2-3 minutos para receber TradingView signals!"
