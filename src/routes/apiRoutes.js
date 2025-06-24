import express from 'express';
import { query } from './services/databaseService.js';

const router = express.Router();

router.get('/marketcap', async (req, res) => {
  try {
    const result = await query('SELECT * FROM marketcap ORDER BY captured_at DESC LIMIT 1');
    if (!result.rows.length) return res.status(404).json({ message: 'Nenhum dado de marketcap encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dominance', async (req, res) => {
  try {
    const result = await query('SELECT * FROM dominance ORDER BY captured_at DESC LIMIT 1');
    if (!result.rows.length) return res.status(404).json({ message: 'Nenhum dado de dominance encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/feargreed', async (req, res) => {
  try {
    const result = await query('SELECT * FROM fear_greed ORDER BY captured_at DESC LIMIT 1');
    if (!result.rows.length) return res.status(404).json({ message: 'Nenhum dado de fear and greed encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/volatility', async (req, res) => {
  try {
    const result = await query('SELECT * FROM volatility ORDER BY captured_at DESC LIMIT 1');
    if (!result.rows.length) return res.status(404).json({ message: 'Nenhum dado de volatility encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/feargreed2', async (req, res) => {
  try {
    const result = await query('SELECT * FROM fear_greed2 ORDER BY captured_at DESC LIMIT 1');
    if (!result.rows.length) return res.status(404).json({ message: 'Nenhum dado de fear and greed 2 encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/extra', async (req, res) => {
  try {
    const result = await query('SELECT * FROM extra_metrics ORDER BY captured_at DESC LIMIT 1');
    if (!result.rows.length) return res.status(404).json({ message: 'Nenhum dado de extra metrics encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
