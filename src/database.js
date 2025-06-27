import pg from 'pg';
const { Pool } = pg;

// Garante uso de SSL se URL pedir (e força disable do "verify" para Railway)
const shouldUseSSL =
  process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.includes('sslmode=require') || process.env.DATABASE_URL.includes('railway'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: shouldUseSSL ? { rejectUnauthorized: false } : false,  // false, não undefined!
});

pool.on('error', err => {
  console.error('❌ Erro inesperado no pool Postgres:', err);
  process.exit(-1);
});

export { pool };
