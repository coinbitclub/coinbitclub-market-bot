// src/database.js
import pg from 'pg';
const { Pool } = pg;

// Configuração base do pool
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
};

// Se você definir PGSSLMODE=require no ambiente (ex: Railway), habilita SSL/TLS
if (process.env.PGSSLMODE === 'require') {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

// Exporta o pool para ser usado em todo o app
export const pool = new Pool(poolConfig);

// Optional: captura erros não tratados no pool
pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool de conexões do PostgreSQL', err);
  process.exit(-1);
});
