import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../src/lib/database';
import crypto from 'crypto';

interface ForgotPasswordRequest {
  email: string;
}

// Função para enviar email (mock por enquanto - pode ser integrada com serviço real)
async function sendPasswordResetEmail(email: string, resetToken: string, userName: string) {
  // Aqui você pode integrar com um serviço de email real como SendGrid, AWS SES, etc.
  console.log('📧 Enviando email de recuperação para:', email);
  console.log('🔗 Token de reset:', resetToken);
  console.log('👤 Nome do usuário:', userName);
  
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/auth/reset-password?token=${resetToken}`;
  console.log('🌐 URL de reset:', resetUrl);
  
  // Mock: simular envio de email
  return {
    success: true,
    messageId: uuidv4(),
    resetUrl // Para debug/teste
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { email }: ForgotPasswordRequest = req.body;

    console.log('🔍 FORGOT PASSWORD REQUEST:', { email });

    if (!email) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuário por email
    const userResult = await query(
      'SELECT id, name, email, is_active FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found for email:', normalizedEmail);
      // Por segurança, sempre retornamos sucesso mesmo se o email não existir
      return res.status(200).json({
        message: 'Se uma conta com este email existir, um link de recuperação foi enviado',
        success: true
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      console.log('❌ User inactive:', user.email);
      return res.status(400).json({ message: 'Conta desativada. Entre em contato com o suporte.' });
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // Expira em 1 hora

    // Salvar token no banco
    await query(
      `UPDATE users 
       SET password_reset_token = $1, password_reset_expires = $2, updated_at = NOW()
       WHERE id = $3`,
      [resetToken, resetExpires, user.id]
    );

    console.log('✅ Reset token generated for user:', user.email);

    // Enviar email de recuperação
    const emailResult = await sendPasswordResetEmail(user.email, resetToken, user.name);

    console.log('📧 Email result:', emailResult);

    res.status(200).json({
      message: 'Se uma conta com este email existir, um link de recuperação foi enviado',
      success: true,
      // Para debug/desenvolvimento - remover em produção
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          resetUrl: emailResult.resetUrl,
          token: resetToken
        }
      })
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
