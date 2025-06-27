import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', err => {
  console.error('❌ Erro inesperado no pool Postgres:', err);
  process.exit(-1);
});

export { pool };
