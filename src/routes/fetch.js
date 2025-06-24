import express from 'express';
const router = express.Router();

router.get('/fear_greed', (req, res) => {
  // Retorno mock, ajuste para seu serviço real
  res.json({ ok: true, msg: 'Fear & Greed mockado' });
});

router.get('/dominance', (req, res) => {
  // Retorno mock, ajuste para seu serviço real
  res.json({ ok: true, msg: 'Dominance mockado' });
});

router.get('/market', (req, res) => {
  // Retorno mock, ajuste para seu serviço real
  res.json({ ok: true, msg: 'Market mockado' });
});

export default router;
