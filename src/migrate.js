// src/migrate.js
import dotenv from 'dotenv';
import { pool } from './database.js';

dotenv.config();

async function migrate() {
  console.log('▶️  Iniciando migração de banco...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS signals (
      id          SERIAL PRIMARY KEY,
      ticker      VARCHAR NOT NULL,
      price       NUMERIC,
      payload     JSONB NOT NULL,
      time        TIMESTAMP NOT NULL,
      captured_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela signals criada (ou já existia).');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Erro ao migrar:', err);
  process.exit(1);
});
