const db = require('../../common/db');

async function listEventLogs(_req, res) {
  const logs = await db.query('SELECT * FROM event_logs ORDER BY timestamp DESC LIMIT 100');
  res.json(logs);
}

async function listAiLogs(_req, res) {
  const logs = await db.query('SELECT * FROM ai_logs ORDER BY timestamp DESC LIMIT 100');
  res.json(logs);
}

module.exports = {
  listEventLogs,
  listAiLogs
};
