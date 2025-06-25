import { Router } from 'express';
import { saveSignal } from '../services/signalService.js';
import { saveDominance } from '../services/dominanceService.js';

const router = Router();

router.post('/signal', async (req, res) => {
  try {
    const { ticker, time } = req.body;
    await saveSignal({ ticker, time, payload: req.body });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/dominance', async (req, res) => {
  try {
    await saveDominance(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;