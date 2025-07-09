// src/services/planService.js
import { pool } from "../database.js";

/** Busca todos os planos ativos para o país informado */
export async function getPlansByCountry(countryCode) {
  const { rows } = await pool.query(
    "SELECT * FROM plans WHERE pais = $1 AND ativo = true",
    [countryCode]
  );
  return rows;
}

/** Busca o plano ativo do usuário */
export async function getUserPlan(userId) {
  const { rows } = await pool.query(
    `SELECT p.*
     FROM user_subscriptions us
     JOIN plans p ON us.plan_id = p.id
     WHERE us.user_id = $1 AND us.is_active = true
     ORDER BY us.data_inicio DESC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

/** Vincula usuário a um plano escolhido */
export async function setUserPlan(userId, planId, isStripe = false, stripeSubscriptionId = null) {
  await pool.query(
    `INSERT INTO user_subscriptions
      (user_id, plan_id, tipo_plano, status, data_inicio, is_stripe, stripe_subscription_id, is_active)
     VALUES ($1, $2, (SELECT tipo FROM plans WHERE id=$2), 'ativo', NOW(), $3, $4, true)
     ON CONFLICT (user_id, plan_id) DO UPDATE
       SET is_active=true, status='ativo', data_inicio=NOW()`,
    [userId, planId, isStripe, stripeSubscriptionId]
  );
}

/** Lista todos os planos existentes */
export async function listPlans() {
  const { rows } = await pool.query('SELECT * FROM plans ORDER BY price ASC');
  return rows;
}

/** Cria um novo plano */
export async function createPlan({ name, price, description, frequency, is_active, tipo, pais }) {
  const { rows } = await pool.query(
    `INSERT INTO plans (name, price, description, frequency, is_active, tipo, pais)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, price, description, frequency, is_active, tipo, pais]
  );
  return rows[0];
}

/** Exclui um plano existente */
export async function deletePlan(planId) {
  await pool.query('DELETE FROM plans WHERE id = $1', [planId]);
}
