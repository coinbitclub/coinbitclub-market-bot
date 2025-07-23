const db = require('../../common/db');

async function listCredentials(req, res) {
  const creds = await db.query('SELECT * FROM credentials WHERE user_id = $1', [req.params.userId]);
  res.json(creds);
}

async function createCredential(req, res) {
  const { exchange, api_key, api_secret, is_testnet } = req.body;
  const result = await db.query(
    'INSERT INTO credentials (user_id, exchange, api_key, api_secret, is_testnet) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [req.params.userId, exchange, api_key, api_secret, is_testnet || false]
  );
  res.status(201).json(result[0]);
}

async function deleteCredential(req, res) {
  await db.query('DELETE FROM credentials WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}

module.exports = {
  listCredentials,
  createCredential,
  deleteCredential
};
