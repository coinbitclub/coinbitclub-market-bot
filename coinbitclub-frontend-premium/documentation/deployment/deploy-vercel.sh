#!/bin/bash

# Script de Deploy Automático para Vercel
# Execute: ./deploy-vercel.sh

echo "🚀 Iniciando deploy do CoinBitClub Frontend no Vercel..."

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "📦 Instalando Vercel CLI..."
    npm install -g vercel
fi

# Verificar dependências
echo "📦 Verificando dependências..."
npm install

# Executar testes
echo "🧪 Executando testes..."
npm run type-check
npm run lint

# Build local para verificar
echo "🔨 Testando build..."
npm run build

# Deploy para produção
echo "🚀 Fazendo deploy para produção..."
vercel --prod

echo "✅ Deploy concluído com sucesso!"
echo "📊 Acesse o dashboard: https://vercel.com/dashboard"
