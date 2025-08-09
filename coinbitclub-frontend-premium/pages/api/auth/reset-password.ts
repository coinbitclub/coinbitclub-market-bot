import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token e nova senha são obrigatórios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres' });
  }

  try {
    console.log('🔑 Processando reset de senha com token:', token);

    // Verificar se o token existe e é válido
    const tokenResult = await pool.query(
      `SELECT prt.*, u.id as user_id, u.email 
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = $1 AND prt.expires_at > NOW() AND prt.used = FALSE`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      console.log('❌ Token inválido ou expirado:', token);
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }

    const resetData = tokenResult.rows[0];
    console.log('✅ Token válido para usuário:', resetData.email);

    // Hash da nova senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Atualizar senha do usuário
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, resetData.user_id]
    );

    // Marcar token como usado
    await pool.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token = $1',
      [token]
    );

    console.log('✅ Senha alterada com sucesso para usuário:', resetData.email);

    res.status(200).json({ 
      success: true, 
      message: 'Senha alterada com sucesso!' 
    });

  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
