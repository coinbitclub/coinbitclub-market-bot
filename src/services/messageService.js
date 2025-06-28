import { pool } from '../database.js';
import { sendWhatsApp } from './whatsapp.js'; // sua função de envio real

export async function checkAndSendTrialExpiration() {
  const { rows } = await pool.query(
    `SELECT id, nome, telefone_whatsapp FROM users
     WHERE is_teste = TRUE AND data_fim_teste < NOW() AND status = 'ativo'`
  );

  for (const user of rows) {
    // dispara mensagem personalizada
    await sendWhatsApp(user.telefone_whatsapp, `Sua degustação terminou, mas as oportunidades no mercado não param!
Assine agora e garanta acesso real e total ao nosso robô de IA — não deixe os lucros escaparem.`);

    // grava mensagem no banco
    await pool.query(
      `INSERT INTO user_messages (user_id, tipo_mensagem, mensagem)
       VALUES ($1, $2, $3)`,
      [user.id, 'degustacao_expirada', 'Mensagem enviada pós degustação']
    );

    // marca usuário como expirado
    await pool.query(`UPDATE users SET status = 'expirado' WHERE id = $1`, [user.id]);
  }
}

// agendar chamada: node-cron/cronJobs.js
import cron from 'node-cron';
cron.schedule('0 2 * * *', checkAndSendTrialExpiration); // todos os dias às 2h da manhã
