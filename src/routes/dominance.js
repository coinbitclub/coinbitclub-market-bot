import express from 'express';
import { parseDominance } from '../parseDominance.js';
import { saveDominance } from '../services/dominanceService.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const dom = parseDominance(req.body);
    await saveDominance(dom);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

export default router;
