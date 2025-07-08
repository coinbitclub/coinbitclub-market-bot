import express from "express";
import * as integrationService from "../services/integrationService.js";

const router = express.Router();

// Lista integrações disponíveis
router.get("/", async (req, res, next) => {
  try {
    const integrations = await integrationService.getIntegrations();
    res.json(integrations);
  } catch (err) { next(err); }
});

// Cadastra nova integração (apenas admin futuramente)
router.post("/", async (req, res, next) => {
  try {
    const integration = await integrationService.addIntegration(req.body);
    res.json(integration);
  } catch (err) { next(err); }
});

export default router;
