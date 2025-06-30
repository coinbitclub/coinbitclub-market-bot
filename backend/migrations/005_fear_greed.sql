CREATE TABLE IF NOT EXISTS fear_greed (
  id           SERIAL PRIMARY KEY,
  captured_at  TIMESTAMP NOT NULL,
  value        INT       NOT NULL
);
