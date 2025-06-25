import express from 'express';
import { saveSignal }    from '../services/signalService.js';
import { saveDominance } from '../services/dominanceService.js';
import { saveFearGreed } from '../services/fearGreedService.js';

const router = express.Router();

// valida ?token=…
function verifyToken(req, res, next) {
  if (req.query.token !== process.env.WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  next();
}

router.post('/signal', verifyToken, async (req, res) => {
  try {
    const { ticker, time } = req.body;
    await saveSignal({ time, ticker, payload: req.body });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/dominance', verifyToken, async (req, res) => {
  try {
    await saveDominance(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/fear_greed', verifyToken, async (req, res) => {
  try {
    await saveFearGreed(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
