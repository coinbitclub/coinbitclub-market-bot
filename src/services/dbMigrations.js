/**
 * ATENÇÃO/LEMBRETE DE USO:
 *
 * Importe todas as funções ensure* deste arquivo no seu src/index.js e chame todas (em ordem) antes de subir o servidor.
 * Exemplo:
 *
 * import {
 *   ensureSignalsTable,
 *   ensureDominanceTable,
 *   ensureFearGreedTable,
 *   ensureMarketTable,
 *   ensureUsersTable,
 *   ensureUserCredentialsTable,
 *   ensureUserSubscriptionsTable,
 *   ensureTradesTable,
 *   ensureIntegrationsTable,
 *   ensureAffiliatesTable,
 *   ensureNotificationsTable,
 *   ensureBotLogsTable,
 *   ensureOpenTradesTable,
 *   ensurePositionsTable,
 *   ensureIndicatorsTable
 * } from './services/dbMigrations.js';
 *
 * await ensureSignalsTable();
 * await ensureDominanceTable();
 * await ensureFearGreedTable();
 * await ensureMarketTable();
 * await ensureUsersTable();
 * await ensureUserCredentialsTable();
 * await ensureUserSubscriptionsTable();
 * await ensureTradesTable();
 * await ensureIntegrationsTable();
 * await ensureAffiliatesTable();
 * await ensureNotificationsTable();
 * await ensureBotLogsTable();
 * await ensureOpenTradesTable();
 * await ensurePositionsTable();
 * await ensureIndicatorsTable();
 */

import { pool } from '../database.js';



export async function ensureSignalsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS signals (
        id            SERIAL       PRIMARY KEY,
        ticker        VARCHAR(24)  NOT NULL,
        price         NUMERIC,
        close         NUMERIC,
        ema9_30       NUMERIC,
        rsi_4h        NUMERIC,
        rsi_15        NUMERIC,
        momentum_15   NUMERIC,
        atr_30        NUMERIC,
        atr_pct_30    NUMERIC,
        vol_30        NUMERIC,
        vol_ma_30     NUMERIC,
        diff_btc_ema7 NUMERIC,
        leverage      NUMERIC,
        signal_json   JSONB        NOT NULL,
        time          TIMESTAMP    NOT NULL DEFAULT NOW(),
        user_id       VARCHAR(128),
        created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
      );
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
        id          SERIAL    PRIMARY KEY,
        btc_dom     NUMERIC,
        eth_dom     NUMERIC,
        captured_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
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
        id                   SERIAL    PRIMARY KEY,
        value                NUMERIC,
        index_value          INTEGER,
        value_classification VARCHAR(32),
        captured_at          TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Tabela fear_greed verificada/ajustada!');
  } catch (err) {
    console.error('Erro na migration fear_greed:', err);
    throw err;
  }
}

export async function ensureMarketTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS market (
        id          SERIAL    PRIMARY KEY,
        symbol      VARCHAR(24) NOT NULL,
        price       NUMERIC    NOT NULL,
        "timestamp" TIMESTAMP  NOT NULL,
        captured_at TIMESTAMP  NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Tabela market verificada/ajustada!');
  } catch (err) {
    console.error('Erro na migration market:', err);
    throw err;
  }
}

/**
 * NOVAS TABELAS (usuários, admin, bot, integração, trades, etc)
 */

export async function ensureUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(60),
      sobrenome VARCHAR(80),
      email VARCHAR(120) UNIQUE NOT NULL,
      telefone VARCHAR(24),
      password_hash VARCHAR(200) NOT NULL,
      role VARCHAR(20) DEFAULT 'user',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('Tabela users verificada/ajustada!');
}

export async function ensureUserCredentialsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_credentials (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      exchange VARCHAR(20) NOT NULL,
      api_key VARCHAR(120),
      api_secret VARCHAR(120),
      settings JSONB DEFAULT '{}',
      status VARCHAR(20) DEFAULT 'ativo'
    );
  `);
  console.log('Tabela user_credentials verificada/ajustada!');
}

export async function ensureUserSubscriptionsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      plano VARCHAR(60) NOT NULL,
      status VARCHAR(20) NOT NULL,
      data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      data_fim TIMESTAMP WITH TIME ZONE,
      valor_pago NUMERIC(14,2),
      metodo VARCHAR(30)
    );
  `);
  console.log('Tabela user_subscriptions verificada/ajustada!');
}

export async function ensureTradesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      ticker VARCHAR(30),
      side VARCHAR(8),
      entry_price NUMERIC(14,6),
      exit_price NUMERIC(14,6),
      profit NUMERIC(14,6),
      executed_at TIMESTAMP WITH TIME ZONE,
      status VARCHAR(20),
      assertiveness NUMERIC(5,2),
      rational TEXT
    );
  `);
  console.log('Tabela trades verificada/ajustada!');
}

export async function ensureIntegrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS integrations (
      id SERIAL PRIMARY KEY,
      tipo VARCHAR(30) NOT NULL,
      credenciais JSONB,
      status VARCHAR(20),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('Tabela integrations verificada/ajustada!');
}

export async function ensureAffiliatesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS affiliates (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      link VARCHAR(200),
      indicacoes INTEGER DEFAULT 0,
      comissao_pendente NUMERIC(14,2) DEFAULT 0
    );
  `);
  console.log('Tabela affiliates verificada/ajustada!');
}

export async function ensureNotificationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      mensagem VARCHAR(200),
      lida BOOLEAN DEFAULT FALSE,
      data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('Tabela notifications verificada/ajustada!');
}

export async function ensureBotLogsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bot_logs (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      severity VARCHAR(12),
      message TEXT,
      context JSONB
    );
  `);
  console.log('Tabela bot_logs verificada/ajustada!');
}

export async function ensureOpenTradesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS open_trades (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      symbol VARCHAR(30),
      side VARCHAR(8),
      qty NUMERIC(14,6),
      entry_price NUMERIC(14,6),
      status VARCHAR(20),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('Tabela open_trades verificada/ajustada!');
}

export async function ensurePositionsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS positions (
      id SERIAL PRIMARY KEY,
      symbol VARCHAR(30),
      side VARCHAR(8),
      qty NUMERIC(14,6),
      entry_price NUMERIC(14,6),
      status VARCHAR(20),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('Tabela positions verificada/ajustada!');
}

export async function ensureIndicatorsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS indicators (
      id SERIAL PRIMARY KEY,
      ema9 NUMERIC,
      rsi4h NUMERIC,
      rsi15m NUMERIC,
      momentum NUMERIC,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('Tabela indicators verificada/ajustada!');
}
