import axios from 'axios';
import { pool } from '../database.js';

/**
 * Busca métricas globais (market cap, volume, dominance, etc.)
 */
export async function fetchMetrics(apiKey) {
  const res = await axios.get('https://openapiv1.coinstats.app/markets', {
    params: { key: apiKey }
  });
  const data = res.data;
  return {
    captured_at: new Date(),
    volume_24h:    Number(data.volume_24h),
    market_cap:    Number(data.market_cap),
    dominance:     Number(data.dominance),
    altcoin_season: data.altcoin_season,
    rsi_market:    Number(data.rsi_market)
  };
}

/**
 * Busca Fear & Greed e Dominância BTC
 */
export async function getFearGreedAndDominance(apiKey) {
  const res = await axios.get('https://openapiv1.coinstats.app/insights', {
    params: { key: apiKey }
  });
  return {
    fearGreed: res.data.fearGreed,
    dominance: res.data.dominance
  };
}

/**
 * Persiste um webhook de dominância (BTC.D)
 */
export async function saveDominance(payload) {
  const sql = `
    INSERT INTO btc_dominance_signals
      (ticker, captured_at, dominance_pct, ema7, diff_pct, signal)
    VALUES ($1,$2,$3,$4,$5,$6)
  `;
  await pool.query(sql, [
    payload.ticker,
    new Date(payload.time),
    parseFloat(payload.btc_dominance || payload.dominance),
    parseFloat(payload.ema_7      || payload.ema7),
    parseFloat(payload.diff_pct),
    payload.sinal || payload.signal
  ]);
}
