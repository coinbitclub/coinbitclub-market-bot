import express from 'express';
import { db } from '../../../common/db.js';
import { validate, planSchema } from '../../../common/validation.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  const plans = await db('plans');
  res.json(plans);
});

router.post('/', async (req, res) => {
  let data;
  try {
    data = validate(planSchema, req.body);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  const [plan] = await db('plans').insert(data).returning('*');
  res.status(201).json(plan);
});

export default router;
