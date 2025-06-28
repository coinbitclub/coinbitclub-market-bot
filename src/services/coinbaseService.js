import axios from 'axios';
import { query } from './databaseService.js';

/**
 * Busca as mÃ©tricas globais (market cap, volume, dominance, etc)
 * @param {string} apiKey sua COINSTATS_API_KEY
 * @returns {Promise<{captured_at: Date, volume_24h: number, market_cap: number, dominance: number, altcoin_season: string, rsi_market: number}>}
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
 * Busca o Fear & Greed e a DominÃ¢ncia BTC
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
 * Persiste um webhook de dominÃ¢ncia (BTC.D)
 */
export async function saveDominance(payload) {
  const sql = `
    INSERT INTO btc_dominance_signals
      (ticker, captured_at, dominance_pct, ema7, diff_pct, signal)
    VALUES ($1,$2,$3,$4,$5,$6)
  `;
  await query(sql, [
    payload.ticker,
    new Date(payload.time),
    parseFloat(payload.btc_dominance || payload.dominance),
    parseFloat(payload.ema_7      || payload.ema7),
    parseFloat(payload.diff_pct),
    payload.sinal || payload.signal
  ]);
}
