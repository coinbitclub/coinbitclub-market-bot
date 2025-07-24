#!/bin/bash

# Script para conectar e fazer deploy no projeto Railway existente
# Execute: chmod +x connect-railway.sh && ./connect-railway.sh

echo "🚀 Conectando ao projeto Railway existente: coinbitclub-market-bot"
echo "=============================================================="

# Verificar se o Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado. Instale com: npm install -g @railway/cli"
    exit 1
fi

# Login no Railway (se necessário)
echo "🔐 Fazendo login no Railway..."
railway login

# Conectar ao projeto existente
echo "🔗 Conectando ao projeto coinbitclub-market-bot..."
railway link coinbitclub-market-bot

# Verificar conexão
echo "✅ Verificando conexão..."
railway status

# Listar variáveis existentes
echo "📋 Variáveis de ambiente atuais:"
railway variables

echo ""
echo "🎯 Próximos passos:"
echo "1. Verificar se todas as variáveis necessárias estão configuradas"
echo "2. Fazer deploy com: railway up"
echo "3. Verificar logs com: railway logs"
echo ""
echo "📚 Para configurar variáveis adicionais, execute:"
echo "   ./setup-railway-env.sh"
