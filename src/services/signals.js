import express from 'express';
import { saveSignal } from '../services/signalService.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    await saveSignal(req.userId, req.body);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

export default router;
