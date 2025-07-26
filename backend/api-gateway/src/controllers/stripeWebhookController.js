import { query } from '../config/database.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class StripeWebhookController {
  // POST /stripe/webhook - Webhook principal do Stripe
  async handleStripeWebhook(req, res) {
    try {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Processar eventos do Stripe
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handleSubscriptionPayment(event.data.object);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });

    } catch (error) {
      console.error('Erro no webhook Stripe:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Processar pagamento de saldo pré-pago bem-sucedido
  async handlePaymentSucceeded(paymentIntent) {
    try {
      const { customer, amount, currency, metadata } = paymentIntent;

      // Buscar usuário pelo customer ID
      const userResult = await query(`
        SELECT id FROM users WHERE stripe_customer_id = $1
      `, [customer]);

      if (userResult.rows.length === 0) {
        console.error('Usuário não encontrado para customer:', customer);
        return;
      }

      const userId = userResult.rows[0].id;
      const amountDecimal = amount / 100; // Stripe usa centavos
      const currencyUpper = currency.toUpperCase();

      // Registrar transação de depósito
      await query(`
        INSERT INTO prepaid_transactions (
          user_id, type, amount, currency, description, 
          stripe_payment_intent_id, status, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        userId,
        'deposit',
        amountDecimal,
        currencyUpper,
        'Recarga de saldo via Stripe',
        paymentIntent.id,
        'completed',
        JSON.stringify(metadata)
      ]);

      console.log(`Saldo recarregado: ${amountDecimal} ${currencyUpper} para usuário ${userId}`);

    } catch (error) {
      console.error('Erro ao processar pagamento de saldo:', error);
    }
  }

  // Processar pagamento de assinatura
  async handleSubscriptionPayment(invoice) {
    try {
      const { customer, subscription, amount_paid, currency } = invoice;

      // Buscar usuário
      const userResult = await query(`
        SELECT id FROM users WHERE stripe_customer_id = $1
      `, [customer]);

      if (userResult.rows.length === 0) return;

      const userId = userResult.rows[0].id;
      const amountDecimal = amount_paid / 100;

      // Registrar pagamento
      await query(`
        INSERT INTO payments (
          user_id, stripe_payment_intent_id, type, status, 
          amount, currency, payment_method, metadata, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        userId,
        invoice.payment_intent,
        'subscription',
        'succeeded',
        amountDecimal,
        currency.toUpperCase(),
        'stripe',
        JSON.stringify({ subscription_id: subscription }),
        new Date()
      ]);

      // Atualizar assinatura
      await this.updateUserSubscription(userId, subscription);

    } catch (error) {
      console.error('Erro ao processar pagamento de assinatura:', error);
    }
  }

  // Atualizar status da assinatura
  async handleSubscriptionUpdate(subscription) {
    try {
      const { customer, status, current_period_start, current_period_end } = subscription;

      // Buscar usuário
      const userResult = await query(`
        SELECT id FROM users WHERE stripe_customer_id = $1
      `, [customer]);

      if (userResult.rows.length === 0) return;

      const userId = userResult.rows[0].id;

      // Atualizar assinatura
      await query(`
        UPDATE user_subscriptions 
        SET 
          status = $1,
          data_inicio = $2,
          data_fim = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $4 AND stripe_subscription_id = $5
      `, [
        this.mapStripeStatus(status),
        new Date(current_period_start * 1000),
        new Date(current_period_end * 1000),
        userId,
        subscription.id
      ]);

    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
    }
  }

  // Cancelar assinatura
  async handleSubscriptionCanceled(subscription) {
    try {
      const { customer } = subscription;

      const userResult = await query(`
        SELECT id FROM users WHERE stripe_customer_id = $1
      `, [customer]);

      if (userResult.rows.length === 0) return;

      const userId = userResult.rows[0].id;

      await query(`
        UPDATE user_subscriptions 
        SET 
          status = 'cancelada',
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND stripe_subscription_id = $2
      `, [userId, subscription.id]);

    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
    }
  }

  // Processar falha de pagamento
  async handlePaymentFailed(paymentIntent) {
    try {
      const { customer, last_payment_error } = paymentIntent;

      // Registrar falha
      await query(`
        INSERT INTO payment_failures (
          stripe_customer_id, stripe_payment_intent_id,
          error_message, created_at
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      `, [
        customer,
        paymentIntent.id,
        last_payment_error?.message || 'Pagamento falhou'
      ]);

    } catch (error) {
      console.error('Erro ao processar falha de pagamento:', error);
    }
  }

  // POST /stripe/create-payment-intent - Criar intenção de pagamento para saldo
  async createPaymentIntent(req, res) {
    try {
      const userId = req.user.id;
      const { amount, currency = 'usd', description } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valor inválido'
        });
      }

      // Buscar ou criar customer
      const customer = await this.getOrCreateStripeCustomer(userId);

      // Criar payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Converter para centavos
        currency: currency.toLowerCase(),
        customer: customer.id,
        description: description || 'Recarga de saldo pré-pago',
        metadata: {
          user_id: userId,
          type: 'prepaid_balance'
        }
      });

      res.json({
        success: true,
        data: {
          client_secret: paymentIntent.client_secret,
          amount: amount,
          currency: currency
        }
      });

    } catch (error) {
      console.error('Erro ao criar payment intent:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Métodos auxiliares
  async getOrCreateStripeCustomer(userId) {
    try {
      // Verificar se já existe
      const userResult = await query(`
        SELECT stripe_customer_id, email FROM users WHERE id = $1
      `, [userId]);

      const user = userResult.rows[0];

      if (user.stripe_customer_id) {
        return await stripe.customers.retrieve(user.stripe_customer_id);
      }

      // Criar novo customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: userId
        }
      });

      // Salvar customer ID
      await query(`
        UPDATE users 
        SET stripe_customer_id = $1 
        WHERE id = $2
      `, [customer.id, userId]);

      return customer;

    } catch (error) {
      console.error('Erro ao criar/buscar customer:', error);
      throw error;
    }
  }

  async updateUserSubscription(userId, stripeSubscriptionId) {
    try {
      // Buscar dados da assinatura no Stripe
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      const { status, current_period_start, current_period_end } = subscription;

      await query(`
        UPDATE user_subscriptions 
        SET 
          status = $1,
          data_inicio = $2,
          data_fim = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $4 AND stripe_subscription_id = $5
      `, [
        this.mapStripeStatus(status),
        new Date(current_period_start * 1000),
        new Date(current_period_end * 1000),
        userId,
        stripeSubscriptionId
      ]);

    } catch (error) {
      console.error('Erro ao atualizar subscription:', error);
    }
  }

  mapStripeStatus(stripeStatus) {
    const statusMap = {
      'active': 'ativa',
      'trialing': 'trial',
      'past_due': 'pendente',
      'canceled': 'cancelada',
      'unpaid': 'pendente'
    };
    return statusMap[stripeStatus] || 'inativa';
  }
}

export default new StripeWebhookController();
