import { listPlans, createPlan, deletePlan } from "../services/planService.js";

export async function getPlans(req, res) {
  const plans = await listPlans();
  res.json(plans);
}

export async function addPlan(req, res) {
  const plan = await createPlan(req.body);
  res.status(201).json(plan);
}

export async function removePlan(req, res) {
  await deletePlan(req.params.id);
  res.sendStatus(204);
}
