// src/routes/apiRoutes.js
import express from 'express';
import { pool } from '../database.js';

const router = express.Router();

// GET /api/market?limit=10
router.get('/market', async (req, res, next) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const { rows } = await pool.query(
      'SELECT * FROM market ORDER BY captured_at DESC LIMIT $1',
      [limit]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/logs_recent?limit=10
router.get('/logs_recent', async (req, res, next) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const { rows } = await pool.query(
      'SELECT * FROM bot_logs ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/open_trades?limit=10
router.get('/open_trades', async (req, res, next) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const { rows } = await pool.query(
      'SELECT * FROM open_trades ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/dominance?limit=10
router.get('/dominance', async (req, res, next) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const { rows } = await pool.query(
      'SELECT * FROM dominance ORDER BY timestamp DESC LIMIT $1',
      [limit]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/fear_greed?limit=10
router.get('/fear_greed', async (req, res, next) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const { rows } = await pool.query(
      'SELECT * FROM fear_greed ORDER BY timestamp DESC LIMIT $1',
      [limit]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// (Aqui pode adicionar rotas extras futuramente)

// Exemplo de rota protegida (template):
// router.get('/secure-data', authenticateJWT, async (req, res, next) => { ... });

export default router;
