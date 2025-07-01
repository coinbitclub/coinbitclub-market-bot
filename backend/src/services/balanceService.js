import { pool } from "../database.js";
import { getUserPlan } from "./planService.js";
import { pauseUserBot, notifyUserLowBalance } from "./notificationService.js";

export async function getUserBalance(userId) {
  const { rows } = await pool.query(
    "SELECT saldo FROM user_balance WHERE user_id = $1", [userId]
  );
  return rows[0]?.saldo ?? 0;
}

export async function updateUserBalance(userId, valor, descricao, tipo = "ajuste", stripeId = null) {
  const saldoAtual = await getUserBalance(userId);
  const saldoNovo = Number(saldoAtual) + Number(valor);
  await pool.query(
    `INSERT INTO user_financial (user_id, valor, descricao, saldo_apos, tipo_movimento, stripe_payment_id, data)
     VALUES ($1, $2, $3, $4, $5, $6, now())`,
    [userId, valor, descricao, saldoNovo, tipo, stripeId]
  );
  await pool.query(
    `UPDATE user_balance SET saldo = $1, atualizado_em = now() WHERE user_id = $2`,
    [saldoNovo, userId]
  );
  return saldoNovo;
}

/** Débito automático por trade + checagem de saldo mínimo */
export async function debitCommissionForTrade(userId, lucro, origem = "trade") {
  const plano = await getUserPlan(userId);
  if (!plano) throw new Error("Usuário sem plano ativo.");
  const comissao = plano.percentual_comissao;
  const valorComissao = lucro * (comissao / 100);
  const saldoAtual = await getUserBalance(userId);
  const saldoMinimo = Number(plano.saldo_minimo);

  if (saldoAtual < valorComissao) throw new Error("Saldo insuficiente para cobrança de comissão!");

  await updateUserBalance(userId, -valorComissao, `Comissão ${comissao}% sobre lucro`, origem);

  // Pausar robô e notificar se saldo < saldo mínimo
  const saldoDepois = await getUserBalance(userId);
  if (saldoDepois < saldoMinimo) {
    await pauseUserBot(userId);
    await notifyUserLowBalance(userId, saldoDepois, saldoMinimo);
  }
  return saldoDepois;
}
