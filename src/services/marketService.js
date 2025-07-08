// src/services/marketService.js
import axios from 'axios';
import { pool } from '../database.js';

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
  return res.data.map(k => ({
    open:  k[1],
    high:  k[2],
    low:   k[3],
    close: k[4],
    time:  k[0]
  }));
}

/**
 * Persiste o preço de mercado recebido via webhook
 */
export async function saveMarketPrice({ symbol, price, timestamp }) {
  await pool.query(
    `INSERT INTO market (symbol, price, "timestamp", captured_at)
     VALUES ($1, $2, $3, NOW())`,
    [symbol, price, timestamp]
  );
}
