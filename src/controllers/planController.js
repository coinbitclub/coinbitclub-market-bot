src/controllers/planController.js
js
CopiarEditar
import { listPlans, createPlan, deletePlan } from '../services/planService.js';

export async function getPlans(req, res) {
  res.json(await listPlans());
}

export async function addPlan(req, res) {
  const plan = await createPlan(req.body);
  res.status(201).json(plan);
}

export async function removePlan(req, res) {
  await deletePlan(req.params.id);
  res.status(204).send();
}
