import { pool } from '../database.js';

// Cria/atualiza tabela de sinais (TradingView)
export async function ensureSignalsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS signals (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(80),
      ticker VARCHAR(20) NOT NULL,
      price NUMERIC(20,8) NOT NULL,
      time TIMESTAMP NOT NULL,
      signal_json JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  // Adaptações para versões antigas (garante campos)
  await pool.query(`ALTER TABLE signals ADD COLUMN IF NOT EXISTS user_id VARCHAR(80);`);
  await pool.query(`ALTER TABLE signals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();`);
  await pool.query(`ALTER TABLE signals ADD COLUMN IF NOT EXISTS signal_json JSONB;`);
}

// Cria/atualiza tabela de dominance (CoinStats)
export async function ensureDominanceTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dominance (
      id SERIAL PRIMARY KEY,
      btc_dom NUMERIC(8,2),
      eth_dom NUMERIC(8,2),
      timestamp TIMESTAMP NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`ALTER TABLE dominance ADD COLUMN IF NOT EXISTS btc_dom NUMERIC(8,2);`);
  await pool.query(`ALTER TABLE dominance ADD COLUMN IF NOT EXISTS eth_dom NUMERIC(8,2);`);
  await pool.query(`ALTER TABLE dominance ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();`);
}

// Cria/atualiza tabela de fear_greed (CoinStats)
export async function ensureFearGreedTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fear_greed (
      id SERIAL PRIMARY KEY,
      index_value INT,
      value_classification VARCHAR(32),
      value NUMERIC(8,2),
      timestamp TIMESTAMP NOT NULL,
      captured_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`ALTER TABLE fear_greed ADD COLUMN IF NOT EXISTS value NUMERIC(8,2);`);
  await pool.query(`ALTER TABLE fear_greed ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ DEFAULT now();`);
  await pool.query(`ALTER TABLE fear_greed ADD COLUMN IF NOT EXISTS index_value INT;`);
  await pool.query(`ALTER TABLE fear_greed ADD COLUMN IF NOT EXISTS value_classification VARCHAR(32);`);
}
