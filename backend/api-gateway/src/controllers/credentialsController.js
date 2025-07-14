import express from 'express';
import { db } from '../../../common/db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  await db('user_credentials').insert({ user_id: req.body.userId, ...req.body });
  res.status(201).end();
});

router.get('/:userId', async (req, res) => {
  const creds = await db('user_credentials').where('user_id', req.params.userId);
  res.json(creds);
});

export default router;
