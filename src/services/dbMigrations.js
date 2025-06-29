// src/services/dbMigrations.js
import { pool } from '../database.js';

export async function ensureSignalsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS signals (
        id SERIAL PRIMARY KEY,
        ticker VARCHAR(24) NOT NULL,
        price NUMERIC NOT NULL,
        signal_json JSONB NOT NULL,
        time TIMESTAMP NOT NULL DEFAULT NOW(),
        user_id VARCHAR(128),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Tabela signals verificada/ajustada!');
  } catch (err) {
    console.error('Erro na migration signals:', err);
    throw err;
  }
}

export async function ensureDominanceTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS btc_dominance (
        id SERIAL PRIMARY KEY,
        btc_dom NUMERIC,
        eth_dom NUMERIC,
        captured_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Tabela btc_dominance verificada/ajustada!');
  } catch (err) {
    console.error('Erro na migration dominance:', err);
    throw err;
  }
}

export async function ensureFearGreedTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fear_greed (
        id SERIAL PRIMARY KEY,
        value NUMERIC,
        index_value INTEGER,
        value_classification VARCHAR(32),
        captured_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Tabela fear_greed verificada/ajustada!');
  } catch (err) {
    console.error('Erro na migration fear_greed:', err);
    throw err;
  }
}
