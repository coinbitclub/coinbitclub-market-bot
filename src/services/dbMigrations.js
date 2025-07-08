// src/services/dbMigrations.js

import { pool } from './db.js';

export async function ensureSignalsTable() {
  // 1) cria tabela se não existir (com chave primária)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS signals (
      id SERIAL PRIMARY KEY
    );
  `);

  // 2) adiciona colunas ticker, price, side e received_at, se faltarem
  await pool.query(`
    ALTER TABLE signals
      ADD COLUMN IF NOT EXISTS ticker       TEXT        NOT NULL,
      ADD COLUMN IF NOT EXISTS price        NUMERIC     NOT NULL,
      ADD COLUMN IF NOT EXISTS side         TEXT        NOT NULL,
      ADD COLUMN IF NOT EXISTS received_at  TIMESTAMPTZ NOT NULL DEFAULT now();
  `);

  // 3) elimina a coluna antiga `symbol`, caso ainda exista
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
          FROM information_schema.columns
         WHERE table_name='signals'
           AND column_name='symbol'
      ) THEN
        ALTER TABLE signals DROP COLUMN symbol;
      END IF;
    END
    $$;
  `);
}

export async function ensureCointarsTable() {
  // 1) cria tabela cointars se não existir
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cointars (
      id SERIAL PRIMARY KEY
    );
  `);

  // 2) adiciona colunas btc_dom, eth_dom e timestamp, se faltarem
  await pool.query(`
    ALTER TABLE cointars
      ADD COLUMN IF NOT EXISTS btc_dom   NUMERIC     NOT NULL,
      ADD COLUMN IF NOT EXISTS eth_dom   NUMERIC     NOT NULL,
      ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ NOT NULL DEFAULT now();
  `);
}

export async function ensurePositionsTable() {
  // adapte aqui os campos existentes de positions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS positions (
      id SERIAL PRIMARY KEY
      -- coloque aqui os demais campos de positions,
      -- por exemplo: ,user_id INT NOT NULL, symbol TEXT NOT NULL, ...
    );
  `);
}

export async function ensureIndicatorsTable() {
  // adapte aqui os campos existentes de indicators
  await pool.query(`
    CREATE TABLE IF NOT EXISTS indicators (
      id SERIAL PRIMARY KEY
      -- coloque aqui os demais campos de indicators,
      -- por exemplo: ,symbol TEXT NOT NULL, timeframe TEXT NOT NULL, ...
    );
  `);
}
