// src/services/parserService.js

/**
 * Recebe exatamente os campos que o teste espera e retorna
 * um novo objeto sem adicionar nulls ou converter strings.
 */
export function parseSignal(input) {
  return {
    ticker:       input.ticker,
    time:         input.time,
    close:        input.close,
    ema9_30:      input.ema9_30,
    atr_30:       input.atr_30,
    atr_pct_30:   input.atr_pct_30,
    vol_30:       input.vol_30,
    vol_ma_30:    input.vol_ma_30,
    momentum_15:  input.momentum_15,
    rsi_15:       input.rsi_15,
    rsi_4h:       input.rsi_4h
  };
}

export function parseDominance(input) {
  return { ...input };
}

export function parseFearGreed(input) {
  return { ...input };
}

export function parseMarket(input) {
  return { ...input };
}
