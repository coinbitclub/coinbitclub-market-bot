import { db } from '../../common/db.js';

export async function recordExecution(exec) {
  await db('user_financial').insert({ user_id: exec.userId, profit_loss: exec.pl, timestamp: new Date() });
}
