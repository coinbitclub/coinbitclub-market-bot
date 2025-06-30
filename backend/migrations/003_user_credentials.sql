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
