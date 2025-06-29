import { pool } from '../database.js';

// Consulta genérica
export const query = (text, params) => pool.query(text, params);

// Salva um novo sinal no banco
export async function insertSignal({ ticker, price, time, signal_json }) {
  return pool.query(
    'INSERT INTO signals (ticker, price, time, signal_json) VALUES ($1, $2, $3, $4) RETURNING *',
    [ticker, price, time, JSON.stringify(signal_json)]
  );
}

// Busca credenciais Bybit de um usuário
export async function getBybitCredentials(user_id, is_testnet = false) {
  const { rows } = await pool.query(
    'SELECT api_key, api_secret FROM bybit_credentials WHERE user_id = $1 AND is_testnet = $2 LIMIT 1',
    [user_id, is_testnet]
  );
  return rows[0];
}

// Adicione aqui funções para dominance, fear/greed, etc., conforme as necessidades do seu fluxo!
