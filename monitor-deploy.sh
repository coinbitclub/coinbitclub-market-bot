#!/bin/bash

# Script de monitoramento do deploy Railway
echo "🔍 MONITORANDO DEPLOY DO RAILWAY"
echo "================================"

# URLs para verificar
BACKEND_URL="https://coinbitclub-market-bot-production.up.railway.app"
HEALTH_URL="$BACKEND_URL/health"
FRONTEND_URL="https://coinbitclub-market-bot.vercel.app"

# Função para verificar status HTTP
check_url() {
    local url=$1
    local name=$2
    echo -n "Verificando $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "200" ]; then
        echo "✅ OK (200)"
        return 0
    else
        echo "❌ ERRO ($response)"
        return 1
    fi
}

# Loop de monitoramento
echo "Iniciando monitoramento em $(date)"
echo ""

while true; do
    echo "----------------------------------------"
    echo "🕒 $(date '+%H:%M:%S') - Verificando serviços..."
    
    # Verificar backend health
    check_url "$HEALTH_URL" "Backend Health"
    
    # Verificar backend root
    check_url "$BACKEND_URL" "Backend Root"
    
    # Verificar frontend
    check_url "$FRONTEND_URL" "Frontend"
    
    echo ""
    echo "Próxima verificação em 30 segundos..."
    echo "Pressione Ctrl+C para parar o monitoramento"
    
    sleep 30
done
