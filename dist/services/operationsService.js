"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getOperationsByUser = getOperationsByUser;
exports.saveOperation = saveOperation;
var _databaseService = require("./databaseService.js");
// src/services/operationsService.js

async function saveOperation({
  user_id,
  exchange,
  operation_type,
  symbol,
  order_id,
  qty,
  price,
  leverage,
  pnl,
  status,
  opened_at,
  closed_at
}) {
  const query = `
    INSERT INTO operations (
      user_id, exchange, operation_type, symbol, order_id,
      qty, price, leverage, pnl, status, opened_at, closed_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING id;
  `;
  const params = [user_id, exchange, operation_type, symbol, order_id, qty, price, leverage, pnl, status, opened_at, closed_at];
  return await (0, _databaseService.executeQuery)(query, params);
}
async function getOperationsByUser(user_id, limit = 50) {
  const query = `
    SELECT * FROM operations WHERE user_id = $1 ORDER BY opened_at DESC LIMIT $2;
  `;
  return await (0, _databaseService.executeQuery)(query, [user_id, limit]);
}