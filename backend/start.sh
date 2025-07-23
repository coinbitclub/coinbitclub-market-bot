#!/bin/sh

echo "🚀 Iniciando CoinbitClub Market Bot Backend..."

# Executar migrações do banco de dados
echo "📊 Executando migrações do banco de dados..."
cd api-gateway
npm run migrate
cd ..

# Iniciar API Gateway na porta 8081
echo "🌐 Iniciando API Gateway na porta 8081..."
cd api-gateway
PORT=8081 npm start &

# Aguardar um pouco para garantir que o API Gateway inicie
sleep 5

echo "✅ CoinbitClub Market Bot Backend iniciado com sucesso!"
echo "🔗 API Gateway: http://localhost:8081"

# Manter o container rodando
wait
