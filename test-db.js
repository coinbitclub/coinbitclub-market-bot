import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erro:', err);
  } else {
    console.log('Conexão ok:', res.rows);
  }
  pool.end();
});




