import { pool } from "../database.js";

// -----------------------
// Funções do Afiliado
// -----------------------

export async function getAffiliateProfile(userId) {
  const { rows } = await pool.query(
    "SELECT * FROM affiliates WHERE user_id = $1 LIMIT 1", [userId]
  );
  return rows[0];
}

export async function updateAffiliateProfile(userId, data) {
  // data pode conter nome, sobrenome, cpf, email, chave_pix, banco, agencia, conta, tipo_conta
  const fields = [];
  const values = [];
  let idx = 1;
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = $${idx}`);
    values.push(value);
    idx++;
  }
  values.push(userId);
  await pool.query(
    `UPDATE affiliates SET ${fields.join(', ')} WHERE user_id = $${idx}`, values
  );
}

export async function getAffiliateExtract(userId) {
  // Extrato do afiliado, ordenado do mais recente para o mais antigo
  const { rows } = await pool.query(
    "SELECT * FROM affiliates_extract WHERE user_id = $1 ORDER BY data DESC", [userId]
  );
  return rows;
}

export async function getReferralLink(userId) {
  // Recupera o link único de indicação do afiliado
  const { rows } = await pool.query(
    "SELECT link FROM affiliates WHERE user_id = $1", [userId]
  );
  // Exemplo de link para cadastro
  return "https://coinbitclub.com.br/register?ref=" + (rows[0]?.link || "");
}

export async function getAffiliateIndications(userId) {
  // Usuários indicados por este afiliado
  const { rows } = await pool.query(
    "SELECT id, nome, email, created_at, status FROM users WHERE indicated_by = $1", [userId]
  );
  return rows;
}

// -----------------------
// Funções do Admin
// -----------------------

export async function listAffiliates() {
  const { rows } = await pool.query("SELECT * FROM affiliates ORDER BY id DESC");
  return rows;
}

export async function createAffiliate(data) {
  // data precisa conter: user_id, nome, sobrenome, cpf, email, chave_pix, banco, agencia, conta, tipo_conta, link
  const { user_id, nome, sobrenome, cpf, email, chave_pix, banco, agencia, conta, tipo_conta, link } = data;
  const { rows } = await pool.query(`
    INSERT INTO affiliates (user_id, nome, sobrenome, cpf, email, chave_pix, banco, agencia, conta, tipo_conta, link)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *
  `, [user_id, nome, sobrenome, cpf, email, chave_pix, banco, agencia, conta, tipo_conta, link]);
  return rows[0];
}

export async function updateAffiliate(affiliateId, data) {
  // Pode atualizar qualquer campo do afiliado via painel admin
  const fields = [];
  const values = [];
  let idx = 1;
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = $${idx}`);
    values.push(value);
    idx++;
  }
  values.push(affiliateId);
  await pool.query(
    `UPDATE affiliates SET ${fields.join(', ')} WHERE id = $${idx}`, values
  );
}

export async function deleteAffiliate(affiliateId) {
  await pool.query("DELETE FROM affiliates WHERE id = $1", [affiliateId]);
}

export async function adminGetAffiliateExtract(affiliateId) {
  // Extrato de qualquer afiliado para o admin
  const { rows } = await pool.query(
    "SELECT * FROM affiliates_extract WHERE affiliate_id = $1 ORDER BY data DESC", [affiliateId]
  );
  return rows;
}

export async function addAffiliateExtract({ user_id, tipo, valor, descricao, status }) {
  // Lança crédito/débito manual, pagamento, ajuste, etc.
  await pool.query(`
    INSERT INTO affiliates_extract (user_id, tipo, valor, descricao, status, data)
    VALUES ($1, $2, $3, $4, $5, NOW())
  `, [user_id, tipo, valor, descricao, status]);
}

// Exemplo para controle manual do admin lançar pagamento
export async function adminMarkAsPaid(affiliateId, valor, descricao = "Pagamento manual") {
  // Lança saída do saldo, tipo "pago"
  await addAffiliateExtract({
    user_id: affiliateId,
    tipo: "pago",
    valor: -Math.abs(valor),
    descricao,
    status: "confirmado"
  });
}

export default {
  getAffiliateProfile,
  updateAffiliateProfile,
  getAffiliateExtract,
  getReferralLink,
  getAffiliateIndications,
  listAffiliates,
  createAffiliate,
  updateAffiliate,
  deleteAffiliate,
  adminGetAffiliateExtract,
  addAffiliateExtract,
  adminMarkAsPaid
};
