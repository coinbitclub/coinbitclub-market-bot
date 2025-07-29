#!/bin/bash

echo "🚀 FORÇANDO REDEPLOY RAILWAY - SISTEMA MULTIUSUÁRIO HÍBRIDO"
echo "================================================="

# Criar um arquivo trigger para forçar rebuild
echo "# Railway redeploy trigger - $(date)" > .railway-redeploy-trigger

# Commit as mudanças
git add .
git commit -m "🚀 Force redeploy: Sistema multiusuário híbrido - $(date)"

# Push para trigger o deploy
git push origin main

echo "✅ Deploy disparado! Aguarde alguns minutos para completar."
echo "🌐 Monitore em: https://railway.app"
echo "📊 URL do serviço: https://coinbitclub-market-bot.up.railway.app"
