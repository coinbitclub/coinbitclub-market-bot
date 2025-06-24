import { query } from '../db.js';
// import { logger } from '../logger.js'; // Descomente se usar logging

export async function getBtcDominanceDiff() {
  try {
    const rows = await query(`
      SELECT close, ema7
        FROM dominance
       ORDER BY timestamp DESC
       LIMIT 1
    `);

    if (rows.length === 0) {
      // logger.warn('dominanceService: Nenhum registro encontrado em dominance.');
      return 0;
    }

    const closeVal = parseFloat(rows[0].close);
    const ema7Val  = parseFloat(rows[0].ema7);

    if (isNaN(closeVal) || isNaN(ema7Val) || ema7Val === 0) {
      // logger.warn('dominanceService: close ou ema7 inválidos:', { closeVal, ema7Val });
      return 0;
    }

    return ((closeVal - ema7Val) / ema7Val) * 100;
  } catch (err) {
    // logger.error('dominanceService: erro ao calcular diff:', err);
    return 0;
  }
}
