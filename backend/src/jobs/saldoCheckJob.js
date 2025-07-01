import { pool } from "../database.js";
import { sendNotification } from "../services/notificationService.js";

// Notifica usuários com saldo pré-pago baixo
export default async function saldoCheckJob() {
  try {
    // Busca todos usuários e saldo atual
    const users = (await pool.query("SELECT id, nome, telefone, email FROM users")).rows;
    for (const user of users) {
      const ext = (await pool.query(
        "SELECT saldo_apos FROM user_financial WHERE user_id=$1 ORDER BY data DESC LIMIT 1",
        [user.id]
      )).rows[0];
      const saldo = ext ? +ext.saldo_apos : 0;

      // Busca plano e saldo mínimo
      const sub = (await pool.query(
        "SELECT * FROM user_subscriptions WHERE user_id=$1 AND is_active=TRUE ORDER BY criado_em DESC LIMIT 1",
        [user.id]
      )).rows[0];
      if (!sub) continue;
      const plano = (await pool.query(
        "SELECT * FROM plans WHERE nome=$1 LIMIT 1",
        [sub.tipo_plano]
      )).rows[0];
      if (!plano) continue;
      const saldo_minimo = +plano.saldo_minimo || 0;

      // Se saldo < 50% do mínimo, notifica
      if (saldo < saldo_minimo * 0.5) {
        const msg = `Seu saldo pré-pago está baixo (${saldo.toFixed(2)}). Recarregue para não interromper as operações do robô.`;
        await sendNotification({
          userId: user.id,
          mensagem: msg,
          tipo: "whatsapp"
        });
        console.log(`Aviso enviado para usuário ${user.nome} (${user.email}): saldo baixo`);
      }
    }
  } catch (err) {
    console.error("Erro no job de saldo:", err.message);
  }
}
