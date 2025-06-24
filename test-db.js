import { query } from './src/services/databaseService.js';

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
    console.log(sql.trim());
    console.log('Com parâmetros:', [value, value_classification, captured_at]);

    const res = await query(sql, [value, value_classification, captured_at]);

    console.log('Insert OK:', res.rowCount);
    process.exit(0);
  } catch (err) {
    console.error('Erro Insert:', err);
    process.exit(1);
  }
})();
