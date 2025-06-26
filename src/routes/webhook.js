import express from 'express';
const router = express.Router();

// ROTA PRINCIPAL: RECEBE SINAIS DO TRADINGVIEW
router.post('/signal', async (req, res) => {
  try {
    // Lógica para processar o sinal recebido
    res.json({ ok: true, received: req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/dominance', async (req, res) => {
  try {
    // Lógica para processar dominance
    res.json({ ok: true, received: req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/fear_greed', async (req, res) => {
  try {
    // Lógica para processar fear/greed
    res.json({ ok: true, received: req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
