// src/database.js

import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Função para adicionar mensagens do usuário (conforme solicitado pelo erro)
export async function addUserMessage(userId, tipo, mensagem) {
  return await pool.query(
    'INSERT INTO user_messages (user_id, tipo_mensagem, mensagem, enviado_em) VALUES ($1, $2, $3, NOW())',
    [userId, tipo, mensagem]
  );
}

// OUTRAS FUNÇÕES EXISTENTES ABAIXO (NÃO REMOVA!)

// Exemplo: função para buscar usuário por email (mantenha suas funções atuais aqui)
export async function getUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0];
}

// ...insira aqui as demais funções já existentes conforme seu arquivo atual

// Exporte todas as funções necessárias
export {
  // pool já exportado acima, apenas para referência,
  // addUserMessage exportado acima,
  getUserByEmail,
  // ...demais funções que já exporta normalmente no seu projeto
};
