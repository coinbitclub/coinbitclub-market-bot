// src/routes/botRoutes.js
import express from 'express';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import { startBot, stopBot, getBotStatus } from '../services/operationService.js';

const router = express.Router();

// POST /bot/start
router.post('/start', jwtMiddleware, async (req, res, next) => {
  try {
    // passa apenas o user_id para o serviço
    const result = await startBot(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /bot/stop
router.post('/stop', jwtMiddleware, async (req, res, next) => {
  try {
    const result = await stopBot(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /bot/status
router.get('/status', jwtMiddleware, async (req, res, next) => {
  try {
    const status = await getBotStatus(req.user.id);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

export default router;
