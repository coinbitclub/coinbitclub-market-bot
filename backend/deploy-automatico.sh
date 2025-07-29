#!/bin/bash

# 🚀 SCRIPT DE DEPLOY AUTOMATIZADO PARA RAILWAY
# =============================================

echo "🚀 INICIANDO DEPLOY AUTOMATIZADO RAILWAY"
echo "========================================"

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "📦 Instalando Railway CLI..."
    npm install -g @railway/cli
fi

# Verificar se está logado no Railway
echo "🔐 Verificando login Railway..."
if ! railway whoami &> /dev/null; then
    echo "❌ Não está logado no Railway"
    echo "Execute: railway login"
    exit 1
fi

echo "✅ Railway CLI configurado"

# Criar projeto se não existir
echo "🏗️ Configurando projeto Railway..."
if [ ! -f "railway.json" ]; then
    echo "❌ Arquivo railway.json não encontrado"
    echo "Execute primeiro: node deploy-railway.js"
    exit 1
fi

# Verificar arquivos necessários
echo "📋 Verificando arquivos de deploy..."
required_files=(
    "server-multiusuario-limpo.js"
    "package.json"
    ".env.production"
    "railway.json"
    "Procfile"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Arquivo obrigatório não encontrado: $file"
        exit 1
    fi
    echo "✅ $file encontrado"
done

# Fazer deploy
echo "🚀 Iniciando deploy..."
railway up

if [ $? -eq 0 ]; then
    echo "✅ Deploy realizado com sucesso!"
    
    # Obter URL da aplicação
    URL=$(railway status --json | jq -r '.deployments[0].url' 2>/dev/null)
    
    if [ "$URL" != "null" ] && [ ! -z "$URL" ]; then
        echo "🌐 Aplicação disponível em: $URL"
        
        # Aguardar alguns segundos para aplicação inicializar
        echo "⏳ Aguardando inicialização (30s)..."
        sleep 30
        
        # Verificar health check
        echo "🔍 Verificando health check..."
        if curl -f "$URL/health" > /dev/null 2>&1; then
            echo "✅ Health check OK"
            echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
            echo "🌐 URL: $URL"
            echo "🔍 Health: $URL/health"
            echo "🔌 API: $URL/api/health"
        else
            echo "⚠️ Health check falhou - verificar logs"
            echo "📊 Verificar: railway logs"
        fi
    else
        echo "⚠️ URL não encontrada - verificar Railway dashboard"
    fi
else
    echo "❌ Falha no deploy"
    echo "📊 Verificar logs: railway logs"
    exit 1
fi

echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Configurar variáveis de ambiente no Railway"
echo "2. Adicionar credenciais Twilio"
echo "3. Testar endpoints"
echo "4. Conectar frontend"
echo ""
echo "🔗 Railway Dashboard: https://railway.app/dashboard"
