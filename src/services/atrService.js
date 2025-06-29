import { pool } from '../database.js';

// Calcula média móvel do ATR-30 das últimas N candles
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

  const { rows } = await pool.query(sql, [windowSize]);
  return rows[0]?.moving_average_atr || null;
}
