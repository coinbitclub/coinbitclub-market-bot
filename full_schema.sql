-- Arquivo consolidado gerado automaticamente
BEGIN;

-- 001_initial_schema.sql
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


-- 004_signals.sql
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


-- 005_fear_greed.sql
CREATE TABLE IF NOT EXISTS fear_greed (
  id           SERIAL PRIMARY KEY,
  captured_at  TIMESTAMP NOT NULL,
  value        INT       NOT NULL
);


-- 006_btc_dominance_signals.sql
CREATE TABLE IF NOT EXISTS btc_dominance_signals (
  id             SERIAL PRIMARY KEY,
  ticker         TEXT       NOT NULL,
  captured_at    TIMESTAMP  NOT NULL,
  dominance_pct  NUMERIC,
  ema7           NUMERIC,
  diff_pct       NUMERIC,
  signal         TEXT
);


-- 003_user_credentials.sql
CREATE TABLE IF NOT EXISTS user_credentials (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exchange TEXT NOT NULL,        -- 'BYBIT' ou 'BINANCE'
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  settings JSONB DEFAULT '{}'    -- customizações (leverage, order_pct etc)
);

CREATE INDEX IF NOT EXISTS idx_credentials_user
  ON user_credentials(user_id);


-- 002_add_indexes.sql
-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_signals_time   ON signals(time);
CREATE INDEX IF NOT EXISTS idx_signals_ticker ON signals(ticker);
CREATE INDEX IF NOT EXISTS idx_dom_timestamp  ON dominance(timestamp);
CREATE INDEX IF NOT EXISTS idx_raw_route      ON raw_webhook(route);


-- db-init.sql
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_time ON market_metrics(captured_at);


COMMIT;
