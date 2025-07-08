import { pool } from "../database.js";

// Lista integrações disponíveis (para admin ou usuário)
export async function getIntegrations() {
  const { rows } = await pool.query("SELECT * FROM integrations WHERE status='ativo'");
  return rows;
}

// Adiciona nova integração (admin)
export async function addIntegration(data) {
  await pool.query(
    `INSERT INTO integrations (tipo, credenciais, status, updated_at) VALUES ($1,$2,'ativo',NOW())`,
    [data.tipo, data.credenciais]
  );
  return { ok: true };
}
