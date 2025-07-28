import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateRequest } from '../../../src/lib/jwt';
import { query } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Verificar token
    const payload = authenticateRequest(req);

    // Buscar dados atualizados do usuário
    const userResult = await query(
      `SELECT 
        u.id, u.name, u.email, u.is_active, u.is_admin,
        s.plan_type, s.status as subscription_status, s.ends_at as subscription_ends_at, s.is_trial
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
       WHERE u.id = $1 AND u.is_active = true`,
      [payload.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Usuário não encontrado ou inativo' });
    }

    const user = userResult.rows[0];

    // Calcular status da assinatura
    let isTrialActive = false;
    let trialDaysRemaining = 0;
    let subscriptionStatus = 'expired';

    if (user.subscription_status === 'active') {
      subscriptionStatus = user.subscription_status;
      
      if (user.is_trial && user.subscription_ends_at) {
        const trialEnd = new Date(user.subscription_ends_at);
        const now = new Date();
        
        if (trialEnd > now) {
          isTrialActive = true;
          const diffTime = trialEnd.getTime() - now.getTime();
          trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else {
          subscriptionStatus = 'expired';
        }
      }
    }

    res.status(200).json({
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin,
        isTrialActive,
        trialDaysRemaining,
        subscriptionStatus,
        subscriptionType: user.plan_type || 'none'
      }
    });

  } catch (error) {
    console.error('Erro na validação:', error);
    res.status(401).json({ 
      valid: false,
      message: error instanceof Error ? error.message : 'Token inválido'
    });
  }
}
