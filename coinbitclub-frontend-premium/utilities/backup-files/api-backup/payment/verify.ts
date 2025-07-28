import { NextApiRequest, NextApiResponse } from 'next';
import { verifyPaymentStatus } from '../../../src/lib/stripe';
import { query, transaction } from '../../../src/lib/database';
import { sendPaymentConfirmationEmail } from '../../../src/lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ message: 'Session ID é obrigatório' });
    }

    // Verificar status do pagamento no Stripe
    const paymentInfo = await verifyPaymentStatus(session_id);

    if (paymentInfo.status !== 'paid') {
      return res.status(400).json({ 
        message: 'Pagamento não foi confirmado',
        status: paymentInfo.status 
      });
    }

    const userId = paymentInfo.metadata?.userId;
    const planType = paymentInfo.metadata?.planType;

    if (!userId || !planType) {
      return res.status(400).json({ message: 'Dados de pagamento inválidos' });
    }

    // Verificar se já foi processado
    const existingPayment = await query(
      'SELECT id FROM payments WHERE external_payment_id = $1',
      [session_id]
    );

    if (existingPayment.rows.length > 0) {
      return res.status(200).json({ 
        message: 'Pagamento já foi processado',
        alreadyProcessed: true 
      });
    }

    // Processar pagamento e atualizar assinatura
    const result = await transaction(async (client) => {
      // Buscar usuário
      const userResult = await client.query(
        'SELECT name, email FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      const user = userResult.rows[0];

      // Cancelar assinatura trial atual
      await client.query(
        `UPDATE subscriptions 
         SET status = 'cancelled', updated_at = NOW() 
         WHERE user_id = $1 AND status = 'active'`,
        [userId]
      );

      // Criar nova assinatura paga
      const subscriptionStart = new Date();
      const subscriptionEnd = new Date();
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1); // 1 mês

      const subscriptionResult = await client.query(
        `INSERT INTO subscriptions (user_id, plan_type, status, starts_at, ends_at, is_trial, stripe_subscription_id)
         VALUES ($1, $2, 'active', $3, $4, false, $5)
         RETURNING id`,
        [userId, planType, subscriptionStart, subscriptionEnd, 
         typeof paymentInfo.subscription === 'string' ? paymentInfo.subscription : paymentInfo.subscription?.id]
      );

      const subscriptionId = subscriptionResult.rows[0].id;

      // Registrar pagamento
      const planPrices = { basic: 97.00, pro: 197.00, enterprise: 497.00 };
      const amount = planPrices[planType as keyof typeof planPrices];

      await client.query(
        `INSERT INTO payments (user_id, subscription_id, amount, currency, status, payment_method, external_payment_id, payment_intent_id)
         VALUES ($1, $2, $3, 'BRL', 'completed', 'stripe', $4, $5)`,
        [userId, subscriptionId, amount, session_id, 
         typeof paymentInfo.subscription === 'object' ? paymentInfo.subscription?.latest_invoice : null]
      );

      // Log de auditoria
      await client.query(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address)
         VALUES ($1, 'PAYMENT_COMPLETED', 'payments', $2, $3, $4)`,
        [
          userId,
          session_id,
          JSON.stringify({ planType, amount, status: 'completed' }),
          'stripe-webhook'
        ]
      );

      return { user, amount, planType };
    });

    // Enviar email de confirmação (não bloquear resposta)
    sendPaymentConfirmationEmail(
      result.user.email,
      result.user.name,
      result.planType,
      result.amount
    ).catch(err => {
      console.error('Erro ao enviar email de confirmação:', err);
    });

    res.status(200).json({
      message: 'Pagamento processado com sucesso!',
      planType: result.planType,
      amount: result.amount,
      subscriptionActive: true
    });

  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor. Tente novamente.' 
    });
  }
}
