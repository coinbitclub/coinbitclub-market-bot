# Script de Deploy Rápido para Vercel
# Este arquivo contém instruções para fazer deploy mesmo com alguns erros

echo "🚀 Iniciando deploy do CoinBitClub Frontend no Vercel..."

# Instalar Vercel CLI se não estiver instalado
if ! command -v vercel &> /dev/null; then
    echo "📦 Instalando Vercel CLI..."
    npm install -g vercel
fi

# Fazer deploy direto (sem build local)
echo "🚀 Fazendo deploy direto para Vercel..."
vercel --prod --force

echo "✅ Deploy iniciado! Acesse https://vercel.com/dashboard para acompanhar."
