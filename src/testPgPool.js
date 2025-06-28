import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

pool.query('SELECT NOW()')
  .then(res => {
    console.log('PG CONNECTED:', res.rows[0]);
    process.exit(0);
  })
  .catch(err => {
    console.error('PG ERROR:', err);
    process.exit(1);
  });




