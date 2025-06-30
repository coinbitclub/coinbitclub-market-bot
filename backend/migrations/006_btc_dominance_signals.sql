CREATE TABLE IF NOT EXISTS btc_dominance_signals (
  id             SERIAL PRIMARY KEY,
  ticker         TEXT       NOT NULL,
  captured_at    TIMESTAMP  NOT NULL,
  dominance_pct  NUMERIC,
  ema7           NUMERIC,
  diff_pct       NUMERIC,
  signal         TEXT
);
