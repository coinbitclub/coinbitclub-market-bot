// src/routes/operations.js
import express from 'express';
import { jwtMiddleware } from '../middleware/auth.js';
import { pool } from '../services/db.js';

const router = express.Router();

// GET /user/operations (history from user_operations)
router.get(
  '/operations',
  jwtMiddleware,
  async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        `SELECT
           id,
           exchange,
           symbol,
           side,
           qty AS amount,
           price,
           opened_at AS created_at
         FROM user_operations
         WHERE user_id = $1
         ORDER BY opened_at DESC`,
        [req.user.id]
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  }
);

// POST /user/operations (persist to operations)
router.post(
  '/operations',
  jwtMiddleware,
  async (req, res, next) => {
    try {
      const { symbol, side, amount, price } = req.body;
      const { rows } = await pool.query(
        `INSERT INTO operations
           (user_id, symbol, side, quantity, price)
         VALUES
           ($1, $2, $3, $4, $5)
         RETURNING id`,
        [req.user.id, symbol, side, amount, price]
      );
      res.status(201).json({ id: rows[0].id });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
