import pg from 'pg';
const { Pool } = pg;

// Usa SSL só quando necessário
const useSSL =
  process.env.DATABASE_SSL === 'true' ||
  process.env.PGSSLMODE === 'require' ||
  process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', err => {
  console.error('❌ Erro inesperado no pool Postgres:', err);
  process.exit(-1);
});

export { pool };
