import axios from 'axios';
export async function getMarketHistory() {
  const res = await axios.get(
    'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=100'
  );
  return res.data;
}




