import express from 'express';
import { db } from '../../../common/db.js';

const router = express.Router();

router.get('/balance/:userId', async (req, res) => {
  const row = await db('user_financial').where('user_id', req.params.userId).first();
  res.json(row || {});
});

router.get('/performance/:userId', async (req, res) => {
  const records = await db('user_financial').where('user_id', req.params.userId);
  res.json(records);
});

export default router;
