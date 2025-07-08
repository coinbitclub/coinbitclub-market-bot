import pool from './databaseService.js';

export async function deleteOldData() {
  // Apaga dados do mercado com mais de 72h
  await pool.query('DELETE FROM market WHERE captured_at < NOW() - INTERVAL \'72 hours\'');
  await pool.query('DELETE FROM dominance WHERE created_at < NOW() - INTERVAL \'72 hours\'');
  await pool.query('DELETE FROM fear_greed WHERE created_at < NOW() - INTERVAL \'72 hours\'');
  console.log('Dados antigos apagados do banco.');
}




