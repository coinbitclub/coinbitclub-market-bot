import axios from 'axios';

const MARKETS_URL   = 'https://api.coinstats.app/public/v1/markets?skip=0&limit=1';
const FEARGREED_URL = 'https://openapiv1.coinstats.app/insights/fear-and-greed';
const DOM_URL       = 'https://openapiv1.coinstats.app/insights/btc-dominance?type=24h';

export async function fetchMetrics(apiKey) {
  const { data } = await axios.get(MARKETS_URL, {
    headers: { 'X-API-KEY': apiKey }
  });
  // tests podem devolver { marketCap, volume } em vez de coins:[…]
  const coin = data.coins?.[0] ?? data;
  return {
    totalMarketCap: coin.marketCap ?? 0,
    totalVolume:    coin.volume    ?? 0,
  };
}

export async function fetchFearGreed(apiKey) {
  const { data } = await axios.get(FEARGREED_URL, {
    headers: { 'X-API-KEY': apiKey }
  });
  const classification = data.value_classification ?? data.classification;
  return {
    value:          data.value,
    classification,
  };
}

export async function fetchDominance(apiKey) {
  const { data } = await axios.get(DOM_URL, {
    headers: { 'X-API-KEY': apiKey }
  });
  const dominance = data.btc_dominance ?? data.dominance;
  return { dominance };
}
