import { pool } from './db.js';

export async function ensureSignalsTable() {
  // 1) cria tabela se não existir
  await pool.query(`
    CREATE TABLE IF NOT EXISTS signals (
      id SERIAL PRIMARY KEY
    );
  `);

  // 2) adiciona ticker, price, side e received_at (caso estejam faltando)
  await pool.query(`
    ALTER TABLE signals
      ADD COLUMN IF NOT EXISTS ticker       TEXT        NOT NULL,
      ADD COLUMN IF NOT EXISTS price        NUMERIC     NOT NULL,
      ADD COLUMN IF NOT EXISTS side         TEXT        NOT NULL,
      ADD COLUMN IF NOT EXISTS received_at  TIMESTAMPTZ NOT NULL DEFAULT now();
  `);

  // 3) remove a coluna antiga `symbol`, se ainda existir
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_name='signals' AND column_name='symbol'
      ) THEN
        ALTER TABLE signals DROP COLUMN symbol;
      END IF;
    END
    $$;
  `);
}

export async function ensureCointarsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cointars (
      id SERIAL PRIMARY KEY
    );
  `);
  await pool.query(`
    ALTER TABLE cointars
      ADD COLUMN IF NOT EXISTS btc_dom   NUMERIC     NOT NULL,
      ADD COLUMN IF NOT EXISTS eth_dom   NUMERIC     NOT NULL,
      ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ NOT NULL;
  `);
}

export async function ensurePositionsTable() {
  // ... sua definição existente de positions ...
  await pool.query(`
    CREATE TABLE IF NOT EXISTS positions (
      /* ... campos ... */
    );
  `);
}

export async function ensureIndicatorsTable() {
  // ... sua definição existente de indicators ...
  await pool.query(`
    CREATE TABLE IF NOT EXISTS indicators (
      /* ... campos ... */
    );
  `);
}
