import { db } from '../../common/db.js';

export async function listCredentials(req, res) {
  const creds = await db('api_credentials').where('user_id', req.params.userId);
  res.json(creds);
}

export async function createCredential(req, res) {
  const [c] = await db('api_credentials')
    .insert({ user_id: req.params.userId, ...req.body })
    .returning('*');
  res.status(201).json(c);
}

export async function deleteCredential(req, res) {
  await db('api_credentials').where('id', req.params.id).del();
  res.json({ ok: true });
}
