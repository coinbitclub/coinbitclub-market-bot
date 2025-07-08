import express from 'express';
import { parseMarket } from '../parseMarket.js';
import { saveMarket } from '../services/marketService.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const m = parseMarket(req.body);
    await saveMarket(m);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

export default router;
