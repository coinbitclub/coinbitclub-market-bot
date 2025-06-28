// src/services/operationsService.js
import { executeQuery } from './databaseService.js';

export async function saveOperation({
  user_id, exchange, operation_type, symbol, order_id,
  qty, price, leverage, pnl, status, opened_at, closed_at
}) {
  const query = `
    INSERT INTO operations (
      user_id, exchange, operation_type, symbol, order_id,
      qty, price, leverage, pnl, status, opened_at, closed_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING id;
  `;
  const params = [
    user_id, exchange, operation_type, symbol, order_id,
    qty, price, leverage, pnl, status, opened_at, closed_at
  ];
  return await executeQuery(query, params);
}

export async function getOperationsByUser(user_id, limit = 50) {
  const query = `
    SELECT * FROM operations WHERE user_id = $1 ORDER BY opened_at DESC LIMIT $2;
  `;
  return await executeQuery(query, [user_id, limit]);
}




