import express from 'express';
import { db } from '../../../common/db.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  const plans = await db('plans');
  res.json(plans);
});

router.post('/', async (req, res) => {
  const [plan] = await db('plans').insert(req.body).returning('*');
  res.status(201).json(plan);
});

export default router;
