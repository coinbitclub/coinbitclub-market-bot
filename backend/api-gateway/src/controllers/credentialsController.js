import express from 'express';
import { db } from '../../../common/db.js';
import { validate, credentialSchema } from '../../../common/validation.js';

const router = express.Router();

router.post('/', async (req, res) => {
  let data;
  try {
    data = validate(credentialSchema, req.body);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  await db('user_credentials').insert({ user_id: data.userId, ...data });
  res.status(201).end();
});

router.get('/:userId', async (req, res) => {
  const creds = await db('user_credentials').where('user_id', req.params.userId);
  res.json(creds);
});

export default router;
