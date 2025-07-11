import { pool } from './db.js';

export async function ensureUsersTable() {
  // cria tabela users se não existir
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

export async function ensureOperationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS operations (
      id SERIAL PRIMARY KEY
    );
  `);
  await pool.query(`
    ALTER TABLE operations
      ADD COLUMN IF NOT EXISTS user_id    INTEGER     NOT NULL,
      ADD COLUMN IF NOT EXISTS symbol     TEXT        NOT NULL,
      ADD COLUMN IF NOT EXISTS side       TEXT        NOT NULL,
      ADD COLUMN IF NOT EXISTS price      NUMERIC     NOT NULL,
      ADD COLUMN IF NOT EXISTS quantity   NUMERIC,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  `);
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
          FROM information_schema.table_constraints
         WHERE table_name='operations'
           AND constraint_type='FOREIGN KEY'
           AND constraint_name='operations_user_id_fkey'
      ) THEN
        ALTER TABLE operations
          ADD CONSTRAINT operations_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE;
      END IF;
    END
    $$;
  `);
}

export async function ensureSignalsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS signals (
      id SERIAL PRIMARY KEY
    );
  `);
  await pool.query(`
    ALTER TABLE signals
      ADD COLUMN IF NOT EXISTS ticker       TEXT        NOT NULL,
      ADD COLUMN IF NOT EXISTS price        NUMERIC     NOT NULL,
      ADD COLUMN IF NOT EXISTS side         TEXT        NOT NULL,
      ADD COLUMN IF NOT EXISTS received_at  TIMESTAMPTZ NOT NULL DEFAULT now();
  `);
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cointars (
      id SERIAL PRIMARY KEY
    );
  `);
  await pool.query(`
    ALTER TABLE cointars
      ADD COLUMN IF NOT EXISTS btc_dom   NUMERIC     NOT NULL,
      ADD COLUMN IF NOT EXISTS eth_dom   NUMERIC     NOT NULL,
      ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ NOT NULL DEFAULT now();
  `);
}

export async function ensurePositionsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS positions (
      id SERIAL PRIMARY KEY
    );
  `);
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS indicators (
      id SERIAL PRIMARY KEY
    );
  `);
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
