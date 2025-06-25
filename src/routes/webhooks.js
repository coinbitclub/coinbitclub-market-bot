import express from 'express';
import { saveSignal } from '../services/signalService.js';
import { saveDominance } from '../services/dominanceService.js';

const router = express.Router();

// POST  /webhook/signal
router.post('/signal', async (req, res) => {
  try {
    const { ticker, time } = req.body;
    if (!ticker || !time) {
      return res.status(400).json({ error: 'ticker e time são obrigatórios' });
    }
    await saveSignal({ time, ticker, payload: req.body });
    res.json({ ok: true, message: 'Sinal recebido e salvo com sucesso.' });
  } catch (err) {
    console.error('Erro ao salvar sinal:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST  /webhook/dominance
router.post('/dominance', async (req, res) => {
  try {
    const { dominance, timestamp } = req.body;
    if (dominance === undefined || !timestamp) {
      return res.status(400).json({ error: 'dominance e timestamp são obrigatórios' });
    }
    await saveDominance(req.body);
    res.json({ ok: true, message: 'Dominância recebida e salva com sucesso.' });
  } catch (err) {
    console.error('Erro ao salvar dominância:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
