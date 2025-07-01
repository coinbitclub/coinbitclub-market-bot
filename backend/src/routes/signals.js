import express from "express";
import * as signalService from "../services/signalService.js";

const router = express.Router();

// Lista de sinais recentes
router.get("/", async (req, res, next) => {
  try {
    const signals = await signalService.getRecentSignals();
    res.json(signals);
  } catch (err) { next(err); }
});

// Lista de indicadores recentes
router.get("/indicators", async (req, res, next) => {
  try {
    const indicators = await signalService.getRecentIndicators();
    res.json(indicators);
  } catch (err) { next(err); }
});

export default router;
