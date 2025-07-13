import { getDB } from '../common/db.js';
export async function listPlans(req, res) {
  const plans = await getDB()('plans').where('ativo', true);
  res.json(plans);
}
export async function createPlan(req, res) {
  const [plan] = await getDB()('plans').insert(req.body).returning('*');
  res.status(201).json(plan);
}
export async function updatePlan(req, res) {
  const [plan] = await getDB()('plans').where('id', req.params.id).update(req.body).returning('*');
  res.json(plan);
}
export async function deletePlan(req, res) {
  await getDB()('plans').where('id', req.params.id).update({ ativo: false });
  res.status(204).end();
}
