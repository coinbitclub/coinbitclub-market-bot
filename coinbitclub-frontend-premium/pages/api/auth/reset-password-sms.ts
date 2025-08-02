import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  console.log('🔐 Redefinição de senha via SMS:', req.body);

  try {
    const { phone, code, newPassword } = req.body;

    if (!phone || !code || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'A nova senha deve ter pelo menos 6 caracteres' 
      });
    }

    // Limpar formato do telefone
    const cleanPhone = phone.replace(/\D/g, '');

    // Verificar código no banco de dados
    const tokenResult = await query(
      `SELECT prt.*, u.id as user_id, u.email, u.name 
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.phone = $1 AND prt.token = $2 AND prt.expires_at > NOW()`,
      [cleanPhone, code]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Código inválido ou expirado' 
      });
    }

    const token = tokenResult.rows[0];

    // Hash da nova senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha do usuário
    await query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, token.user_id]
    );

    // Remover token usado
    await query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [token.user_id]
    );

    console.log(`✅ Senha redefinida com sucesso para usuário ${token.user_id}`);

    return res.status(200).json({
      success: true,
      message: 'Senha redefinida com sucesso',
      user: {
        id: token.user_id,
        email: token.email,
        name: token.name,
        phone: cleanPhone
      }
    });

  } catch (error) {
    console.error('❌ Erro ao redefinir senha:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
