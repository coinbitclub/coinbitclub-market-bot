import express from 'express';
import { parseFearGreed } from '../parseFearGreed.js';
import { saveFearGreed } from '../services/fearGreedService.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const fg = parseFearGreed(req.body);
    await saveFearGreed(fg);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

export default router;
