-- Tabela de sinais
CREATE TABLE IF NOT EXISTS signals (
  id            SERIAL PRIMARY KEY,
  ticker        TEXT NOT NULL,
  time          TIMESTAMPTZ NOT NULL,
  close         NUMERIC NOT NULL,
  ema9_30       NUMERIC,
  rsi_4h        NUMERIC,
  rsi_15        NUMERIC,
  momentum_15   NUMERIC,
  atr_30        NUMERIC,
  atr_pct_30    NUMERIC,
  vol_30        NUMERIC,
  vol_ma_30     NUMERIC,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de dominância
CREATE TABLE IF NOT EXISTS dominance (
  id            SERIAL PRIMARY KEY,
  timestamp     TIMESTAMPTZ NOT NULL,
  btc_dom       NUMERIC,
  eth_dom       NUMERIC,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de raw webhook
CREATE TABLE IF NOT EXISTS raw_webhook (
  id            SERIAL PRIMARY KEY,
  route         TEXT NOT NULL,
  payload       JSONB NOT NULL,
  received_at   TIMESTAMPTZ DEFAULT NOW()
);
