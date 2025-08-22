#!/bin/bash
# SCRIPT DE DEPLOY RAILWAY COM NGROK OBRIGATÓRIO
echo "🚀 INICIANDO DEPLOY RAILWAY COM ANTI-BLOQUEIO GEOGRÁFICO..."

# Verificar se NGROK_AUTH_TOKEN está configurado
if [ -z "$NGROK_AUTH_TOKEN" ]; then
    echo "❌ NGROK_AUTH_TOKEN não configurado!"
    echo "💡 Configure no Railway: NGROK_AUTH_TOKEN=314SgsgTA9RpH3gJJenmvEEOnu3_3uXNyK3QbWE4u8VZa7tFZ"
    exit 1
fi

echo "✅ NGROK_AUTH_TOKEN configurado"
echo "🌍 Região: us"
echo "🏷️  Subdomínio: marketbot-trading"

# Instalar NGROK se não estiver disponível
if ! command -v ngrok &> /dev/null; then
    echo "📦 Instalando NGROK..."
    
    # Download NGROK para Linux (Railway usa Linux)
    wget -q https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
    tar xzf ngrok-v3-stable-linux-amd64.tgz
    chmod +x ngrok
    sudo mv ngrok /usr/local/bin/
    
    echo "✅ NGROK instalado"
fi

# Autenticar NGROK
echo "🔑 Autenticando NGROK..."
ngrok config add-authtoken $NGROK_AUTH_TOKEN

# Obter porta do Railway
RAILWAY_PORT=${PORT:-3000}
echo "📡 Porta Railway: $RAILWAY_PORT"

# Iniciar NGROK HTTP tunnel em background
echo "🌐 Iniciando tunnel NGROK..."
ngrok http $RAILWAY_PORT \
    --region=us \
    --subdomain=marketbot-trading \
    --log=stdout \
    --log-level=info \
    --log-format=term &

# Aguardar NGROK inicializar
echo "⏳ Aguardando NGROK inicializar..."
sleep 10

# Verificar se tunnel está ativo
echo "🔍 Verificando tunnel..."
NGROK_URL="https://marketbot-trading.ngrok.io"
if curl -s --max-time 10 "$NGROK_URL" > /dev/null; then
    echo "✅ Tunnel NGROK ativo: $NGROK_URL"
else
    echo "⚠️ Tunnel pode estar inicializando ainda..."
fi

# Configurar proxy local para o servidor Node.js
echo "🔧 Configurando proxy local..."

# Criar proxy HTTP local na porta 4040 que redireciona via NGROK
socat TCP-LISTEN:4040,fork TCP:127.0.0.1:4040 &

# Iniciar servidor MarketBot
echo "🚀 Iniciando servidor MarketBot..."
echo "🌐 Tunnel URL: $NGROK_URL"
echo "📡 Proxy local: http://127.0.0.1:4040"

# Executar servidor principal
exec node servidor-marketbot-real.js
