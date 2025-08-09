import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  console.log('✅ Confirmação de código SMS:', req.body);

  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Telefone e código são obrigatórios' 
      });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    // Verificar código de verificação
    const verificationResult = await query(
      `SELECT * FROM phone_verification 
       WHERE phone = $1 AND verification_code = $2 AND verified = false AND expires_at > NOW()`,
      [cleanPhone, code]
    );

    if (verificationResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Código inválido ou expirado' 
      });
    }

    // Marcar telefone como verificado
    await query(
      'UPDATE phone_verification SET verified = true WHERE phone = $1 AND verification_code = $2',
      [cleanPhone, code]
    );

    console.log(`✅ Telefone verificado: ${cleanPhone}`);

    return res.status(200).json({
      success: true,
      message: 'Telefone verificado com sucesso',
      phone: cleanPhone
    });

  } catch (error) {
    console.error('❌ Erro na confirmação do código:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}
