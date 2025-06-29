import axios from 'axios';

/**
 * Busca histórico de candles de 1h para BTCUSDT na Binance
 */
export async function getMarketHistory() {
  const res = await axios.get(
    'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=100'
  );
  return res.data;
}

/**
 * (Exemplo extra)
 * Busca candles customizados por símbolo/intervalo/limite
 */
export async function fetchKlines(symbol, interval = '30', limit = 10) {
  const res = await axios.get(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}m&limit=${limit}`
  );
  // Retorna lista com { open, high, low, close, ... }
  return res.data.map(k => ({
    open: k[1], high: k[2], low: k[3], close: k[4], time: k[0]
  }));
}
