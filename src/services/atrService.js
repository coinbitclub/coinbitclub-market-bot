import { query } from '../db.js';

export async function getMovingAverageATR(windowSize = 7) {
  const sql = `
    SELECT AVG(atr_30) as moving_average_atr
    FROM (
      SELECT atr_30
      FROM signals
      ORDER BY time DESC
      LIMIT $1
    ) sub;
  `;

  const result = await query(sql, [windowSize]);
  return result[0]?.moving_average_atr || null;
}




