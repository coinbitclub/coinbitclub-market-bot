import { query } from '../db.js';

/**
 * Salva um registro de dominância.
 * Aceita payload com { btc_dom, eth_dom?, timestamp } ou { dominance, eth_dom?, timestamp }.
 */
export async function saveDominance(data) {
  // Permitir tanto data.btc_dom quanto data.dominance
  const btc_dom = data.btc_dom ?? data.dominance;
  const { eth_dom = null, timestamp } = data;

  if (!timestamp) {
    throw new Error('Campo "timestamp" é obrigatório para saveDominance');
  }

  let sql, params;

  if (eth_dom !== null && eth_dom !== undefined) {
    sql = `
      INSERT INTO dominance (
        btc_dom,
        eth_dom,
        timestamp,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, NOW(), NOW())
    `;
    params = [btc_dom, eth_dom, timestamp];
  } else {
    sql = `
      INSERT INTO dominance (
        btc_dom,
        timestamp,
        created_at,
        updated_at
      )
      VALUES ($1, $2, NOW(), NOW())
    `;
    params = [btc_dom, timestamp];
  }

  return query(sql, params);
}

/**
 * Retorna a diferença percentual entre o último valor de fechamento e sua EMA7.
 * Se não houver dados, ou em caso de erro, retorna zero.
 */
export async function getBtcDominanceDiff() {
  try {
    const rows = await query(`
      SELECT close, ema7
        FROM dominance
       ORDER BY timestamp DESC
       LIMIT 1
    `);

    if (!rows.length) return 0;

    const closeVal = parseFloat(rows[0].close);
    const ema7Val  = parseFloat(rows[0].ema7);

    if (isNaN(closeVal) || isNaN(ema7Val) || ema7Val === 0) {
      return 0;
    }

    return ((closeVal - ema7Val) / ema7Val) * 100;
  } catch (err) {
    console.error('Erro em getBtcDominanceDiff:', err);
    return 0;
  }
}
