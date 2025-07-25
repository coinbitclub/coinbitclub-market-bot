#!/bin/bash

echo "🚀 DEPLOY COMPLETO COINBITCLUB NO RAILWAY"
echo "========================================"

# Verificar se estamos no diretório correto
if [ ! -f "railway.toml" ]; then
    echo "❌ Erro: railway.toml não encontrado. Execute este script no diretório backend."
    exit 1
fi

echo "📡 Verificando conexão Railway..."
railway login --browser

echo "🏗️ Iniciando deploy..."
railway up

echo "📊 Verificando status do deploy..."
railway status

echo "🌐 Obtendo URL do serviço..."
railway domain

echo "✅ Deploy concluído!"
echo "📋 Para verificar logs:"
echo "   railway logs"
echo "📋 Para verificar variáveis:"
echo "   railway vars"
