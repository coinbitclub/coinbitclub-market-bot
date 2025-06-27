import pg from 'pg';
const { Pool } = pg;

const shouldUseSSL =
  process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: shouldUseSSL ? { rejectUnauthorized: false } : undefined,
});


pool.on('error', err => {
  console.error('❌ Erro inesperado no pool Postgres:', err);
  process.exit(-1);
});

export { pool };
