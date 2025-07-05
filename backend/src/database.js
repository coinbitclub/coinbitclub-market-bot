// backend/src/database.js
// Versão: 2025-07-01 — Banco unificado: Stripe, Planos, Saldos, Usuários, Exchanges

import pkg from 'pg';
const { Pool } = pkg;

// Configuração do pool (atenção para SSL!)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
});

// ----------- USUÁRIO -----------
export async function getUserByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return rows[0];
}

export async function getUserById(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
  return rows[0];
}

export async function updateUser(userId, data) {
  const fields = [];
  const values = [];
  let idx = 1;
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = $${idx}`);
    values.push(value);
    idx++;
  }
  values.push(userId);
  const query = `
    UPDATE users
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${idx}
    RETURNING *
  `;
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function addUserMessage(userId, tipo, mensagem) {
  await pool.query(
    `INSERT INTO user_messages (user_id, tipo_mensagem, mensagem, enviado_em)
     VALUES ($1, $2, $3, NOW())`,
    [userId, tipo, mensagem]
  );
}

// ----------- LIMPEZA -----------
export async function cleanExpiredTestUsers() {
  await pool.query(`
    DELETE FROM users
    WHERE test_expiration IS NOT NULL
      AND test_expiration < NOW()
      AND is_test = true
  `);
}

export async function cleanOldInactiveUsers() {
  await pool.query(`
    DELETE FROM users
    WHERE last_login IS NOT NULL
      AND last_login < NOW() - INTERVAL '180 days'
      AND is_test = false
  `);
}

// ----------- CREDENCIAIS EXCHANGES -----------
export async function getBinanceCredentials(userId, modo = 'testnet') {
  const { rows } = await pool.query(
    `SELECT binance_api_key, binance_api_secret
     FROM user_credentials
     WHERE user_id = $1 AND modo = $2
     LIMIT 1`,
    [userId, modo]
  );
  return rows[0];
}

export async function saveBinanceCredentials({ user_id, api_key, api_secret, modo = 'testnet' }) {
  const { rows } = await pool.query(
    `INSERT INTO user_credentials
       (user_id, modo, binance_api_key, binance_api_secret)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, modo) DO UPDATE
       SET binance_api_key   = EXCLUDED.binance_api_key,
           binance_api_secret = EXCLUDED.binance_api_secret
     RETURNING *`,
    [user_id, modo, api_key, api_secret]
  );
  return rows[0];
}

export async function getBybitCredentials(userId, modo = 'testnet') {
  const { rows } = await pool.query(
    `SELECT bybit_api_key, bybit_api_secret
     FROM user_credentials
     WHERE user_id = $1 AND modo = $2
     LIMIT 1`,
    [userId, modo]
  );
  return rows[0];
}

export async function saveBybitCredentials({ user_id, api_key, api_secret, is_testnet }) {
  const modo = is_testnet ? 'testnet' : 'production';
  const { rows } = await pool.query(
    `INSERT INTO user_credentials
       (user_id, modo, bybit_api_key, bybit_api_secret)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, modo) DO UPDATE
       SET bybit_api_key    = EXCLUDED.bybit_api_key,
           bybit_api_secret = EXCLUDED.bybit_api_secret
     RETURNING *`,
    [user_id, modo, api_key, api_secret]
  );
  return rows[0];
}

// ----------- ASSINATURA, PLANOS E STRIPE -----------
export async function hasActiveSubscription(userId) {
  const { rows } = await pool.query(
    `SELECT EXISTS (
       SELECT 1 FROM user_subscriptions
       WHERE user_id = $1 AND status = 'ativo'
     ) AS active`,
    [userId]
  );
  return rows[0]?.active || false;
}

export async function getUserPlan(userId) {
  const { rows } = await pool.query(
    `SELECT s.*, p.nome     AS plano_nome,
              p.valor_mensalidade,
              p.percentual_comissao,
              p.saldo_minimo,
              p.moeda
     FROM user_subscriptions s
     LEFT JOIN plans p ON s.plan_id = p.id
     WHERE s.user_id = $1
       AND s.is_active = true
     ORDER BY s.criado_em DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0];
}

export async function getActivePlans() {
  const { rows } = await pool.query(
    `SELECT * FROM plans WHERE ativo = true`
  );
  return rows;
}

export async function getPlanPriceId(plan_id) {
  const { rows } = await pool.query(
    `SELECT stripe_price_id
     FROM plans
     WHERE id = $1`,
    [plan_id]
  );
  return rows[0]?.stripe_price_id || null;
}

export async function getPlanStripeIds(plan_id) {
  const { rows } = await pool.query(
    `SELECT stripe_product_id, stripe_price_id
     FROM plans
     WHERE id = $1`,
    [plan_id]
  );
  return rows[0] || null;
}

export async function getStripeUser(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM stripe_users
     WHERE user_id = $1
     ORDER BY criado_em DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0];
}

export async function saveStripeUser({ user_id, stripe_customer_id, stripe_connect_id }) {
  const { rows } = await pool.query(
    `INSERT INTO stripe_users
       (user_id, stripe_customer_id, stripe_connect_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE
       SET stripe_customer_id = EXCLUDED.stripe_customer_id,
           stripe_connect_id  = EXCLUDED.stripe_connect_id
     RETURNING *`,
    [user_id, stripe_customer_id, stripe_connect_id]
  );
  return rows[0];
}

// ----------- SALDO E MOVIMENTAÇÃO -----------
export async function getUserBalance(userId) {
  const { rows } = await pool.query(
    `SELECT saldo, saldo_bloqueado, moeda
     FROM user_balance
     WHERE user_id = $1`,
    [userId]
  );
  return rows[0];
}

export async function updateUserBalance(userId, saldo, saldo_bloqueado) {
  const { rows } = await pool.query(
    `UPDATE user_balance
     SET saldo = $2,
         saldo_bloqueado = $3,
         atualizado_em = NOW()
     WHERE user_id = $1
     RETURNING *`,
    [userId, saldo, saldo_bloqueado]
  );
  return rows[0];
}

export async function addUserBalanceEvent(userId, evento, descricao, saldo_anterior, saldo_minimo) {
  await pool.query(
    `INSERT INTO user_balance_events
       (user_id, evento, descricao, saldo_anterior, saldo_minimo, criado_em)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [userId, evento, descricao, saldo_anterior, saldo_minimo]
  );
}

export async function addFinancialMovement({
  user_id,
  tipo_movimento,
  valor,
  descricao,
  saldo_apos,
  origem,
  status = 'efetivado',
  stripe_payment_id,
  tipo_comissao,
  plano_id
}) {
  await pool.query(
    `INSERT INTO user_financial
       (user_id, tipo_movimento, valor, descricao,
        saldo_apos, origem, status,
        stripe_payment_id, tipo_comissao, plano_id, data)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
    [user_id, tipo_movimento, valor, descricao, saldo_apos, origem, status, stripe_payment_id, tipo_comissao, plano_id]
  );
}

export async function getUserFinance(userId, limit = 40) {
  const { rows } = await pool.query(
    `SELECT * FROM user_financial
     WHERE user_id = $1
     ORDER BY data DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

// ----------- STATUS/OPERAÇÃO -----------
export async function setUserStatus(userId, status) {
  await pool.query(
    `UPDATE users
     SET status = $1
     WHERE id = $2`,
    [status, userId]
  );
}

export async function getUserStatus(userId) {
  const { rows } = await pool.query(
    `SELECT status FROM users WHERE id = $1`,
    [userId]
  );
  return rows[0]?.status || null;
}

// ----------- OPERAÇÕES & LOGS -----------
export async function getUserOperations(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM user_operations
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );
  return rows;
}

export async function logEvent({ user_id, acao, detalhe }) {
  await pool.query(
    `INSERT INTO event_logs (user_id, acao, detalhe, data)
     VALUES ($1, $2, $3, NOW())`,
    [user_id, acao, detalhe]
  );
}

export async function logBot({ severity, message, context }) {
  await pool.query(
    `INSERT INTO bot_logs (created_at, severity, message, context)
     VALUES (NOW(), $1, $2, $3)`,
    [severity, message, JSON.stringify(context)]
  );
}

// ----------- EXPORTA TUDO -----------
export default {
  pool,
  getUserByEmail,
  getUserById,
  updateUser,
  addUserMessage,
  cleanExpiredTestUsers,
  cleanOldInactiveUsers,
  getBinanceCredentials,
  saveBinanceCredentials,
  getBybitCredentials,
  saveBybitCredentials,
  hasActiveSubscription,
  getUserPlan,
  getActivePlans,
  getPlanPriceId,
  getPlanStripeIds,
  getStripeUser,
  saveStripeUser,
  getUserBalance,
  updateUserBalance,
  addUserBalanceEvent,
  addFinancialMovement,
  getUserFinance,
  setUserStatus,
  getUserStatus,
  getUserOperations,
  logEvent,
  logBot,
};
