-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_signals_time   ON signals(time);
CREATE INDEX IF NOT EXISTS idx_signals_ticker ON signals(ticker);
CREATE INDEX IF NOT EXISTS idx_dom_timestamp  ON dominance(timestamp);
CREATE INDEX IF NOT EXISTS idx_raw_route      ON raw_webhook(route);
