import axios from 'axios';
import https from 'https';
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export async function fetchFearGreed() {
  try {
    const { data } = await axios.get(
      'https://api.alternative.me/fng/?limit=1',
      { httpsAgent, timeout: 5000 }
    );
    return data.data[0];
  } catch (err) {
    console.error('Erro ao buscar Fear & Greed:', err.message);
    throw err;
  }
}
