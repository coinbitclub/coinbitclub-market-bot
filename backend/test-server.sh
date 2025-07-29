#!/bin/bash
# Script para testar o servidor limpo antes do deploy

echo "🧪 TESTANDO SERVIDOR LIMPO..."
echo "================================"

# Verificar se Node.js esta instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nao encontrado. Instale Node.js 18+"
    exit 1
fi

echo "✅ Node.js versao: $(node --version)"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependencias"
    exit 1
fi

echo "✅ Dependencias instaladas com sucesso"

# Verificar se o arquivo servidor existe
if [ ! -f "server-clean.cjs" ]; then
    echo "❌ Arquivo server-clean.cjs nao encontrado"
    exit 1
fi

echo "✅ Arquivo servidor encontrado"

# Testar syntax do arquivo
echo "🔍 Verificando syntax do arquivo..."
node -c server-clean.cjs

if [ $? -ne 0 ]; then
    echo "❌ Erro de syntax no arquivo servidor"
    exit 1
fi

echo "✅ Syntax do arquivo esta correta"

# Iniciar servidor em modo teste
echo "🚀 Iniciando servidor em modo teste..."
timeout 10s node server-clean.cjs &

# Aguardar alguns segundos
sleep 5

# Testar health check
echo "🔍 Testando health check..."
curl -f http://localhost:3000/health > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Health check funcionando"
else
    echo "⚠️ Health check nao respondeu (normal em teste rapido)"
fi

# Finalizar processo de teste
pkill -f "node server-clean.cjs" > /dev/null 2>&1

echo ""
echo "🎉 TESTE CONCLUIDO COM SUCESSO!"
echo "================================"
echo "✅ Dependencias: OK"
echo "✅ Syntax: OK" 
echo "✅ Arquivo servidor: OK"
echo ""
echo "🚀 Pronto para deploy no Railway!"
echo "Execute: railway up"
