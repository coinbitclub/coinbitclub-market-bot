const db = require('../../common/db');

async function setAffiliate(req, res) {
  try {
    await db.query(
      'INSERT INTO affiliates (user_id, affiliate_id) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET affiliate_id = $2',
      [req.body.userId, req.params.id]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Error setting affiliate:', error);
    res.status(500).json({ error: 'Failed to set affiliate' });
  }
}

async function listCommissions(req, res) {
  try {
    const rows = await db.query(
      'SELECT * FROM affiliate_commissions WHERE affiliate_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error listing commissions:', error);
    res.status(500).json({ error: 'Failed to list commissions' });
  }
}

module.exports = {
  setAffiliate,
  listCommissions
};
