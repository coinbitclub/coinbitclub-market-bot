// src/services/coinstatsService.js
import axios from 'axios';

/**
 * Busca métricas gerais (market cap, volume) da CoinStats.
 */
export async function fetchMetrics(apiKey) {
  const { data } = await axios.get(
    'https://api.coinstats.app/public/v1/markets?skip=0&limit=1',
    { headers: { 'X-API-KEY': apiKey } }
  );
  // Ajuste conforme o formato real da resposta:
  return {
    totalMarketCap: data[0]?.marketCap || 0,
    totalVolume:    data[0]?.volume || 0
  };
}

/**
 * Busca índice Fear & Greed da CoinStats.
 */
export async function fetchFearGreed(apiKey) {
  const { data } = await axios.get(
    'https://openapiv1.coinstats.app/insights/fear-and-greed',
    { headers: { 'X-API-KEY': apiKey } }
  );
  return {
    value:           data.value,
    season:          data.value_classification,  // ou ajuste conforme campo correto
  };
}

/**
 * Busca dominância de BTC na CoinStats.
 */
export async function fetchDominance(apiKey) {
  const { data } = await axios.get(
    'https://openapiv1.coinstats.app/insights/btc-dominance?type=24h',
    { headers: { 'X-API-KEY': apiKey } }
  );
  return {
    dominance: data.btc_dominance  // ajuste conforme campo retornado
  };
}
