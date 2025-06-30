BEGIN;

-- 1) Esquema inicial (signals, dominance, raw_webhook)
\i 001_initial_schema.sql

-- 2) Signals avançado
\i 004_signals.sql

-- 3) Fear & Greed
\i 005_fear_greed.sql

-- 4) BTC Dominance Signals
\i 006_btc_dominance_signals.sql

-- 5) Credenciais de usuário
\i 003_user_credentials.sql

-- 6) Índices de performance
\i 002_add_indexes.sql

-- 7) Índices adicionais (orders, subscriptions, metrics)
\i db-init.sql

COMMIT;
