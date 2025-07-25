import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { query } from '../../../src/lib/database';

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
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
    const { token, newPassword }: ResetPasswordRequest = req.body;

    console.log('🔍 RESET PASSWORD REQUEST:', { 
      token: token?.substring(0, 8) + '...', 
      passwordLength: newPassword?.length 
    });

    if (!token) {
      return res.status(400).json({ message: 'Token é obrigatório' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Nova senha deve ter pelo menos 6 caracteres' });
    }

    // Buscar usuário pelo token de reset
    const userResult = await query(
      `SELECT id, name, email, password_reset_expires 
       FROM users 
       WHERE password_reset_token = $1 AND is_active = true`,
      [token]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Invalid or expired token');
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }

    const user = userResult.rows[0];

    // Verificar se o token não expirou
    const now = new Date();
    const resetExpires = new Date(user.password_reset_expires);

    if (now > resetExpires) {
      console.log('❌ Token expired for user:', user.email);
      return res.status(400).json({ message: 'Token expirado. Solicite um novo link de recuperação.' });
    }

    // Hash da nova senha
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha e limpar token de reset
    await query(
      `UPDATE users 
       SET password_hash = $1, 
           password_reset_token = NULL, 
           password_reset_expires = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [newPasswordHash, user.id]
    );

    console.log('✅ Password reset successful for user:', user.email);

    res.status(200).json({
      message: 'Senha redefinida com sucesso! Você pode agora fazer login com a nova senha.',
      success: true
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    
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
