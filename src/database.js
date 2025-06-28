import pg from 'pg';
const { Pool } = pg;

console.log('DATABASE_URL:', process.env.DATABASE_URL); // Ajuda a debug

const isRailway = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRailway ? { rejectUnauthorized: false } : false
});

pool.on('error', err => {
  console.error('âŒ Erro inesperado no pool Postgres:', err);
  process.exit(-1);
});

export { pool };
