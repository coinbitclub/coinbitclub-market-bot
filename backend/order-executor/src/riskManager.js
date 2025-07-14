import { db } from '../../common/db.js';

export async function validateBalance(userId, min = 60) {
  const uf = await db('user_financial').where('user_id', userId).first();
  return uf && uf.balance >= min;
}

export async function validateConcurrentOps(userId, max = 2) {
  const result = await db('user_financial')
    .where({ user_id: userId, closed: false })
    .count('* as cnt')
    .first();
  return Number(result?.cnt || 0) < max;
}

export function calculateQuantity(balance, pct = 0.3) {
  return balance * pct;
}
