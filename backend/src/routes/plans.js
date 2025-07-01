import express from "express";
import * as planService from "../services/planService.js";

const router = express.Router();

// Lista de planos ativos (filtro por país)
router.get("/", async (req, res, next) => {
  try {
    const { pais } = req.query;
    const plans = await planService.getActivePlans(pais);
    res.json(plans);
  } catch (err) { next(err); }
});

export default router;
