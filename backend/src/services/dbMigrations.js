// src/services/dbMigrations.js
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

  // 3) elimina a coluna antiga `symbol`, se ainda existir
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

  // 4) elimina a coluna antiga `time`, se ainda existir
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_name='signals' AND column_name='time'
      ) THEN
        ALTER TABLE signals DROP COLUMN "time";
      END IF;
    END
    $$;
  `);
}

export async function ensureCointarsTable() {
  // 1) cria tabela se não existir
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cointars (
      id SERIAL PRIMARY KEY
    );
  `);

  // 2) adiciona btc_dom, eth_dom e timestamp (caso estejam faltando)
  await pool.query(`
    ALTER TABLE cointars
      ADD COLUMN IF NOT EXISTS btc_dom   NUMERIC     NOT NULL,
      ADD COLUMN IF NOT EXISTS eth_dom   NUMERIC     NOT NULL,
      ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ NOT NULL DEFAULT now();
  `);
}

export async function ensurePositionsTable() {
  // ajuste esta definição conforme seu schema de positions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS positions (
      id SERIAL PRIMARY KEY
      -- adicione aqui os demais campos da tabela positions
    );
  `);
}

export async function ensureIndicatorsTable() {
  // ajuste esta definição conforme seu schema de indicators
  await pool.query(`
    CREATE TABLE IF NOT EXISTS indicators (
      id SERIAL PRIMARY KEY
      -- adicione aqui os demais campos da tabela indicators
    );
  `);
}
