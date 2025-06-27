import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  saveSignal,
  fetchAndSaveDominance,
  fetchAndSaveFearGreed,
  fetchAndSaveMarket
} from '../services/fetchAndSaveData.js';

const router = express.Router();

// Helper para evitar duplicação
const handle = fn => async (req, res, next) => {
  try {
    await fn(req.body);
    return res.sendStatus(204);
  } catch (err) {
    return next(err);
  }
};

// Webhooks protegidos por token
router.post('/signal',    verifyToken, handle(saveSignal));
router.post('/dominance', verifyToken, handle(fetchAndSaveDominance));
router.post('/fear_greed',verifyToken, handle(fetchAndSaveFearGreed));
router.post('/market',    verifyToken, handle(fetchAndSaveMarket));

export default router;
