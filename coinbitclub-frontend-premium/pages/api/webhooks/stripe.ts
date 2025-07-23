import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { query, transaction } from '../../../src/lib/database';
import { sendPaymentConfirmationEmail } from '../../../src/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-06-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const buf = await buffer(req);
    const signature = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, signature, webhookSecret);
    } catch (err) {
      console.error('Erro na verificação do webhook:', err);
      return res.status(400).json({ message: 'Webhook signature verification failed' });
    }

    console.log('Webhook recebido:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

// Processar checkout completado
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.userId;
    const planType = session.metadata?.planType;

    if (!userId || !planType) {
      console.error('Metadata ausente no checkout:', session.metadata);
      return;
    }

    console.log(`Checkout completado para usuário ${userId}, plano ${planType}`);

    // Verificar se já foi processado
    const existingPayment = await query(
      'SELECT id FROM payments WHERE external_payment_id = $1',
      [session.id]
    );

    if (existingPayment.rows.length > 0) {
      console.log('Pagamento já foi processado');
      return;
    }

    await transaction(async (client) => {
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
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

      const subscriptionResult = await client.query(
        `INSERT INTO subscriptions (user_id, plan_type, status, starts_at, ends_at, is_trial, stripe_subscription_id)
         VALUES ($1, $2, 'active', $3, $4, false, $5)
         RETURNING id`,
        [userId, planType, subscriptionStart, subscriptionEnd, session.subscription]
      );

      const subscriptionId = subscriptionResult.rows[0].id;

      // Registrar pagamento
      const planPrices = { basic: 97.00, pro: 197.00, enterprise: 497.00 };
      const amount = planPrices[planType as keyof typeof planPrices];

      await client.query(
        `INSERT INTO payments (user_id, subscription_id, amount, currency, status, payment_method, external_payment_id)
         VALUES ($1, $2, $3, 'BRL', 'completed', 'stripe', $4)`,
        [userId, subscriptionId, amount, session.id]
      );

      // Enviar email de confirmação
      sendPaymentConfirmationEmail(user.email, user.name, planType, amount).catch(err => {
        console.error('Erro ao enviar email:', err);
      });
    });

  } catch (error) {
    console.error('Erro ao processar checkout completado:', error);
  }
}

// Processar pagamento bem-sucedido (renovações)
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    // Buscar subscription ID através do invoice
    const subscriptionId = (invoice as any).subscription;
    
    if (!subscriptionId) {
      console.log('Invoice sem subscription ID');
      return;
    }

    // Buscar assinatura no banco
    const subscriptionResult = await query(
      'SELECT user_id, plan_type FROM subscriptions WHERE stripe_subscription_id = $1',
      [subscriptionId]
    );

    if (subscriptionResult.rows.length === 0) {
      console.log('Subscription não encontrada:', subscriptionId);
      return;
    }

    const { user_id: userId, plan_type: planType } = subscriptionResult.rows[0];

    await transaction(async (client) => {
      // Estender assinatura por mais um mês
      await client.query(
        `UPDATE subscriptions 
         SET ends_at = ends_at + INTERVAL '1 month', updated_at = NOW()
         WHERE stripe_subscription_id = $1`,
        [subscriptionId]
      );

      // Registrar pagamento da renovação
      const amount = (invoice.amount_paid || 0) / 100; // Converter centavos para reais

      await client.query(
        `INSERT INTO payments (user_id, subscription_id, amount, currency, status, payment_method, external_payment_id)
         VALUES ($1, (SELECT id FROM subscriptions WHERE stripe_subscription_id = $2), $3, 'BRL', 'completed', 'stripe', $4)`,
        [userId, subscriptionId, amount, invoice.id]
      );
    });

    console.log(`Pagamento renovado para usuário ${userId}`);

  } catch (error) {
    console.error('Erro ao processar pagamento bem-sucedido:', error);
  }
}

// Processar falha no pagamento
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = (invoice as any).subscription;
    
    if (!subscriptionId) return;

    // Marcar assinatura como pendente
    await query(
      `UPDATE subscriptions 
       SET status = 'past_due', updated_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [subscriptionId]
    );

    console.log(`Pagamento falhou para subscription ${subscriptionId}`);

  } catch (error) {
    console.error('Erro ao processar falha de pagamento:', error);
  }
}

// Processar atualização de assinatura
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const status = subscription.status;
    const subscriptionId = subscription.id;

    await query(
      `UPDATE subscriptions 
       SET status = $1, updated_at = NOW()
       WHERE stripe_subscription_id = $2`,
      [status, subscriptionId]
    );

    console.log(`Subscription ${subscriptionId} atualizada para status ${status}`);

  } catch (error) {
    console.error('Erro ao atualizar subscription:', error);
  }
}

// Processar cancelamento de assinatura
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const subscriptionId = subscription.id;

    await query(
      `UPDATE subscriptions 
       SET status = 'cancelled', updated_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [subscriptionId]
    );

    console.log(`Subscription ${subscriptionId} cancelada`);

  } catch (error) {
    console.error('Erro ao cancelar subscription:', error);
  }
}
