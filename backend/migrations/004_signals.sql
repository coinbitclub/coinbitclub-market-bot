CREATE TABLE IF NOT EXISTS signals (
  id                 SERIAL PRIMARY KEY,
  ticker             TEXT       NOT NULL,
  captured_at        TIMESTAMP  NOT NULL,
  close_price        NUMERIC,
  ema9_30            NUMERIC,
  rsi_4h             NUMERIC,
  rsi_15             NUMERIC,
  momentum_15        NUMERIC,
  atr_30             NUMERIC,
  atr_pct_30         NUMERIC,
  vol_30             NUMERIC,
  vol_ma_30          NUMERIC,
  diff_btc_ema7      NUMERIC,
  cruzou_acima_ema9  BOOLEAN,
  cruzou_abaixo_ema9 BOOLEAN
);
