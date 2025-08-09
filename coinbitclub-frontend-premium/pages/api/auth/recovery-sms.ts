import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { smsService } from '../../../src/lib/sms-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  console.log('📱 Solicitação de recuperação por SMS:', req.body);

  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Número de telefone é obrigatório' 
      });
    }

    // Validar formato do telefone (brasileiro)
    const phoneRegex = /^(?:\+55|55)?(?:\d{2})(?:\d{4,5})(?:\d{4})$/;
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Formato de telefone inválido' 
      });
    }

    // Verificar se existe usuário com este telefone
    const userResult = await query(
      'SELECT id, email, name FROM users WHERE phone = $1',
      [cleanPhone]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Número de telefone não encontrado em nossa base' 
      });
    }

    const user = userResult.rows[0];

    // Gerar código de recuperação
    const recoveryCode = smsService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Criar mensagem SMS
    const message = smsService.createVerificationMessage(recoveryCode, 'recovery');

    // Salvar código na base de dados
    await query(
      `INSERT INTO password_recovery_sms (user_id, phone, recovery_code, expires_at, used) 
       VALUES ($1, $2, $3, $4, false)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         recovery_code = $3, 
         expires_at = $4, 
         used = false, 
         created_at = NOW()`,
      [user.id, cleanPhone, recoveryCode, expiresAt]
    );

    // Enviar SMS usando Twilio
    try {
      const smsResult = await smsService.sendSMS(cleanPhone, message);
      
      if (!smsResult.success) {
        console.error('❌ Erro ao enviar SMS de recuperação:', smsResult.error);
        return res.status(500).json({
          success: false,
          message: 'Erro ao enviar código SMS'
        });
      }
      
      console.log(`✅ SMS de recuperação enviado para ${cleanPhone}`);
      
      return res.status(200).json({
        success: true,
        message: 'Código de recuperação enviado por SMS',
        phone: cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '+55 ($1) $2-$3'),
        expiresIn: 15 // minutos
      });

    } catch (smsError) {
      console.error('❌ Erro ao enviar SMS:', smsError);
      
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar SMS. Tente novamente.'
      });
    }

  } catch (error) {
    console.error('❌ Erro na recuperação por SMS:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}
