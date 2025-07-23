import axios from 'axios';

export async function getFearAndGreed() {
  const { data } = await axios.get('https://api.coinstats.app/public/v1/fng', {
    headers: { 'X-API-KEY': process.env.COINSTATS_API_KEY }
  });
  return data.value;
}

export async function getBtcDominance() {
  const { data } = await axios.get('https://api.coinstats.app/public/v1/btcdominance', {
    headers: { 'X-API-KEY': process.env.COINSTATS_API_KEY }
  });
  return data.dominance;
}
