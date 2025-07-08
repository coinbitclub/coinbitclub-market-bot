#!/usr/bin/env bash
set -euo pipefail

# ⚙️  Ajuste aqui:
HOST="https://coinbitclub-market-bot-production.up.railway.app"
TOKEN="210406"
APIKEY="SUA_COINSTATS_APIKEY"

echo "🧪 Testando GET /"
curl -s -i "$HOST/"

echo -e "\n🧪 Testando GET /healthz"
curl -s -i "$HOST/healthz"

echo -e "\n🧪 Testando POST /webhook/signal"
curl -s -i -X POST "$HOST/webhook/signal?token=$TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"symbol":"BTCUSDT","price":45000,"side":"buy"}'

echo -e "\n🧪 Testando POST /webhook/dominance"
curl -s -i -X POST "$HOST/webhook/dominance?token=$TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"btc_dom":60.5,"eth_dom":15.2}'

echo -e "\n🧪 Testando GET /api/fetch/metrics"
curl -s -i "$HOST/api/fetch/metrics?apiKey=$APIKEY"

echo -e "\n🧪 Testando GET /api/fetch/feargreed"
curl -s -i "$HOST/api/fetch/feargreed?apiKey=$APIKEY"

echo -e "\n🧪 Testando GET /api/fetch/dominance"
curl -s -i "$HOST/api/fetch/dominance?apiKey=$APIKEY"

# Se tiver outras rotas GET que desejar cobrir, basta repetir o padrão:
# echo -e "\n🧪 Testando GET /api/trading/..."
# curl -s -i "$HOST/api/trading/…?outros=params"

echo -e "\n✅ Todos os testes concluídos."
