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
    'SELECT * FROM users WHERE email = ',
    [email]
  );
  return rows[0];
}

export async function getUserById(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE id = ',
    [userId]
  );
  return rows[0];
}

export async function updateUser(userId, data) { const keys=["nome","sobrenome","telefone","pais"]; const updates=[]; const values=[]; let idx=1; for(const key of keys){ if(data[key]!==undefined){ updates.push(`${key} = ${idx}`); values.push(data[key]); idx++; }} if(!updates.length) throw new Error("Nenhum campo para atualizar."); values.push(userId); const query=`UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ${idx} RETURNING *`; const { rows } = await pool.query(query, values); return rows[0]; }
}

export async function addUserMessage(userId, tipo, mensagem) {
  await pool.query(
    \INSERT INTO user_messages (user_id, tipo_mensagem, mensagem, enviado_em)
     VALUES (, , , NOW())\,
    [userId, tipo, mensagem]
  );
}

// ----------- LIMPEZA -----------
export async function cleanExpiredTestUsers() {
  await pool.query(\
    DELETE FROM users
    WHERE test_expiration IS NOT NULL
      AND test_expiration < NOW()
      AND is_test = true
  \);
}

export async function cleanOldInactiveUsers() {
  await pool.query(\
    DELETE FROM users
    WHERE last_login IS NOT NULL
      AND last_login < NOW() - INTERVAL '180 days'
      AND is_test = false
  \);
}

// ----------- CREDENCIAIS EXCHANGES -----------
export async function getBinanceCredentials(userId, modo = 'testnet') {
  const { rows } = await pool.query(\
    SELECT binance_api_key, binance_api_secret
    FROM user_credentials
    WHERE user_id =  AND modo = 
    LIMIT 1\,
    [userId, modo]
  );
  return rows[0];
}

export async function saveBinanceCredentials({ user_id, api_key, api_secret, modo = 'testnet' }) {
  const { rows } = await pool.query(\
    INSERT INTO user_credentials
      (user_id, modo, binance_api_key, binance_api_secret)
    VALUES (, , , )
    ON CONFLICT (user_id, modo) DO UPDATE
      SET binance_api_key   = EXCLUDED.binance_api_key,
          binance_api_secret = EXCLUDED.binance_api_secret
    RETURNING *\,
    [user_id, modo, api_key, api_secret]
  );
  return rows[0];
}

export async function getBybitCredentials(userId, modo = 'testnet') {
  const { rows } = await pool.query(\
    SELECT bybit_api_key, bybit_api_secret
    FROM user_credentials
    WHERE user_id =  AND modo = 
    LIMIT 1\,
    [userId, modo]
  );
  return rows[0];
}

export async function saveBybitCredentials({ user_id, api_key, api_secret, is_testnet }) {
  const modo = is_testnet ? 'testnet' : 'production';
  const { rows } = await pool.query(\
    INSERT INTO user_credentials
      (user_id, modo, bybit_api_key, bybit_api_secret)
    VALUES (, , , )
    ON CONFLICT (user_id, modo) DO UPDATE
      SET bybit_api_key    = EXCLUDED.bybit_api_key,
          bybit_api_secret = EXCLUDED.bybit_api_secret
    RETURNING *\,
    [user_id, modo, api_key, api_secret]
  );
  return rows[0];
}

// … continue colando todas as outras funções exportadas nomeadas da mesma forma …

