import { pool } from './db.js';

export async function ensureSignalsTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS signals ( id SERIAL PRIMARY KEY );`);
  await pool.query(`
    ALTER TABLE signals
      ADD COLUMN IF NOT EXISTS ticker      TEXT        NOT NULL,
      ADD COLUMN IF NOT EXISTS price       NUMERIC     NOT NULL,
      ADD COLUMN IF NOT EXISTS side        TEXT        NOT NULL,
      ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ NOT NULL DEFAULT now();
  `);
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_name='signals' AND column_name='symbol'
      ) THEN
        ALTER TABLE signals DROP COLUMN symbol;
      END IF;
    END $$;
  `);
}

export async function ensureCointarsTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS cointars ( id SERIAL PRIMARY KEY );`);
  await pool.query(`
    ALTER TABLE cointars
      ADD COLUMN IF NOT EXISTS btc_dom   NUMERIC     NOT NULL,
      ADD COLUMN IF NOT EXISTS eth_dom   NUMERIC     NOT NULL,
      ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ NOT NULL;
  `);
}

export async function ensurePositionsTable() {
  // sua definição de 'positions' aqui...
  await pool.query(`
    CREATE TABLE IF NOT EXISTS positions (
      /* ... campos existentes ... */
    );
  `);
}

export async function ensureIndicatorsTable() {
  // sua definição de 'indicators' aqui...
  await pool.query(`
    CREATE TABLE IF NOT EXISTS indicators (
      /* ... campos existentes ... */
    );
  `);
}
