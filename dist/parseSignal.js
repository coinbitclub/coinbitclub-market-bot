"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseSignal = parseSignal;
function parseSignal(body) {
  return {
    ticker: body.ticker,
    time: new Date(body.time),
    close: parseFloat(body.close),
    ema9: parseFloat(body.ema9_30),
    rsi4h: parseFloat(body.rsi_4h),
    rsi15: parseFloat(body.rsi_15),
    momentum15: parseFloat(body.momentum_15),
    atr30: parseFloat(body.atr_30),
    atrPct30: parseFloat(body.atr_pct_30),
    vol30: parseFloat(body.vol_30),
    volMa30: parseFloat(body.vol_ma_30),
    diffBtcEma7: parseFloat(body.diff_btc_ema7),
    cruzouAcimaEma9: Boolean(body.cruzou_acima_ema9),
    cruzouAbaixoEma9: Boolean(body.cruzou_abaixo_ema9),
    leverage: parseInt(body.leverage, 10)
  };
}