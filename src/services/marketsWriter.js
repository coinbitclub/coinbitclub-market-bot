/* src/services/marketsWriter.js */
import db from '../db.js';

export async function saveMarkets(markets) {
  for (const m of markets) {
    await db.query(
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




