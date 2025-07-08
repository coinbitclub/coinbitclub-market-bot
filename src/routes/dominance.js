// src/routes/dominance.js
import express from 'express';
import { parseDominance } from '../parseDominance.js'; // Função que ajusta o body
import { pool } from '../database.js'; // Pool de conexão com o Postgres

const router = express.Router();

/**
 * Salva a dominância enviada via webhook
 * Espera { btc_dom: number, eth_dom: number }
 */
router.post('/', async (req, res, next) => {
  try {
    // Extração dos dados do corpo da requisição
    const { btc_dom, eth_dom } = parseDominance(req.body);

    // Inserção no banco: agora compatível com sua tabela (btc_dom, eth_dom, captured_at)
    await pool.query(
      `INSERT INTO btc_dominance (btc_dom, eth_dom, captured_at) VALUES ($1, $2, NOW())`,
      [btc_dom, eth_dom]
    );

    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

export default router;
