import axios from 'axios';

export async function fetchMetrics(apiKey) {
  const { data } = await axios.get(
    'https://api.coinstats.app/public/v1/markets?skip=0&limit=1',
    { headers: { 'X-API-KEY': apiKey } }
  );
  // O endpoint retorna { coins: [ { marketCap, volume, … } ] }
  const coin = data.coins?.[0] || {};
  return {
    totalMarketCap: coin.marketCap || 0,
    totalVolume:    coin.volume    || 0,
  };
}

export async function fetchFearGreed(apiKey) {
  const { data } = await axios.get(
    'https://openapiv1.coinstats.app/insights/fear-and-greed',
    { headers: { 'X-API-KEY': apiKey } }
  );
  return {
    value:          data.value,
    classification: data.value_classification,
  };
}

export async function fetchDominance(apiKey) {
  const { data } = await axios.get(
    'https://openapiv1.coinstats.app/insights/btc-dominance?type=24h',
    { headers: { 'X-API-KEY': apiKey } }
  );
  return { dominance: data.btc_dominance };
}
