import { pool } from '../database.js';
import { sendWhatsApp } from './whatsapp.js'; // Sua função real de envio

/**
 * Checa usuários em teste expirado e envia mensagem de expiração.
 * Agende em node-cron/cronJobs.js
 */
export async function checkAndSendTrialExpiration() {
  const { rows } = await pool.query(
    `SELECT id, nome, telefone_whatsapp FROM users
     WHERE is_teste = TRUE AND data_fim_teste < NOW() AND status = 'ativo'`
  );

  for (const user of rows) {
    await sendWhatsApp(
      user.telefone_whatsapp,
      `Sua degustação terminou, mas as oportunidades no mercado não param!
Assine agora e garanta acesso real e total ao nosso robô de IA — não deixe os lucros escaparem.`
    );

    await pool.query(
      `INSERT INTO user_messages (user_id, tipo_mensagem, mensagem)
       VALUES ($1, $2, $3)`,
      [user.id, 'degustacao_expirada', 'Mensagem enviada pós degustação']
    );

    await pool.query(`UPDATE users SET status = 'expirado' WHERE id = $1`, [user.id]);
  }
}
