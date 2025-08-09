import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { smsService } from '../../../src/lib/sms-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  console.log('📱 Solicitação de verificação SMS para registro:', req.body);

  try {
    const { phone, email } = req.body;

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

    // Verificar se telefone já está cadastrado
    const existingPhone = await query(
      'SELECT id FROM users WHERE phone = $1',
      [cleanPhone]
    );

    if (existingPhone.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Este número de telefone já está cadastrado' 
      });
    }

    // Verificar se email já está cadastrado (se fornecido)
    if (email) {
      const existingEmail = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Este email já está cadastrado' 
        });
      }
    }

    // Gerar código de verificação (6 dígitos)
    const verificationCode = smsService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Criar mensagem SMS
    const message = smsService.createVerificationMessage(verificationCode, 'register');

    // Salvar código na base de dados
    await query(
      `INSERT INTO phone_verification (phone, verification_code, expires_at, verified) 
       VALUES ($1, $2, $3, false)
       ON CONFLICT (phone) 
       DO UPDATE SET 
         verification_code = $2, 
         expires_at = $3, 
         verified = false, 
         created_at = NOW()`,
      [cleanPhone, verificationCode, expiresAt]
    );

    // Enviar SMS usando Twilio
    try {
      const smsResult = await smsService.sendSMS(cleanPhone, message);
      
      if (!smsResult.success) {
        console.error('❌ Erro ao enviar SMS:', smsResult.error);
        return res.status(500).json({
          success: false,
          message: 'Erro ao enviar código SMS'
        });
      }
      
      console.log(`✅ SMS de verificação enviado para ${cleanPhone}`);
      
      return res.status(200).json({
        success: true,
        message: 'Código de verificação enviado por SMS',
        phone: cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '+55 ($1) $2-$3'),
        expiresIn: 15, // minutos
        messageId: smsResult.messageId
      });

    } catch (smsError) {
      console.error('❌ Erro ao enviar SMS:', smsError);
      
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar SMS. Tente novamente.'
      });
    }

  } catch (error) {
    console.error('❌ Erro na verificação SMS:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}
