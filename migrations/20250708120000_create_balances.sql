CREATE TABLE IF NOT EXISTS balances (
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users(id),
available_cents BIGINT NOT NULL,
committed_cents BIGINT NOT NULL,
updated_at TIMESTAMP DEFAULT NOW()
);