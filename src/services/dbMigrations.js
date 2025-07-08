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
  // 1) cria tabela positions se não existir
  await pool.query(`
    CREATE TABLE IF NOT EXISTS positions (
      id SERIAL PRIMARY KEY
    );
  `);

  // 2) adiciona colunas necessárias, se faltarem
  await pool.query(`
    ALTER TABLE positions
      ADD COLUMN IF NOT EXISTS symbol       TEXT        NOT NULL,
      ADD COLUMN IF NOT EXISTS side         TEXT        NOT NULL,
      ADD COLUMN IF NOT EXISTS qty          NUMERIC     NOT NULL,
      ADD COLUMN IF NOT EXISTS entry_price  NUMERIC     NOT NULL,
      ADD COLUMN IF NOT EXISTS status       TEXT        NOT NULL DEFAULT 'open',
      ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      ADD COLUMN IF NOT EXISTS user_id      INTEGER,
      ADD COLUMN IF NOT EXISTS exit_price   NUMERIC,
      ADD COLUMN IF NOT EXISTS closed_at    TIMESTAMPTZ;
  `);

  // 3) constraint FK para user_id, se ainda não existir
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
          FROM information_schema.table_constraints
         WHERE table_name='positions'
           AND constraint_type='FOREIGN KEY'
           AND constraint_name='positions_user_id_fkey'
      ) THEN
        ALTER TABLE positions
          ADD CONSTRAINT positions_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE SET NULL;
      END IF;
    END
    $$;
  `);
}

export async function ensureIndicatorsTable() {
  // 1) cria tabela indicators se não existir
  await pool.query(`
    CREATE TABLE IF NOT EXISTS indicators (
      id SERIAL PRIMARY KEY
    );
  `);

  // 2) adiciona colunas para EMA, RSI e Momentum, se faltarem
  await pool.query(`
    ALTER TABLE indicators
      ADD COLUMN IF NOT EXISTS symbol     TEXT        NOT NULL,
      ADD COLUMN IF NOT EXISTS timeframe  TEXT        NOT NULL,
      ADD COLUMN IF NOT EXISTS ema9       NUMERIC,
      ADD COLUMN IF NOT EXISTS rsi4h      NUMERIC,
      ADD COLUMN IF NOT EXISTS rsi15m     NUMERIC,
      ADD COLUMN IF NOT EXISTS momentum   NUMERIC,
      ADD COLUMN IF NOT EXISTS timestamp  TIMESTAMPTZ NOT NULL DEFAULT now();
  `);
}
