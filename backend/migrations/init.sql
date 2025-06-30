-- 1. Sinais
CREATE TABLE IF NOT EXISTS signals (
  id          SERIAL PRIMARY KEY,
  signal_json JSONB,
  received_at TIMESTAMP    DEFAULT NOW(),
  ticker      VARCHAR(20),
  time        TIMESTAMP,
  close       NUMERIC
);

-- 2. Mercado
CREATE TABLE IF NOT EXISTS market (
  id          SERIAL PRIMARY KEY,
  symbol      VARCHAR(20),
  price       NUMERIC,
  timestamp   TIMESTAMP,
  captured_at TIMESTAMP    DEFAULT NOW()
);

-- 3. Dominance
CREATE TABLE IF NOT EXISTS dominance (
  id          SERIAL PRIMARY KEY,
  timestamp   TIMESTAMP,
  btc_dom     NUMERIC,
  eth_dom     NUMERIC,
  created_at  TIMESTAMP    DEFAULT NOW()
);

-- 4. Fear & Greed
CREATE TABLE IF NOT EXISTS fear_greed (
  id                   SERIAL PRIMARY KEY,
  index_value          NUMERIC,
  value_classification TEXT,
  timestamp            TIMESTAMP,
  created_at           TIMESTAMP DEFAULT NOW()
);

-- 5. Trades abertas
CREATE TABLE IF NOT EXISTS open_trades (
  id          SERIAL PRIMARY KEY,
  symbol      VARCHAR(20),
  entryprice  NUMERIC,
  qty         NUMERIC,
  pnl         NUMERIC,
  created_at  TIMESTAMP    DEFAULT NOW()
);

-- 6. Logs do bot
CREATE TABLE IF NOT EXISTS bot_logs (
  id          SERIAL PRIMARY KEY,
  created_at  TIMESTAMP    DEFAULT NOW(),
  severity    VARCHAR(20),
  message     TEXT,
  context     JSONB
);
