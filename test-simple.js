import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

(async () => {
  try {
    const value = 99;
    const value_classification = 'NODE_TESTE';
    const captured_at = new Date().toISOString();

    // Apenas para debug: montar a query manualmente (não use assim em produção)
    const queryText = `INSERT INTO public.fear_greed (value, value_classification, captured_at, created_at) VALUES (${value}, '${value_classification}', '${captured_at}', NOW())`;
    console.log('Query com valores inline para debug:', queryText);

    // Executa a query com parâmetros
    const sql = 'INSERT INTO public.fear_greed (value, value_classification, captured_at, created_at) VALUES ($1, $2, $3, NOW())';
    const res = await pool.query(sql, [value, value_classification, captured_at]);

    console.log('Insert OK:', res.rowCount);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Erro Insert:', err);
    process.exit(1);
  }
})();




