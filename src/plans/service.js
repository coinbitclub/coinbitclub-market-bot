import { getDB } from '../common/db.js';

/**
 * Lista todos os planos ativos
 */
export async function listPlans(req, res, next) {
  try {
    const plans = await getDB()('plans').where('ativo', true);
    res.json(plans);
  } catch (err) {
    next(err);
  }
}

/**
 * Cria um novo plano
 */
export async function createPlan(req, res, next) {
  try {
    const [plan] = await getDB()('plans')
      .insert(req.body)
      .returning('*');
    res.status(201).json(plan);
  } catch (err) {
    next(err);
  }
}

/**
 * Atualiza um plano existente pelo ID
 */
export async function updatePlan(req, res, next) {
  try {
    const [plan] = await getDB()('plans')
      .where('id', req.params.id)
      .update(req.body)
      .returning('*');
    res.json(plan);
  } catch (err) {
    next(err);
  }
}

/**
 * Marca um plano como inativo
 */
export async function deletePlan(req, res, next) {
  try {
    await getDB()('plans')
      .where('id', req.params.id)
      .update({ ativo: false });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
