import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  console.log('🔍 Verificação de código de recuperação:', req.body);

  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Telefone e código são obrigatórios' 
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

    console.log(`✅ Código de recuperação verificado para usuário ${token.user_id}`);

    return res.status(200).json({
      success: true,
      message: 'Código verificado com sucesso',
      user: {
        id: token.user_id,
        email: token.email,
        name: token.name,
        phone: cleanPhone
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar código de recuperação:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
