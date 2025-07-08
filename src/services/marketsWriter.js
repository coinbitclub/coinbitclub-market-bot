import { pool } from '../database.js';

/**
 * Salva (ou atualiza) mercado no banco de dados.
 * Recebe array de mercados [{ symbol, price, change, volume }]
 */
export async function saveMarkets(markets) {
  for (const m of markets) {
    await pool.query(
      `INSERT INTO markets (symbol, price, change, volume)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (symbol) DO UPDATE
         SET price  = EXCLUDED.price,
             change = EXCLUDED.change,
             volume = EXCLUDED.volume`,
      [m.symbol, m.price, m.change, m.volume]
    );
  }
}
