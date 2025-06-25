import express from 'express';
import { fetchFearGreed } from '../services/fearGreedService.js';
import { getBtcDominanceDiff } from '../services/dominanceService.js';
import { getMarketHistory } from '../services/marketService.js';

const router = express.Router();

router.get('/fear_greed', async (req, res) => {
  try { res.json(await fetchFearGreed()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/dominance', async (req, res) => {
  try { res.json({ diff: await getBtcDominanceDiff() }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/market', async (req, res) => {
  try { res.json(await getMarketHistory()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
