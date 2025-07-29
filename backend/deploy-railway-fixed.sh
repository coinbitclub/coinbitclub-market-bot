#!/bin/bash
# Script de Deploy Corrigido para Railway - CoinBitClub Market Bot
# Versao 29/07/2025 - Correcao de caracteres especiais

echo "🚀 DEPLOY RAILWAY - COINBITCLUB MARKET BOT"
echo "=========================================="
echo "🔧 Versao corrigida - sem caracteres especiais"
echo ""

# Verificar se estamos no diretorio correto
if [ ! -f "server-clean.cjs" ]; then
    echo "❌ Arquivo server-clean.cjs nao encontrado!"
    echo "Execute este script a partir da pasta backend/"
    exit 1
fi

# Verificar se Railway CLI esta instalado
if ! command -v railway &> /dev/null; then
    echo "📦 Instalando Railway CLI..."
    npm install -g @railway/cli
    
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao instalar Railway CLI"
        exit 1
    fi
fi

echo "✅ Railway CLI encontrado"

# Fazer backup dos arquivos originais
echo "🔄 Fazendo backup dos arquivos originais..."
if [ -f "package.json" ]; then
    cp package.json package.json.backup
    echo "✅ Backup do package.json criado"
fi

if [ -f "server-multiservice-complete.cjs" ]; then
    cp server-multiservice-complete.cjs server-multiservice-complete.cjs.backup
    echo "✅ Backup do servidor original criado"
fi

# Substituir package.json pelo limpo
echo "🔄 Usando package.json limpo..."
cp package-clean.json package.json
echo "✅ Package.json atualizado"

# Verificar arquivos necessarios
echo "🔍 Verificando arquivos necessarios..."

required_files=("server-clean.cjs" "package.json" "Dockerfile.railway-completo" "railway.toml")

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file - encontrado"
    else
        echo "❌ $file - NAO encontrado"
        exit 1
    fi
done

# Testar servidor rapidamente
echo "🧪 Testando servidor..."
node -c server-clean.cjs

if [ $? -ne 0 ]; then
    echo "❌ Erro de syntax no servidor"
    exit 1
fi

echo "✅ Servidor testado com sucesso"

# Login no Railway se necessario
echo "🔐 Verificando login no Railway..."
railway whoami > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "📝 Fazendo login no Railway..."
    railway login
    
    if [ $? -ne 0 ]; then
        echo "❌ Erro no login do Railway"
        exit 1
    fi
fi

echo "✅ Login no Railway confirmado"

# Verificar se projeto existe
echo "🔍 Verificando projeto Railway..."
if [ ! -f "railway.json" ] && [ ! -f ".railway.json" ]; then
    echo "🏗️ Inicializando projeto Railway..."
    railway init
fi

# Fazer deploy
echo ""
echo "🚀 INICIANDO DEPLOY..."
echo "====================="
railway up

# Verificar resultado do deploy
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 DEPLOY REALIZADO COM SUCESSO!"
    echo "================================"
    echo ""
    echo "📋 Informacoes do deploy:"
    echo "✅ Servidor: server-clean.cjs (sem caracteres especiais)"
    echo "✅ Package: package-clean.json (encoding correto)"
    echo "✅ Dockerfile: Dockerfile.railway-completo (otimizado)"
    echo "✅ Health check: /health"
    echo ""
    echo "🔗 Comandos uteis:"
    echo "- Ver logs: railway logs"
    echo "- Abrir app: railway open"
    echo "- Ver status: railway status"
    echo ""
    echo "🌐 Abrindo aplicacao..."
    railway open
    
else
    echo ""
    echo "❌ ERRO NO DEPLOY"
    echo "=================="
    echo ""
    echo "📋 Verificando logs..."
    railway logs --tail 50
    
    echo ""
    echo "🔧 Possiveis solucoes:"
    echo "1. Verificar variaveis de ambiente no Railway"
    echo "2. Verificar se PostgreSQL esta configurado"
    echo "3. Verificar logs com: railway logs"
    echo ""
    
    # Restaurar arquivos originais
    if [ -f "package.json.backup" ]; then
        cp package.json.backup package.json
        echo "🔄 Package.json original restaurado"
    fi
    
    exit 1
fi

echo ""
echo "✅ DEPLOY CONCLUIDO!"
echo "Servidor limpo e otimizado deployado com sucesso!"
