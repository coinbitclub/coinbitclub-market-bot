// src/database.js
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
  console.log('[🔍 getUserById] Recebido:', userId);
  const { rows } = await pool.query(
    'SELECT id, nome, sobrenome, email, telefone, pais, created_at FROM users WHERE id = $1',
    [userId]
  );
  console.log('[📦 Resultado DB]', rows);
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

// ----------- LIMPEZA DE USUÁRIOS DE TESTE -----------
export async function cleanExpiredTestUsers() {
  const { rowCount } = await pool.query(
    `DELETE FROM users
     WHERE is_test_user = true
       AND created_at < NOW() - INTERVAL '1 DAY'`
  );
  return rowCount;
}

// ----------- LIMPEZA DE USUÁRIOS INATIVOS ANTIGOS -----------
export async function cleanOldInactiveUsers() {
  const { rowCount } = await pool.query(
    `DELETE FROM users
     WHERE is_test_user = false
       AND updated_at < NOW() - INTERVAL '30 DAYS'`
  );
  return rowCount;
}
