import { Router } from "express";
import { getPlans, addPlan, removePlan } from "../controllers/planController.js";

const router = Router();

router.get("/", getPlans);
router.post("/", addPlan);
router.delete("/:id", removePlan);

export default router;
