const db = require('../../common/db');

async function listIaLogs(req, res) {
  try {
    let query = 'SELECT * FROM ai_logs';
    let params = [];
    
    if (req.query.level) {
      query += ' WHERE level = $1';
      params.push(req.query.level);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT 100';
    
    const logs = await db.query(query, params);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching IA logs:', error);
    res.status(500).json({ error: 'Failed to fetch IA logs' });
  }
}

module.exports = {
  listIaLogs
};
