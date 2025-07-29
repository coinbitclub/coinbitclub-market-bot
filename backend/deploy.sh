#!/bin/bash
# 🚀 Script de Deploy - CoinbitClub MarketBot
# Deploy automático para Railway

echo "🚀 Iniciando deploy do CoinbitClub MarketBot..."

# 1. Verificar dependências
echo "📦 Verificando dependências..."
npm audit --audit-level moderate
if [ $? -ne 0 ]; then
    echo "❌ Vulnerabilidades encontradas. Execute npm audit fix"
    exit 1
fi

# 2. Executar testes
echo "🧪 Executando testes..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Testes falharam. Corrija antes do deploy"
    exit 1
fi

# 3. Build (se necessário)
echo "🔨 Preparando build..."
npm run build --if-present

# 4. Configurar Railway
echo "🚂 Configurando Railway..."
railway login
railway link

# 5. Configurar variáveis de ambiente
echo "⚙️ Configurando variáveis de ambiente..."
railway variables set NODE_ENV=production
railway variables set PORT=3000

# 6. Deploy
echo "🚀 Fazendo deploy..."
railway up

# 7. Verificar deploy
echo "✅ Verificando deploy..."
railway logs

echo "🎉 Deploy concluído com sucesso!"
echo "🌐 Acesse: https://seu-app.railway.app"
