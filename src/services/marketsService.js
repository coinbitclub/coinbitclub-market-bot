import axios from 'axios';

export async function fetchMarkets() {
  const resp = await axios.get('https://openapiv1.coinstats.app/markets', {
    headers: { 'X-API-KEY': process.env.COINSTATS_API_KEY }
  });
  if (!Array.isArray(resp.data)) throw new Error('MarketsService: resposta inválida');
  return resp.data;
}
