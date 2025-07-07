import { pool } from './db.js';

export async function ensureSignalsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS signals (
      id           SERIAL      PRIMARY KEY,
      symbol       TEXT        NOT NULL,
      price        NUMERIC     NOT NULL,
      side         TEXT        NOT NULL,
      received_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

export async function ensureCointarsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cointars (
      id        SERIAL      PRIMARY KEY,
      btc_dom   NUMERIC     NOT NULL,
      eth_dom   NUMERIC     NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL
    );
  `);
}

export async function ensurePositionsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS positions (
      /* … sua definição existente … */
    );
  `);
}

export async function ensureIndicatorsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS indicators (
      /* … sua definição existente … */
    );
  `);
}
