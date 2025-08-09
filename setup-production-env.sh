#!/bin/bash
# 🚀 CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE PARA PRODUÇÃO
# Execute este script para configurar as variáveis nos serviços

echo "🔧 Configurando variáveis de ambiente para produção..."

# === VERCEL FRONTEND ENVIRONMENT VARIABLES ===
echo ""
echo "📱 VERCEL FRONTEND - Copie e cole no painel do Vercel:"
echo "=================================="
echo "NEXTAUTH_URL=https://coinbitclub.vercel.app"
echo "NEXTAUTH_SECRET=prod-nextauth-secret-coinbitclub-2025-ultra-secure-$(date +%s)"
echo "NEXT_PUBLIC_APP_URL=https://coinbitclub.vercel.app"
echo "API_URL=https://coinbitclub-backend.railway.app"
echo "NEXT_PUBLIC_API_URL=https://coinbitclub-backend.railway.app"
echo "NODE_ENV=production"
echo "NEXT_PUBLIC_ENV=production"
echo "NEXT_PUBLIC_ENABLE_ANALYTICS=true"
echo "NEXT_PUBLIC_ENABLE_MONITORING=true"

# === RAILWAY BACKEND ENVIRONMENT VARIABLES ===
echo ""
echo "🖥️ RAILWAY BACKEND - Copie e cole no painel do Railway:"
echo "=================================="
echo "NODE_ENV=production"
echo "JWT_SECRET=prod-jwt-secret-coinbitclub-ultra-secure-$(date +%s)"
echo "CORS_ORIGIN=https://coinbitclub.vercel.app"
echo "RATE_LIMIT_ENABLED=true"
echo "LOG_LEVEL=info"
echo "ZAPI_TOKEN=prod-zapi-token-secure-$(date +%s)"
echo "OPENAI_API_KEY=prod-openai-key-placeholder"

# === COMANDOS PARA DEPLOY ===
echo ""
echo "🚀 COMANDOS PARA DEPLOY:"
echo "=================================="
echo "1. Vercel Deploy:"
echo "   cd coinbitclub-frontend-premium"
echo "   vercel --prod"
echo ""
echo "2. Railway Deploy:"
echo "   railway login"
echo "   railway link"
echo "   railway up"
echo ""
echo "3. Verificar deploys:"
echo "   Frontend: https://coinbitclub.vercel.app"
echo "   Backend:  https://coinbitclub-backend.railway.app/health"

# === TESTES RÁPIDOS ===
echo ""
echo "🧪 TESTES APÓS DEPLOY:"
echo "=================================="
echo "curl https://coinbitclub-backend.railway.app/health"
echo "curl https://coinbitclub-backend.railway.app/api/status"
echo "curl https://coinbitclub.vercel.app"

echo ""
echo "✅ Configuração pronta! Execute os comandos acima para fazer o deploy."
