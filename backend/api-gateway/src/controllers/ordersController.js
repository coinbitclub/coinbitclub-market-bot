import express from 'express';
import { db } from '../../../common/db.js';

const router = express.Router();

router.get('/:userId', async (req, res) => {
  const orders = await db('orders')
    .where({ user_id: req.params.userId })
    .orderBy('created_at', 'desc');
  res.json(orders);
});

export default router;
