import { db } from '../../common/db.js';

export async function listUsers(_req, res) {
  const users = await db('users');
  res.json(users);
}

export async function suspendUser(req, res) {
  await db('users').where('id', req.params.id).update({ status: 'inactive' });
  res.json({ ok: true });
}

export async function reactivateUser(req, res) {
  await db('users').where('id', req.params.id).update({ status: 'active' });
  res.json({ ok: true });
}

export async function assignAffiliate(req, res) {
  await db('affiliates').insert({ user_id: req.params.id, affiliate_id: req.body.affiliateId });
  res.json({ ok: true });
}
