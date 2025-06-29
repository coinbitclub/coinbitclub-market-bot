// src/services/dbMigrations.js
import { pool } from '../database.js';

/**
 * Garante existência da tabela signals
 */
export async function ensureSignalsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS signals (
        id SERIAL PRIMARY KEY,
        ticker VARCHAR(24) NOT NULL,
        price NUMERIC,
        close NUMERIC,
        ema9_30 NUMERIC,
        rsi_4h NUMERIC,
        rsi_15 NUMERIC,
        momentum_15 NUMERIC,
        atr_30 NUMERIC,
        atr_pct_30 NUMERIC,
        vol_30 NUMERIC,
        vol_ma_30 NUMERIC,
        diff_btc_ema7 NUMERIC,
        leverage NUMERIC,
        signal_time TIMESTAMP,
        signal_json JSONB,
        time TIMESTAMP DEFAULT NOW(),
        user_id VARCHAR(128),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Tabela signals verificada/ajustada!');
  } catch (err) {
    console.error('Erro na migration signals:', err);
    throw err;
  }
}

/**
 * Garante existência da tabela btc_dominance
 */
export async function ensureDominanceTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS btc_dominance (
        id SERIAL PRIMARY KEY,
        btc_dom NUMERIC,
        eth_dom NUMERIC,
        captured_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Tabela btc_dominance verificada/ajustada!');
  } catch (err) {
    console.error('Erro na migration dominance:', err);
    throw err;
  }
}

/**
 * Garante existência da tabela fear_greed
 */
export async function ensureFearGreedTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fear_greed (
        id SERIAL PRIMARY KEY,
        value NUMERIC,
        index_value INTEGER,
        value_classification VARCHAR(32),
        captured_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Tabela fear_greed verificada/ajustada!');
  } catch (err) {
    console.error('Erro na migration fear_greed:', err);
    throw err;
  }
}

/**
 * Garante existência da tabela market
 */
export async function ensureMarketTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS market (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(24) NOT NULL,
        price NUMERIC NOT NULL,
        "timestamp" TIMESTAMP NOT NULL,
        captured_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Tabela market verificada/ajustada!');
  } catch (err) {
    console.error('Erro na migration market:', err);
    throw err;
  }
}
