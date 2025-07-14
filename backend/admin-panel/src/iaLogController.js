import { db } from '../../common/db.js';

export async function listIaLogs(req, res) {
  const logs = await db('ai_logs')
    .modify((qb) => {
      if (req.query.level) qb.where('level', req.query.level);
    })
    .orderBy('timestamp', 'desc')
    .limit(100);
  res.json(logs);
}
