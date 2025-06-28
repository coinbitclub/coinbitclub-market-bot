import { parseSignal } from '../src/parseSignal.js';

test('parseSignal fields', () => {
  const raw = {
    ticker: 'BTCUSDT',
    time: '2025-06-15T12:00:00Z',
    close: 67500,
    ema9_30: 67000,
    rsi_4h: 56,
    rsi_15: 62,
    momentum_15: 0.8,
    atr_30: 70,
    atr_pct_30: 0.2,
    vol_30: 1200,
    vol_ma_30: 1150
  };
  expect(parseSignal(raw)).toEqual(raw);
});




