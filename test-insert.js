// test-insert.js
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,  // Use sua variável de ambiente corretamente configurada
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

(async () => {
  try {
    const value = 99;
    const value_classification = 'NODE_TESTE';
    const captured_at = new Date().toISOString();

    const sql = `
      INSERT INTO public.fear_greed (value, value_classification, captured_at, created_at)
      VALUES ($1, $2, $3, NOW())
    `;

    console.log('Executando query:');
    console.log(sql);
    console.log('Com parâmetros:', [value, value_classification, captured_at]);

    const res = await pool.query(sql, [value, value_classification, captured_at]);
    console.log('Insert OK:', res.rowCount);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Erro na inserção:', error);
    process.exit(1);
  }
})();
