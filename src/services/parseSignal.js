export function parseSignal(data) {
  console.log('[parseSignal] Payload recebido:', data);
  return {
    ticker: data.ticker ?? 'BTCUSDT', // valor padrÃ£o para teste
    close: Number(data.close ?? 0),
    ema9_30: Number(data.ema9_30 ?? 0),
    rsi_4h: Number(data.rsi_4h ?? 0),
    rsi_15: Number(data.rsi_15 ?? 0),
    momentum_15: Number(data.momentum_15 ?? 0),
    atr_30: Number(data.atr_30 ?? 0),
    atr_pct_30: Number(data.atr_pct_30 ?? 0),
    vol_30: Number(data.vol_30 ?? 0),
    vol_ma_30: Number(data.vol_ma_30 ?? 0),
    diff_btc_ema7: Number(data.diff_btc_ema7 ?? 0),
    leverage: Number(data.leverage ?? 1),
    signal_time: data.signal_time ?? new Date().toISOString()
  };
}
