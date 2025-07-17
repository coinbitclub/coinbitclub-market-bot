import { db } from '../../common/db.js';

export async function listEventLogs(_req, res) {
  const logs = await db('event_logs').orderBy('timestamp', 'desc').limit(100);
  res.json(logs);
}

export async function listAiLogs(_req, res) {
  const logs = await db('ai_logs').orderBy('timestamp', 'desc').limit(100);
  res.json(logs);
}
