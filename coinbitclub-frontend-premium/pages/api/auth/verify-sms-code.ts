import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  console.log('🔐 Verificação de código SMS:', req.body);

  try {
    const { phone, code, newPassword } = req.body;

    if (!phone || !code || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Telefone, código e nova senha são obrigatórios' 
      });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    // Verificar código de recuperação
    const recoveryResult = await query(
      `SELECT r.*, u.id as user_id, u.email, u.name 
       FROM password_recovery_sms r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.phone = $1 AND r.recovery_code = $2 AND r.used = false AND r.expires_at > NOW()`,
      [cleanPhone, code]
    );

    if (recoveryResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Código inválido ou expirado' 
      });
    }

    const recovery = recoveryResult.rows[0];

    // Validar nova senha
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nova senha deve ter pelo menos 6 caracteres' 
      });
    }

    // Criptografar nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Atualizar senha do usuário
    await query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, recovery.user_id]
    );

    // Marcar código como usado
    await query(
      'UPDATE password_recovery_sms SET used = true WHERE id = $1',
      [recovery.id]
    );

    console.log(`✅ Senha alterada via SMS para usuário: ${recovery.email}`);

    return res.status(200).json({
      success: true,
      message: 'Senha alterada com sucesso',
      user: {
        email: recovery.email,
        name: recovery.name
      }
    });

  } catch (error) {
    console.error('❌ Erro na verificação do código SMS:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}
