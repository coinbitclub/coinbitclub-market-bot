#!/bin/bash

# Script para deploy no Railway
echo "🚄 RAILWAY DEPLOY - COINBITCLUB MARKET BOT"
echo "=========================================="

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "📦 Instalando Railway CLI..."
    npm install -g @railway/cli
fi

# Login no Railway (se necessário)
echo "🔐 Fazendo login no Railway..."
railway login

# Inicializar projeto (se necessário)
if [ ! -f "railway.json" ]; then
    echo "🏗️  Inicializando projeto Railway..."
    railway init
fi

# Fazer deploy
echo "🚀 Fazendo deploy..."
railway up

# Verificar se o deploy foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Deploy no Railway realizado com sucesso!"
    echo "🌐 Abrindo aplicação..."
    railway open
else
    echo "❌ Erro no deploy do Railway"
    echo "📋 Verificando logs..."
    railway logs
    exit 1
fi

echo ""
echo "✅ DEPLOY RAILWAY COMPLETO!"
echo "=========================="
echo ""
echo "📋 Próximos passos:"
echo "1. Configurar variáveis de ambiente no Railway"
echo "2. Configurar banco de dados PostgreSQL"
echo "3. Testar a aplicação"
echo ""
echo "🔗 Comandos úteis:"
echo "- Ver logs: railway logs"
echo "- Abrir app: railway open"
echo "- Ver status: railway status"
echo "- Configurar env: railway variables"
