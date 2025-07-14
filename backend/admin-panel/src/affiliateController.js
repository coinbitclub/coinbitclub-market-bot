import { db } from '../../common/db.js';

export async function setAffiliate(req, res) {
  await db('affiliates')
    .insert({ user_id: req.body.userId, affiliate_id: req.params.id })
    .onConflict(['user_id'])
    .merge();
  res.json({ ok: true });
}

export async function listCommissions(req, res) {
  const rows = await db('affiliate_commissions')
    .where('affiliate_id', req.params.id)
    .orderBy('timestamp', 'desc');
  res.json(rows);
}
