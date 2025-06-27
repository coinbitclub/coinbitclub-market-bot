BEGIN;

-- 1) signals
CREATE TABLE IF NOT EXISTS signals (
  id           SERIAL PRIMARY KEY,
  ticker       VARCHAR NOT NULL,
  price        NUMERIC,
  signal_json  JSONB,
  time         TIMESTAMP NOT NULL,
  captured_at  TIMESTAMP DEFAULT NOW(),
  processed    BOOLEAN NOT NULL DEFAULT FALSE
);
ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS signal_json JSONB,
  ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE;

-- 2) indicators
CREATE TABLE IF NOT EXISTS indicators (
  id         SERIAL PRIMARY KEY,
  ema9       NUMERIC,
  rsi4h      NUMERIC,
  rsi15m     NUMERIC,
  momentum   NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3) fear_greed
CREATE TABLE IF NOT EXISTS fear_greed (
  id                   SERIAL PRIMARY KEY,
  index_value          NUMERIC,
  value_classification TEXT,
  timestamp            TIMESTAMP,
  captured_at          TIMESTAMP DEFAULT NOW()
);

-- 4) dominance
CREATE TABLE IF NOT EXISTS dominance (
  id         SERIAL PRIMARY KEY,
  btc_dom    NUMERIC,
  ema7       NUMERIC,
  timestamp  TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5) positions
CREATE TABLE IF NOT EXISTS positions (
  id          SERIAL PRIMARY KEY,
  symbol      VARCHAR NOT NULL,
  side        VARCHAR NOT NULL,
  qty         NUMERIC NOT NULL,
  entry_price NUMERIC,
  status      VARCHAR NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  processed   BOOLEAN NOT NULL DEFAULT FALSE
);
ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE;

-- 6) open_trades
CREATE TABLE IF NOT EXISTS open_trades (
  id          SERIAL PRIMARY KEY,
  symbol      VARCHAR NOT NULL,
  side        VARCHAR NOT NULL,
  qty         NUMERIC NOT NULL,
  entry_price NUMERIC,
  status      VARCHAR NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  processed   BOOLEAN NOT NULL DEFAULT FALSE
);
ALTER TABLE open_trades
  ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE;

-- 7) market
CREATE TABLE IF NOT EXISTS market (
  id           SERIAL PRIMARY KEY,
  symbol       VARCHAR NOT NULL,
  price        NUMERIC NOT NULL,
  timestamp    TIMESTAMP NOT NULL,
  captured_at  TIMESTAMP DEFAULT NOW()
);

-- 8) bot_logs
CREATE TABLE IF NOT EXISTS bot_logs (
  id           SERIAL PRIMARY KEY,
  level        VARCHAR,
  message      TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);

COMMIT;
