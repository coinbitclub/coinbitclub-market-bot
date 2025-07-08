import pool from './databaseService.js';

export async function createDailySnapshot() {
  // Copia últimos dados para tabelas diárias (crie as tabelas daily se não existirem)
  // Exemplo para mercado:
  await pool.query(`
    INSERT INTO market_daily (symbol, price, timestamp, captured_at)
    SELECT symbol, price, timestamp, NOW()
    FROM market
    WHERE captured_at >= CURRENT_DATE
  `);

  await pool.query(`
    INSERT INTO dominance_daily (btc_dom, eth_dom, created_at)
    SELECT btc_dom, eth_dom, NOW()
    FROM dominance
    WHERE created_at >= CURRENT_DATE
  `);

  await pool.query(`
    INSERT INTO fear_greed_daily (value, timestamp, created_at)
    SELECT value, timestamp, NOW()
    FROM fear_greed
    WHERE created_at >= CURRENT_DATE
  `);

  console.log('Snapshot diário criado.');
}




