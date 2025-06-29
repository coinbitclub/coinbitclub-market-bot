import { pool } from '../database.js';
import { placeMarketOrder as placeOrder } from './bybitService.js';

/**
 * Avalia um sinal e, se atender critérios, envia ordem LONG/SHORT e registra posição.
 * @param {{ ticker:string, price:number, time:string, signal_json?:object }} signal
 */
export async function handleSignal(signal) {
  const { ticker, price, signal_json } = signal;

  // 1) Último Fear & Greed
  const { rows: fgRows } = await pool.query(
    'SELECT index_value AS value FROM fear_greed ORDER BY id DESC LIMIT 1'
  );
  const fg = fgRows[0]?.value ?? 0;

  // 2) Última Dominance (BTC.D)
  const { rows: dgRows } = await pool.query(
    'SELECT btc_dom AS value FROM dominance ORDER BY id DESC LIMIT 1'
  );
  const dg = dgRows[0]?.value ?? 0;

  // 3) Últimos indicadores técnicos
  const { rows: indRows } = await pool.query(
    `SELECT ema9, rsi4h, rsi15m, momentum FROM indicators ORDER BY id DESC LIMIT 1`
  );
  const { ema9 = 0, rsi4h = 0, rsi15m = 0, momentum = 0 } = indRows[0] || {};

  // 4) Lógica do trade
  const diff = dg - ema9;
  const isLong =
    fg < 75 &&
    diff > 0.003 &&
    price > ema9 &&
    rsi4h < 75 &&
    rsi15m < 75 &&
    momentum > 0;
  const isShort =
    fg > 30 &&
    diff < -0.003 &&
    price < ema9 &&
    rsi4h > 35 &&
    rsi15m > 35 &&
    momentum < 0;

  if (!isLong && !isShort) {
    console.log('[Engine] Sem sinal de trade para', ticker, { fg, dg, ema9, rsi4h, rsi15m, momentum, price });
    return null;
  }

  // 5) Executar ordem via Bybit
  const side = isLong ? 'Buy' : 'Sell';
  const qty = 1; // TODO: ajustar cálculo de posição
  console.log(`[Engine] Sinal ${side} ${ticker} qty=${qty} preço=${price}`);

  let result = null;
  try {
    result = await placeOrder({
      symbol: `${ticker}USDT`,
      side,
      qty,
      tp: isLong ? price * 1.01 : undefined,
      sl: isLong ? price * 0.99 : undefined
    });
    console.log('[Engine] Ordem enviada para Bybit:', result);
  } catch (err) {
    console.error('[Engine] ERRO ao enviar ordem para Bybit:', err);
    return null;
  }

  // 6) Salvar posição aberta
  try {
    await pool.query(
      `INSERT INTO positions (symbol, side, qty, entry_price, status, created_at)
       VALUES ($1, $2, $3, $4, 'open', NOW())`,
      [ticker, side, qty, price]
    );
    console.log('[Engine] Posição registrada em DB');
  } catch (err) {
    console.error('[Engine] ERRO ao registrar posição no DB:', err);
  }

  return result;
}
