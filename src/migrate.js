// src/migrate.js
import dotenv from 'dotenv';
import { pool } from './database.js';

dotenv.config();

async function migrate() {
  console.log('â–¶ï¸  Iniciando migraÃ§Ã£o de banco...');
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
  console.log('âœ… Tabela signals criada (ou jÃ¡ existia).');
  process.exit(0);
}

migrate().catch(err => {
  console.error('âŒ Erro ao migrar:', err);
  process.exit(1);
});
