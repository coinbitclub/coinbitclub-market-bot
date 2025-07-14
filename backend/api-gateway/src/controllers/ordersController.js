import express from 'express';
import { db } from '../../../common/db.js';
import { validate, orderQuerySchema } from '../../../common/validation.js';

const router = express.Router();

router.get('/', async (req, res) => {
  let query;
  try {
    query = validate(orderQuerySchema, req.query);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  const { userId, page, limit } = query;
  const orders = await db('orders')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset((page - 1) * limit);
  res.json(orders);
});

export default router;
