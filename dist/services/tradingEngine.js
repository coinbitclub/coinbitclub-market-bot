"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleSignal = handleSignal;
var _database = require("../database.js");
var _bybitAdapter = require("../adapters/bybitAdapter.js");
/**
 * Avalia um sinal e, se atender critérios de LONG/SHORT, envia ordem via Bybit e registra em positions.
 * @param {{ symbol:string, price:number, timestamp:string }} signal
 */
async function handleSignal(signal) {
  const {
    symbol,
    price
  } = signal;

  // 1) Buscar últimos valores globais
  const fgRes = await _database.pool.query('SELECT value FROM fear_greed ORDER BY id DESC LIMIT 1');
  const dgRes = await _database.pool.query('SELECT value FROM dominance ORDER BY id DESC LIMIT 1');
  const fg = fgRes.rows[0]?.value ?? 0;
  const dg = dgRes.rows[0]?.value ?? 0;

  // 2) Buscar últimos indicadores calculados
  const indRes = await _database.pool.query(`SELECT ema9, rsi4h, rsi15m, momentum
       FROM indicators
      ORDER BY id DESC
      LIMIT 1`);
  const {
    ema9,
    rsi4h,
    rsi15m,
    momentum
  } = indRes.rows[0] || {};

  // 3) Calcular diff BTC.D vs EMA9 (supondo que dg = BTC.D)
  const diff = dg - ema9;

  // 4) Verificar critérios
  const isLong = fg < 75 && diff > 0.003 && price > ema9 && rsi4h < 75 && rsi15m < 75 && momentum > 0;
  const isShort = fg > 30 && diff < -0.003 && price < ema9 && rsi4h > 35 && rsi15m > 35 && momentum < 0;
  if (!isLong && !isShort) return null;

  // 5) Executar ordem
  const side = isLong ? 'Buy' : 'Sell';
  const qty = 1; // FIXME: ajustar sizing baseado em risco
  const result = await (0, _bybitAdapter.placeOrder)({
    symbol: `${symbol}USDT`,
    side,
    qty
  });

  // 6) Registrar em positions
  await _database.pool.query(`
    INSERT INTO positions
      (symbol, side, qty, entry_price, status, created_at)
    VALUES
      ($1, $2, $3, $4, 'open', NOW())
    `, [symbol, side, qty, price]);
  return result;
}