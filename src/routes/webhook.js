import express from 'express';
import { saveSignal } from '../services/signalService.js';
import { saveDominance } from '../services/dominanceService.js';
import { saveFearGreed } from '../services/fearGreedWriter.js';

const router = express.Router();

function verifyToken(req, res, next) {
  if (req.query.token !== process.env.WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  next();
}

// POST /webhook/signal
router.post('/signal', verifyToken, async (req, res) => {
  try {
    // Esperado: { ticker, price, time, ...outros }
    const { ticker, price, time } = req.body;
    await saveSignal({
      ticker,
      price,
      time,
      signal_json: req.body, // salva o payload inteiro
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /webhook/dominance
router.post('/dominance', verifyToken, async (req, res) => {
  try {
    // Esperado: { btc_dom, ema7, timestamp }
    await saveDominance(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /webhook/fear_greed
router.post('/fear_greed', verifyToken, async (req, res) => {
  try {
    // Esperado: { index_value, value_classification, timestamp }
    await saveFearGreed(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
