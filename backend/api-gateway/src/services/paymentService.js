import Stripe from 'stripe';
import { db } from '../../../common/db.js';
import { env } from '../../../common/env.js';
import logger from '../../../common/logger.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export class PaymentService {
  /**
   * Criar pagamento pré-pago
   */
  static async createPrepaidPayment(userId, amount, currency = 'BRL', paymentMethodId = null) {
    try {
      // Buscar usuário
      const user = await db('users').where({ id: userId }).first();
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Criar ou buscar customer no Stripe
      let stripeCustomer = await this.getOrCreateStripeCustomer(user);

      // Calcular bônus se aplicável
      const bonus = await this.calculatePrepaidBonus(amount);
      const totalCreditAmount = amount + bonus;

      // Criar PaymentIntent no Stripe
      const paymentIntentData = {
        amount: Math.round(amount * 100), // Stripe usa centavos
        currency: currency.toLowerCase(),
        customer: stripeCustomer.id,
        metadata: {
          userId: userId.toString(),
          type: 'prepaid',
          original_amount: amount.toString(),
          bonus_amount: bonus.toString(),
          total_credit: totalCreditAmount.toString()
        },
        description: `Recarga pré-paga - ${user.name}`
      };

      if (paymentMethodId) {
        paymentIntentData.payment_method = paymentMethodId;
        paymentIntentData.confirmation_method = 'manual';
        paymentIntentData.confirm = true;
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      // Salvar pagamento no banco
      const [payment] = await db('payments').insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        type: 'prepaid',
        status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'pending',
        amount,
        currency,
        payment_method: paymentMethodId ? 'card' : null,
        payment_method_id: paymentMethodId,
        description: `Recarga pré-paga de ${currency} ${amount}`,
        metadata: {
          bonus_amount: bonus,
          total_credit: totalCreditAmount,
          stripe_payment_intent: paymentIntent.id
        },
        paid_at: paymentIntent.status === 'succeeded' ? new Date() : null
      }).returning('*');

      // Se pagamento foi bem sucedido, creditar saldo
      if (paymentIntent.status === 'succeeded') {
        await this.creditPrepaidBalance(userId, totalCreditAmount, currency, payment.id, 'Recarga pré-paga');
      }

      return {
        payment,
        paymentIntent,
        bonusAmount: bonus,
        totalCredit: totalCreditAmount
      };

    } catch (error) {
      logger.error({ error, userId, amount }, 'Erro ao criar pagamento pré-pago');
      throw error;
    }
  }

  /**
   * Processar pagamento de assinatura
   */
  static async createSubscriptionPayment(userId, planId, paymentMethodId) {
    try {
      const user = await db('users').where({ id: userId }).first();
      const plan = await db('plans').where({ id: planId, active: true }).first();

      if (!user || !plan) {
        throw new Error('Usuário ou plano não encontrado');
      }

      // Verificar se já tem assinatura ativa
      const existingSubscription = await db('subscriptions')
        .where({ user_id: userId, status: 'active' })
        .first();

      if (existingSubscription) {
        throw new Error('Usuário já possui uma assinatura ativa');
      }

      let stripeCustomer = await this.getOrCreateStripeCustomer(user);

      // Anexar método de pagamento
      if (paymentMethodId) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: stripeCustomer.id
        });

        await stripe.customers.update(stripeCustomer.id, {
          invoice_settings: { default_payment_method: paymentMethodId }
        });
      }

      // Criar assinatura no Stripe
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: plan.stripe_price_id_monthly }], // ou yearly conforme escolha
        default_payment_method: paymentMethodId,
        metadata: {
          userId: userId.toString(),
          planId: planId.toString()
        }
      });

      // Salvar assinatura no banco
      const [subscriptionRecord] = await db('subscriptions').insert({
        user_id: userId,
        plan_id: planId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: stripeCustomer.id,
        status: subscription.status,
        billing_cycle: 'monthly',
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000)
      }).returning('*');

      // Criar registro de pagamento
      const [payment] = await db('payments').insert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        type: 'subscription',
        status: subscription.status === 'active' ? 'succeeded' : 'pending',
        amount: plan.price_monthly,
        currency: 'BRL',
        payment_method: 'card',
        payment_method_id: paymentMethodId,
        description: `Assinatura ${plan.name}`,
        metadata: {
          subscription_id: subscription.id,
          plan_id: planId
        }
      }).returning('*');

      // Processar comissão de afiliado se aplicável
      if (user.affiliate_id) {
        await this.processAffiliateCommission(user.affiliate_id, userId, plan.price_monthly, 'subscription');
      }

      return {
        subscription: subscriptionRecord,
        payment,
        stripeSubscription: subscription
      };

    } catch (error) {
      logger.error({ error, userId, planId }, 'Erro ao criar pagamento de assinatura');
      throw error;
    }
  }

  /**
   * Creditar saldo pré-pago
   */
  static async creditPrepaidBalance(userId, amount, currency = 'BRL', paymentId = null, description = 'Crédito') {
    return await db.transaction(async (trx) => {
      // Buscar ou criar saldo do usuário
      let userBalance = await trx('user_prepaid_balance')
        .where({ user_id: userId, currency })
        .first();

      if (!userBalance) {
        [userBalance] = await trx('user_prepaid_balance').insert({
          user_id: userId,
          balance: 0,
          currency
        }).returning('*');
      }

      const balanceBefore = parseFloat(userBalance.balance);
      const balanceAfter = balanceBefore + amount;

      // Atualizar saldo
      await trx('user_prepaid_balance')
        .where({ user_id: userId, currency })
        .update({
          balance: balanceAfter,
          last_transaction_at: new Date()
        });

      // Registrar transação
      await trx('prepaid_transactions').insert({
        user_id: userId,
        payment_id: paymentId,
        type: 'credit',
        amount,
        currency,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description,
        reference_id: paymentId
      });

      return balanceAfter;
    });
  }

  /**
   * Debitar saldo pré-pago
   */
  static async debitPrepaidBalance(userId, amount, currency = 'BRL', description = 'Débito', referenceId = null) {
    return await db.transaction(async (trx) => {
      const userBalance = await trx('user_prepaid_balance')
        .where({ user_id: userId, currency })
        .first();

      if (!userBalance || parseFloat(userBalance.balance) < amount) {
        throw new Error('Saldo insuficiente');
      }

      const balanceBefore = parseFloat(userBalance.balance);
      const balanceAfter = balanceBefore - amount;

      // Atualizar saldo
      await trx('user_prepaid_balance')
        .where({ user_id: userId, currency })
        .update({
          balance: balanceAfter,
          last_transaction_at: new Date()
        });

      // Registrar transação
      await trx('prepaid_transactions').insert({
        user_id: userId,
        type: 'debit',
        amount,
        currency,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description,
        reference_id: referenceId
      });

      return balanceAfter;
    });
  }

  /**
   * Buscar ou criar customer no Stripe
   */
  static async getOrCreateStripeCustomer(user) {
    try {
      // Buscar customer existente
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });

      if (customers.data.length > 0) {
        return customers.data[0];
      }

      // Criar novo customer
      return await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id.toString() }
      });

    } catch (error) {
      logger.error({ error, userId: user.id }, 'Erro ao buscar/criar customer no Stripe');
      throw error;
    }
  }

  /**
   * Calcular bônus para recarga pré-paga
   */
  static async calculatePrepaidBonus(amount) {
    try {
      const settings = await db('payment_settings')
        .where({ key: 'prepaid_bonus' })
        .first();

      if (!settings || !settings.value.enabled) {
        return 0;
      }

      const tiers = settings.value.tiers;
      let bonusPercentage = 0;

      // Encontrar o tier aplicável (maior valor que o amount satisfaz)
      for (const tier of tiers) {
        if (amount >= tier.minimum) {
          bonusPercentage = tier.bonus_percentage;
        }
      }

      return (amount * bonusPercentage) / 100;

    } catch (error) {
      logger.error({ error, amount }, 'Erro ao calcular bônus pré-pago');
      return 0;
    }
  }

  /**
   * Processar comissão de afiliado
   */
  static async processAffiliateCommission(affiliateId, userId, amount, type = 'subscription') {
    try {
      const commissionRate = 0.15; // 15%
      const commissionAmount = amount * commissionRate;

      await db('affiliate_commissions').insert({
        user_id: userId,
        affiliate_id: affiliateId,
        commission_amount: commissionAmount,
        commission_rate: commissionRate,
        commission_type: type,
        status: 'pending',
        metadata: {
          original_amount: amount,
          commission_rate: commissionRate
        }
      });

      logger.info({ 
        affiliateId, 
        userId, 
        commissionAmount 
      }, 'Comissão de afiliado criada');

    } catch (error) {
      logger.error({ error, affiliateId, userId }, 'Erro ao processar comissão de afiliado');
    }
  }

  /**
   * Obter saldo pré-pago do usuário
   */
  static async getUserPrepaidBalance(userId, currency = 'BRL') {
    const balance = await db('user_prepaid_balance')
      .where({ user_id: userId, currency })
      .first();

    return balance ? parseFloat(balance.balance) : 0;
  }

  /**
   * Listar transações pré-pagas do usuário
   */
  static async getUserPrepaidTransactions(userId, { page = 1, limit = 20, type = null } = {}) {
    const offset = (page - 1) * limit;
    
    let query = db('prepaid_transactions')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (type) {
      query = query.where({ type });
    }

    const transactions = await query;
    
    const totalQuery = db('prepaid_transactions')
      .where({ user_id: userId })
      .count('* as total');
    
    if (type) {
      totalQuery.where({ type });
    }

    const [{ total }] = await totalQuery;

    return {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        pages: Math.ceil(total / limit)
      }
    };
  }
}
