// src/services/db.js
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
  return rows[0] || null;
}

export async function getUserById(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
  return rows[0] || null;
}

export async function updateUser(userId, data) {
  const keys = ['nome', 'sobrenome', 'telefone', 'pais'];
  const updates = [];
  const values = [];
  let idx = 1;

  for (const key of keys) {
    if (data[key] !== undefined) {
      updates.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
  }

  if (updates.length === 0) {
    throw new Error('Nenhum campo para atualizar.');
  }

  values.push(userId);
  const sql = `
    UPDATE users
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE id = $${idx}
    RETURNING *
  `;
  const { rows } = await pool.query(sql, values);
  return rows[0];
}

// ----------- MENSAGENS -----------
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

// (… mais funções para credenciais, subscriptions, stripe, saldo, logs etc …)
// Apenas mantenha o padrão export async function <nome>(…) { … }
