#!/bin/bash

echo "🚀 INICIANDO MARKETBOT COM SUPORTE NGROK NO RAILWAY"

# Verificar se NGROK_AUTH_TOKEN está configurado
if [ -z "$NGROK_AUTH_TOKEN" ]; then
    echo "⚠️  NGROK_AUTH_TOKEN não configurado - continuando sem túnel"
    echo "🔄 Iniciando servidor diretamente..."
    node servidor-marketbot-real.js
    exit 0
fi

echo "✅ NGROK_AUTH_TOKEN configurado"
echo "🌍 Região: ${NGROK_REGION:-us}"
echo "🏷️  Subdomínio: ${NGROK_SUBDOMAIN:-marketbot-trading}"

# Instalar NGROK se não estiver disponível
if ! command -v ngrok &> /dev/null; then
    echo "📦 Instalando NGROK..."
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | tee /etc/apt/sources.list.d/ngrok.list
    apt update && apt install ngrok -y
fi

# Configurar NGROK
echo "🔧 Configurando NGROK..."
ngrok config add-authtoken $NGROK_AUTH_TOKEN

# Iniciar túnel NGROK em background
echo "🌐 Iniciando túnel NGROK..."
ngrok tcp $PORT \
    --region=${NGROK_REGION:-us} \
    --subdomain=${NGROK_SUBDOMAIN:-marketbot-trading} \
    --log=stdout \
    > ngrok.log 2>&1 &

NGROK_PID=$!
echo "📝 NGROK PID: $NGROK_PID"

# Aguardar túnel estar pronto
echo "⏳ Aguardando túnel NGROK estar pronto..."
sleep 10

# Verificar se túnel está funcionando
if ps -p $NGROK_PID > /dev/null; then
    echo "✅ Túnel NGROK ativo!"
    echo "📊 Logs do NGROK em ngrok.log"
else
    echo "⚠️  Túnel NGROK falhou - continuando sem túnel"
fi

# Iniciar servidor principal
echo "🚀 Iniciando MarketBot Enterprise..."
node servidor-marketbot-real.js

# Cleanup quando servidor para
echo "🛑 Parando túnel NGROK..."
kill $NGROK_PID 2>/dev/null || true
