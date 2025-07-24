import dotenv from 'dotenv';
import pkg from 'pg';
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function showTableStructure(table) {
  try {
    const result = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [table]);
    console.log(`Estrutura da tabela ${table}:`);
    result.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
  } catch (err) {
    console.error('Erro ao buscar estrutura:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

showTableStructure('users');
