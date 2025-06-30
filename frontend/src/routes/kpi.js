import express from 'express';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  // Simula busca dos KPIs principais
  res.json({
    users: 74,
    open: 2,
    accuracy: 85,
    day_return: 12,
    total_return: 67
  });
});

export default router;
