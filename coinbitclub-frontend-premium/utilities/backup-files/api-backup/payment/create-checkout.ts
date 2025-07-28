import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateRequest } from '../../../src/lib/jwt';
import { createCheckoutSession, PLANS } from '../../../src/lib/stripe';
import { query } from '../../../src/lib/database';

interface CreateCheckoutRequest {
  planType: 'basic' | 'pro' | 'enterprise';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const userPayload = authenticateRequest(req);

    const { planType }: CreateCheckoutRequest = req.body;

    if (!planType || !PLANS[planType]) {
      return res.status(400).json({ message: 'Tipo de plano inválido' });
    }

    // Buscar dados do usuário
    const userResult = await query(
      'SELECT name, email FROM users WHERE id = $1',
      [userPayload.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const user = userResult.rows[0];

    // URLs de sucesso e cancelamento
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/upgrade?cancelled=true`;

    // Criar sessão de checkout
    const session = await createCheckoutSession(
      userPayload.userId,
      user.email,
      user.name,
      planType,
      successUrl,
      cancelUrl
    );

    // Log da tentativa de pagamento
    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address)
       VALUES ($1, 'PAYMENT_ATTEMPT', 'payments', $2, $3, $4)`,
      [
        userPayload.userId,
        session.id,
        JSON.stringify({ planType, sessionId: session.id }),
        req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
      ]
    );

    res.status(200).json({
      sessionId: session.id,
      url: session.url,
      planType,
      amount: PLANS[planType].price / 100 // Converter centavos para reais
    });

  } catch (error) {
    console.error('Erro ao criar checkout:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor. Tente novamente.' 
    });
  }
}
