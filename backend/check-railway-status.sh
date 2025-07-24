#!/bin/bash

# Script para verificar o status atual do projeto Railway
# Execute: chmod +x check-railway-status.sh && ./check-railway-status.sh

echo "🔍 Verificando Status do Projeto CoinBitClub Market Bot no Railway"
echo "=================================================================="

# Verificar se o Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado. Instale com: npm install -g @railway/cli"
    exit 1
fi

# Verificar status do projeto
echo "📊 Status do Projeto:"
railway status

echo ""
echo "🏗️ Serviços Disponíveis:"
railway services

echo ""
echo "📋 Variáveis de Ambiente:"
railway variables

echo ""
echo "🔗 Deployments Recentes:"
railway deployments

echo ""
echo "📈 Uso de Recursos:"
railway usage

echo ""
echo "🌐 URLs do Projeto:"
railway domain

echo ""
echo "💾 Banco de Dados:"
if railway variables | grep -q "DATABASE_URL"; then
    echo "✅ PostgreSQL configurado"
    echo "🔗 DATABASE_URL está definida"
else
    echo "❌ PostgreSQL não configurado"
    echo "💡 Execute: railway add postgresql"
fi

echo ""
echo "🔐 Variáveis Críticas:"
critical_vars=("JWT_SECRET" "OPENAI_API_KEY" "BINANCE_API_KEY" "BYBIT_API_KEY")

for var in "${critical_vars[@]}"; do
    if railway variables | grep -q "$var"; then
        echo "✅ $var - Configurada"
    else
        echo "❌ $var - Não configurada"
    fi
done

echo ""
echo "📚 Comandos Úteis:"
echo "   railway logs           - Ver logs"
echo "   railway up             - Deploy"
echo "   railway shell          - Conectar via shell"
echo "   railway restart        - Reiniciar serviço"
