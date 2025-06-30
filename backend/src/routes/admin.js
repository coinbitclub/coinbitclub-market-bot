import express from 'express';
import { pool } from '../database.js';
import { isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/users', isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nome, sobrenome, email, created_at, false as bloqueado FROM users ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar usuários", details: err.message });
  }
});

// Exemplo de rota extra (adapte conforme necessidade)
router.get('/logs', isAdmin, async (req, res) => {
  res.json([
    { timestamp: "2024-07-01 12:10", level: "info", message: "Ordem BUY executada BTCUSDT" },
    { timestamp: "2024-07-01 11:58", level: "warn", message: "Sinal não processado (saldo insuficiente)" }
  ]);
});

export default router;
