import express from 'express';
import { createBybitClientForUser } from '../services/exchangeService.js';

const router = express.Router();

router.post('/order', async (req, res, next) => {
  try {
    const userId = req.user.id; // obtido do auth middleware
    const client = await createBybitClientForUser(userId);
    const order = await client.placeOrder({ /* ...dados da ordem... */ });
    res.json(order);
  } catch (err) { next(err); }
});

export default router;
