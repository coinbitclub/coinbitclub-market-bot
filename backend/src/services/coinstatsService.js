import axios from 'axios';

const BASE = 'https://openapi.coinstats.app/v1';
  
export async function fetchMetrics(apiKey) {
  const { data } = await axios.get(
    `${BASE}/markets?skip=0&limit=1`,
    { headers: { 'X-API-KEY': apiKey } }
  );
  // Novo formato: data.coins em vez de data.coins
  const coin = data.coins?.[0] || {};
  return {
    totalMarketCap: coin.marketCap || 0,
    totalVolume:    coin.volume    || 0,
  };
}

export async function fetchFearGreed(apiKey) {
  const { data } = await axios.get(
    `${BASE}/insights/fear-and-greed`,
    { headers: { 'X-API-KEY': apiKey } }
  );
  return {
    value:          data.value,
    classification: data.value_classification,
  };
}

export async function fetchDominance(apiKey) {
  const { data } = await axios.get(
    `${BASE}/insights/btc-dominance?type=24h`,
    { headers: { 'X-API-KEY': apiKey } }
  );
  return { dominance: data.btc_dominance };
}
