const db = require('../../common/db');

async function listUsers(_req, res) {
  const users = await db.query('SELECT * FROM users');
  res.json(users);
}

async function suspendUser(req, res) {
  await db.query('UPDATE users SET status = $1 WHERE id = $2', ['inactive', req.params.id]);
  res.json({ ok: true });
}

async function reactivateUser(req, res) {
  await db.query('UPDATE users SET status = $1 WHERE id = $2', ['active', req.params.id]);
  res.json({ ok: true });
}

async function assignAffiliate(req, res) {
  await db.query('INSERT INTO affiliates (user_id, affiliate_id) VALUES ($1, $2)', [req.params.id, req.body.affiliateId]);
  res.json({ ok: true });
}

module.exports = {
  listUsers,
  suspendUser,
  reactivateUser,
  assignAffiliate
};
