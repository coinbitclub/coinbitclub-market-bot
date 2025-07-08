import { pool } from "../database.js";

// Envia notificação via WhatsApp/E-mail/interna (stub: personalize ZAPI/email depois)
export async function sendNotification({ userId, mensagem, tipo = "whatsapp" }) {
  // Se quiser integrar a ZAPI/email, faça aqui (ex: axios.post)
  await pool.query(
    `INSERT INTO notifications (user_id, mensagem, lida, tipo_notificacao, data)
     VALUES ($1,$2,FALSE,$3,NOW())`,
    [userId, mensagem, tipo]
  );
  return { ok: true };
}

// Lista notificações do usuário
export async function getUserNotifications(userId) {
  const { rows } = await pool.query(
    "SELECT * FROM notifications WHERE user_id=$1 ORDER BY data DESC LIMIT 20", [userId]
  );
  return rows;
}
