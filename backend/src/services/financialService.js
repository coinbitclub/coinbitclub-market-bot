import { pool } from "../database.js";

// Debita valor do usuário e gera extrato
export async function debitarSaldo(userId, valor, descricao, origem) {
  // Busca saldo atual
  const { rows: ult } = await pool.query(
    "SELECT saldo_apos FROM user_financial WHERE user_id=$1 ORDER BY data DESC LIMIT 1",
    [userId]
  );
  const saldoAtual = ult.length ? +ult[0].saldo_apos : 0;
  if (valor > saldoAtual) throw new Error("Saldo insuficiente.");
  const novoSaldo = saldoAtual - valor;
  await pool.query(
    `INSERT INTO user_financial (user_id, tipo_movimento, valor, descricao, saldo_apos, origem, status, data)
     VALUES ($1,'debito',$2,$3,$4,$5,'efetivado',NOW())`,
    [userId, valor, descricao, novoSaldo, origem]
  );
  return { ok: true, novoSaldo };
}

// Credita valor (ex: depósito, bônus, estorno)
export async function creditarSaldo(userId, valor, descricao, origem) {
  const { rows: ult } = await pool.query(
    "SELECT saldo_apos FROM user_financial WHERE user_id=$1 ORDER BY data DESC LIMIT 1",
    [userId]
  );
  const saldoAtual = ult.length ? +ult[0].saldo_apos : 0;
  const novoSaldo = saldoAtual + valor;
  await pool.query(
    `INSERT INTO user_financial (user_id, tipo_movimento, valor, descricao, saldo_apos, origem, status, data)
     VALUES ($1,'credito',$2,$3,$4,$5,'efetivado',NOW())`,
    [userId, valor, descricao, novoSaldo, origem]
  );
  return { ok: true, novoSaldo };
}
