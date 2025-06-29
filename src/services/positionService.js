/**
 * Avalia critérios de entrada/saída para sinais e calcula TP/SL
 */

// Decide se entra LONG/SHORT/não opera (regra exemplo)
export function evaluateEntryCriteria(signal, marketStats) {
  const fg = marketStats.fearGreed;
  const diff = signal.diff_btc_ema7;
  const cruzouAcima = !!signal.cruzou_acima_ema9;
  const cruzouAbaixo = !!signal.cruzou_abaixo_ema9;
  const rsi4h = signal.rsi_4h;
  const rsi15 = signal.rsi_15;
  const mom = signal.momentum_15;

  if (fg < 30 && signal.side === 'short') return null;
  if (fg > 75 && signal.side === 'long') return null;
  if (marketStats.atrPct < 0.2 || marketStats.volPct < 0.7) return null;

  if (
    fg < 75 &&
    diff > 0.3 &&
    cruzouAcima &&
    rsi4h < 75 &&
    rsi15 < 75 &&
    mom > 0
  ) return 'long';

  if (
    fg > 30 &&
    diff < -0.3 &&
    cruzouAbaixo &&
    rsi4h > 35 &&
    rsi15 > 35 &&
    mom < 0
  ) return 'short';

  return null;
}

// Calcula TP/SL
export function calculateTpsl(leverage) {
  const defaultLev = 6;
  const maxLev = 10;
  const lev = Math.min(leverage, maxLev);
  return {
    tpPct: 0.5 * lev,
    slPct: 3 * defaultLev
  };
}

// Calcula tamanho da posição (30% do saldo)
export function calculatePositionSize(balance) {
  return parseFloat((balance * 0.3).toFixed(8));
}
