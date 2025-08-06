import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { smsService } from '../../../src/lib/sms-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  console.log('🔑 Solicitação de recuperação de senha via SMS:', req.body);

  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Número de telefone é obrigatório' 
      });
    }

    // Validar formato do telefone
    const phoneRegex = /^(?:\+55|55)?(?:\d{2})(?:\d{4,5})(?:\d{4})$/;
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Formato de telefone inválido' 
      });
    }

    // Verificar se existe usuário com esse telefone
    const userResult = await query(
      'SELECT id, email, name FROM users WHERE phone = $1',
      [cleanPhone]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado com este número de telefone' 
      });
    }

    const user = userResult.rows[0];

    // Gerar código de verificação
    const verificationCode = smsService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Armazenar código no banco de dados
    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at, phone) 
       VALUES ($1, $2, $3, NOW(), $4)
       ON CONFLICT (user_id) 
       DO UPDATE SET token = $2, expires_at = $3, created_at = NOW(), phone = $4`,
      [user.id, verificationCode, expiresAt, cleanPhone]
    );

    // Enviar SMS via Twilio
    const message = smsService.createVerificationMessage(verificationCode, 'recovery');
    const smsResult = await smsService.sendSMS(cleanPhone, message);

    if (!smsResult.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao enviar SMS de verificação',
        error: smsResult.error 
      });
    }

    console.log(`✅ Código de recuperação enviado via SMS para ${cleanPhone}`);

    return res.status(200).json({
      success: true,
      message: 'Código de verificação enviado via SMS',
      messageId: smsResult.messageId
    });

  } catch (error) {
    console.error('❌ Erro ao processar recuperação de senha:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
