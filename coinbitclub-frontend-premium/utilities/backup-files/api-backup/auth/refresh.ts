import { NextApiRequest, NextApiResponse } from 'next';
import { verifyRefreshToken, generateTokenPair } from '../../../src/lib/jwt';
import { query } from '../../../src/lib/database';

interface RefreshRequest {
  refreshToken: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { refreshToken }: RefreshRequest = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token é obrigatório' });
    }

    // Verificar refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Buscar usuário no banco
    const userResult = await query(
      `SELECT 
        u.id, u.email, u.is_active, u.is_admin,
        s.status as subscription_status
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
       WHERE u.id = $1 AND u.is_active = true`,
      [payload.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Usuário não encontrado ou inativo' });
    }

    const user = userResult.rows[0];

    // Gerar novos tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin,
      subscriptionStatus: user.subscription_status || 'expired'
    });

    res.status(200).json({
      message: 'Tokens renovados com sucesso',
      tokens
    });

  } catch (error) {
    console.error('Erro no refresh:', error);
    res.status(401).json({ 
      message: error instanceof Error ? error.message : 'Refresh token inválido'
    });
  }
}
