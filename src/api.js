import express from "express";
import { pool } from "../database.js";

const router = express.Router();

// Sinais recentes
router.get("/signals", async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const { rows } = await pool.query(
    `SELECT * FROM public.signals ORDER BY received_at DESC LIMIT $1`,
    [limit]
  );
  res.json(rows);
});

// Dominância BTC/ETH
router.get("/dominance", async (req, res) => {
  const period = req.query.period || "24h";
  const { rows } = await pool.query(
    `SELECT * FROM public.dominance
       WHERE timestamp > now() - interval $1
       ORDER BY timestamp DESC`,
    [period]
  );
  res.json(rows);
});

// Fear & Greed
router.get("/fear-greed", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM public.fear_greed ORDER BY timestamp DESC LIMIT 1`,
    []
  );
  res.json(rows[0] || {});
});

// Dados de mercado
router.get("/market", async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const { rows } = await pool.query(
    `SELECT * FROM public.market ORDER BY timestamp DESC LIMIT $1`,
    [limit]
  );
  res.json(rows);
});

export default router;
