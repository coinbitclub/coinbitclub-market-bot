import express from "express";
import * as signalService from "../services/signalService.js";

const router = express.Router();

// Recebe sinais externos via webhook (ex: TradingView)
router.post("/signal", async (req, res, next) => {
  try {
    const { token } = req.query;
    // Verifica token do webhook (ajuste para sua env)
    if (token !== process.env.WEBHOOK_TOKEN)
      return res.status(401).json({ error: "Token inválido" });

    const signal = await signalService.saveSignal(req.body);
    res.json({ ok: true, id: signal.id });
  } catch (err) { next(err); }
});

// Recebe dados de dominância via webhook
router.post("/dominance", async (req, res, next) => {
  try {
    const { token } = req.query;
    if (token !== process.env.WEBHOOK_TOKEN)
      return res.status(401).json({ error: "Token inválido" });

    const dominance = await signalService.saveDominance(req.body);
    res.json({ ok: true, id: dominance.id });
  } catch (err) { next(err); }
});

export default router;
