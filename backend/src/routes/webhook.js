import { Router } from "express";
import * as signalService from "../services/signalService.js";
import { parseSignal } from "../services/parseSignal.js";
import { parseDominance } from "../services/parseDominance.js";

const router = new Router();

// POST /webhook/signal
router.post("/signal", async (req, res, next) => {
  try {
    if (req.query.token !== process.env.WEBHOOK_TOKEN) {
      return res.status(401).json({ error: "Token inválido" });
    }
    const payload = parseSignal(req.body);
    const { id } = await signalService.saveSignal(payload);
    return res.json({ ok: true, id });
  } catch (err) {
    next(err);
  }
});

// POST /webhook/dominance
router.post("/dominance", async (req, res, next) => {
  try {
    if (req.query.token !== process.env.WEBHOOK_TOKEN) {
      return res.status(401).json({ error: "Token inválido" });
    }
    const payload = parseDominance(req.body);
    const { id } = await signalService.saveDominance(payload);
    return res.json({ ok: true, id });
  } catch (err) {
    next(err);
  }
});

export default router;
