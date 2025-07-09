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
 * Salva dados agregados de leitura de mercado para uso da IA
 */
export async function saveMarket(data) {
  await pool.query(
    `INSERT INTO market_readings (
      fg_index, btc_dominance, volume_btc, tendencia_macro, contexto, created_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())`,
    [
      data.fg_index,
      data.btc_dominance,
      data.volume_btc,
      data.tendencia_macro,
      JSON.stringify(data.contexto || {})
    ]
  );
}

/**
 * Salva um preço individual de mercado (via webhook, por exemplo)
 */
export async function saveMarketPrice({ symbol, price, timestamp }) {
  await pool.query(
    `INSERT INTO market (symbol, price, "timestamp", captured_at)
     VALUES ($1, $2, $3, NOW())`,
    [symbol, price, timestamp]
  );
}

/**
 * Salva (ou atualiza) múltiplos mercados com base em symbol
 */
export async function saveMarkets(markets) {
  for (const m of markets) {
    await pool.query(
      `INSERT INTO markets (symbol, price, change, volume)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (symbol) DO UPDATE
         SET price  = EXCLUDED.price,
             change = EXCLUDED.change,
             volume = EXCLUDED.volume`,
      [m.symbol, m.price, m.change, m.volume]
    );
  }
}
