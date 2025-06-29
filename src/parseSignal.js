export function parseSignal(body) {
  // Garantia de data válida
  let parsedTime = new Date(body.time);
  if (!body.time || isNaN(parsedTime)) {
    parsedTime = new Date();
  }

  return {
    ticker:          body.ticker ?? 'BTCUSDT',
    time:            parsedTime, // SEMPRE válido
    close:           body.close != null ? Number(body.close) : null,
    ema9_30:         body.ema9_30 != null ? Number(body.ema9_30) : null,
    rsi_4h:          body.rsi_4h != null ? Number(body.rsi_4h) : null,
    rsi_15:          body.rsi_15 != null ? Number(body.rsi_15) : null,
    momentum_15:     body.momentum_15 != null ? Number(body.momentum_15) : null,
    atr_30:          body.atr_30 != null ? Number(body.atr_30) : null,
    atr_pct_30:      body.atr_pct_30 != null ? Number(body.atr_pct_30) : null,
    vol_30:          body.vol_30 != null ? Number(body.vol_30) : null,
    vol_ma_30:       body.vol_ma_30 != null ? Number(body.vol_ma_30) : null,
    diff_btc_ema7:   body.diff_btc_ema7 != null ? Number(body.diff_btc_ema7) : null,
    leverage:        body.leverage != null ? Number(body.leverage) : 1,
    signal_json:     body.signal_json ?? null // ou ajustar conforme uso
  };
}
