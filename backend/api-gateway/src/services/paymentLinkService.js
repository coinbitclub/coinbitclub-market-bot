import Stripe from 'stripe';
import { db } from '../../../common/db.js';
import logger from '../../../common/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Serviço para criação de links de pagamento Stripe
 * Links diretos para pagamento sem necessidade de frontend complexo
 */
export class PaymentLinkService {
  
  /**
   * Criar link de pagamento para recarga pré-paga
   */
  static async createPrepaidPaymentLink(userId, amount, currency = 'BRL', options = {}) {
    try {
      const user = await db('users').where({ id: userId }).first();
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Calcular bônus
      const bonus = this.calculateBonus(amount, currency);
      const totalCredit = amount + bonus;

      // Criar produto no Stripe
      const product = await stripe.products.create({
        name: `Recarga de Saldo - ${user.name}`,
        description: `Recarga de ${currency} ${amount.toFixed(2)} + Bônus ${currency} ${bonus.toFixed(2)} = Total ${currency} ${totalCredit.toFixed(2)}`,
        metadata: {
          user_id: userId.toString(),
          type: 'prepaid_recharge',
          original_amount: amount.toString(),
          bonus_amount: bonus.toString(),
          total_credit: totalCredit.toString(),
          currency: currency
        }
      });

      // Criar preço
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(amount * 100), // Stripe usa centavos
        currency: currency.toLowerCase(),
        metadata: {
          user_id: userId.toString(),
          bonus_amount: bonus.toString()
        }
      });

      // Criar link de pagamento
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [{
          price: price.id,
          quantity: 1
        }],
        after_completion: {
          type: 'redirect',
          redirect: {
            url: `${process.env.FRONTEND_URL}/payment/success?type=prepaid&amount=${amount}&bonus=${bonus}`
          }
        },
        metadata: {
          user_id: userId.toString(),
          payment_type: 'prepaid',
          original_amount: amount.toString(),
          bonus_amount: bonus.toString(),
          currency: currency
        },
        automatic_tax: { enabled: false },
        billing_address_collection: 'auto',
        shipping_address_collection: {
          allowed_countries: currency === 'BRL' ? ['BR'] : ['US', 'GB', 'CA']
        }
      });

      // Salvar no banco
      const paymentRecord = await db('payments').insert({
        user_id: userId,
        type: 'prepaid',
        amount: amount,
        currency: currency,
        status: 'pending',
        description: `Recarga pré-paga via link de pagamento`,
        metadata: JSON.stringify({
          stripe_product_id: product.id,
          stripe_price_id: price.id,
          stripe_payment_link_id: paymentLink.id,
          bonus_amount: bonus,
          total_credit: totalCredit,
          link_created_at: new Date()
        })
      }).returning('id');

      logger.info('Link de pagamento criado:', {
        userId,
        amount,
        currency,
        bonus,
        paymentLinkId: paymentLink.id
      });

      return {
        payment_id: paymentRecord[0].id,
        payment_link_url: paymentLink.url,
        amount: amount,
        bonus: bonus,
        total_credit: totalCredit,
        currency: currency,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        instructions: {
          pt: 'Clique no link para realizar o pagamento. Após a confirmação, seu saldo será creditado automaticamente.',
          en: 'Click the link to make the payment. After confirmation, your balance will be credited automatically.'
        }
      };

    } catch (error) {
      logger.error('Erro ao criar link de pagamento:', error);
      throw error;
    }
  }

  /**
   * Criar link de pagamento para assinatura
   */
  static async createSubscriptionPaymentLink(userId, planId, currency = 'BRL') {
    try {
      const [user, plan] = await Promise.all([
        db('users').where({ id: userId }).first(),
        db('plans').where({ id: planId }).first()
      ]);

      if (!user) throw new Error('Usuário não encontrado');
      if (!plan) throw new Error('Plano não encontrado');

      // Buscar ou criar customer no Stripe
      let stripeCustomer;
      if (user.stripe_customer_id) {
        stripeCustomer = await stripe.customers.retrieve(user.stripe_customer_id);
      } else {
        stripeCustomer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            user_id: userId.toString(),
            internal_id: userId.toString()
          }
        });

        // Salvar customer ID no usuário
        await db('users').where({ id: userId }).update({
          stripe_customer_id: stripeCustomer.id
        });
      }

      // Buscar ou criar produto/preço no Stripe para o plano
      let stripePrice;
      if (plan.stripe_price_id) {
        stripePrice = await stripe.prices.retrieve(plan.stripe_price_id);
      } else {
        // Criar produto
        const product = await stripe.products.create({
          name: plan.name,
          description: plan.description,
          metadata: {
            plan_id: planId.toString(),
            internal_plan_id: planId.toString()
          }
        });

        // Criar preço
        stripePrice = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(plan.price * 100),
          currency: currency.toLowerCase(),
          recurring: {
            interval: plan.billing_cycle || 'month'
          },
          metadata: {
            plan_id: planId.toString()
          }
        });

        // Salvar IDs no plano
        await db('plans').where({ id: planId }).update({
          stripe_product_id: product.id,
          stripe_price_id: stripePrice.id
        });
      }

      // Criar checkout session para assinatura
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomer.id,
        payment_method_types: ['card'],
        line_items: [{
          price: stripePrice.id,
          quantity: 1
        }],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/payment/success?type=subscription&plan=${planId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel?type=subscription&plan=${planId}`,
        metadata: {
          user_id: userId.toString(),
          plan_id: planId.toString(),
          payment_type: 'subscription',
          currency: currency
        },
        subscription_data: {
          metadata: {
            user_id: userId.toString(),
            plan_id: planId.toString(),
            internal_plan_id: planId.toString()
          }
        }
      });

      // Salvar no banco
      const paymentRecord = await db('payments').insert({
        user_id: userId,
        type: 'subscription',
        amount: plan.price,
        currency: currency,
        status: 'pending',
        description: `Assinatura do plano ${plan.name}`,
        metadata: JSON.stringify({
          plan_id: planId,
          stripe_session_id: session.id,
          stripe_customer_id: stripeCustomer.id,
          stripe_price_id: stripePrice.id,
          billing_cycle: plan.billing_cycle
        })
      }).returning('id');

      logger.info('Link de assinatura criado:', {
        userId,
        planId,
        sessionId: session.id
      });

      return {
        payment_id: paymentRecord[0].id,
        checkout_url: session.url,
        session_id: session.id,
        plan: {
          id: planId,
          name: plan.name,
          price: plan.price,
          billing_cycle: plan.billing_cycle
        },
        currency: currency,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

    } catch (error) {
      logger.error('Erro ao criar link de assinatura:', error);
      throw error;
    }
  }

  /**
   * Migrar usuário de conta gratuita para paga
   */
  static async migrateFromFreeAccount(userId, migrationType, details) {
    try {
      const user = await db('users').where({ id: userId }).first();
      if (!user) throw new Error('Usuário não encontrado');

      let migrationResult;

      if (migrationType === 'prepaid') {
        // Migração via recarga pré-paga
        migrationResult = await this.createPrepaidPaymentLink(
          userId, 
          details.amount, 
          details.currency || 'BRL'
        );

        // Marcar usuário como em processo de migração
        await db('users').where({ id: userId }).update({
          account_status: 'migrating_prepaid',
          migration_started_at: new Date()
        });

      } else if (migrationType === 'subscription') {
        // Migração via assinatura
        migrationResult = await this.createSubscriptionPaymentLink(
          userId,
          details.plan_id,
          details.currency || 'BRL'
        );

        // Marcar usuário como em processo de migração
        await db('users').where({ id: userId }).update({
          account_status: 'migrating_subscription',
          migration_started_at: new Date()
        });
      }

      // Log da migração
      await db('user_migrations').insert({
        user_id: userId,
        migration_type: migrationType,
        from_status: 'free',
        to_status: 'paid',
        payment_id: migrationResult.payment_id,
        migration_data: JSON.stringify(migrationResult),
        status: 'pending'
      });

      return {
        ...migrationResult,
        migration_id: `mig_${Date.now()}`,
        migration_type: migrationType,
        instructions: {
          pt: `Conta em processo de migração para ${migrationType === 'prepaid' ? 'pré-pago' : 'assinatura'}. Complete o pagamento para ativar sua conta.`,
          en: `Account migration in process to ${migrationType}. Complete the payment to activate your account.`
        }
      };

    } catch (error) {
      logger.error('Erro na migração de conta:', error);
      throw error;
    }
  }

  /**
   * Processar pagamento bem-sucedido
   */
  static async processSuccessfulPayment(stripeEventData) {
    try {
      const { object: paymentIntent } = stripeEventData;
      
      // Buscar pagamento no banco
      const payment = await db('payments')
        .where({ stripe_payment_intent_id: paymentIntent.id })
        .first();

      if (!payment) {
        logger.warn('Pagamento não encontrado no banco:', paymentIntent.id);
        return;
      }

      // Atualizar status do pagamento
      await db('payments')
        .where({ id: payment.id })
        .update({
          status: 'succeeded',
          paid_at: new Date(),
          metadata: JSON.stringify({
            ...JSON.parse(payment.metadata || '{}'),
            stripe_payment_data: paymentIntent
          })
        });

      if (payment.type === 'prepaid') {
        await this.processPrepaidPayment(payment);
      } else if (payment.type === 'subscription') {
        await this.processSubscriptionPayment(payment);
      }

      // Verificar se é uma migração
      const migration = await db('user_migrations')
        .where({ payment_id: payment.id })
        .first();

      if (migration) {
        await this.completeMigration(migration);
      }

      logger.info('Pagamento processado com sucesso:', {
        paymentId: payment.id,
        userId: payment.user_id,
        type: payment.type,
        amount: payment.amount
      });

    } catch (error) {
      logger.error('Erro ao processar pagamento bem-sucedido:', error);
      throw error;
    }
  }

  /**
   * Processar pagamento pré-pago
   */
  static async processPrepaidPayment(payment) {
    const metadata = JSON.parse(payment.metadata || '{}');
    const bonusAmount = parseFloat(metadata.bonus_amount || 0);
    const totalCredit = payment.amount + bonusAmount;

    // Creditar saldo
    const PaymentService = await import('./paymentService.js');
    await PaymentService.PaymentService.creditPrepaidBalance(
      payment.user_id,
      totalCredit,
      payment.currency,
      payment.id,
      `Recarga via link de pagamento + bônus de ${bonusAmount}`
    );

    // Atualizar status da conta se necessário
    await db('users')
      .where({ id: payment.user_id })
      .update({
        account_status: 'active',
        first_payment_at: db.raw('COALESCE(first_payment_at, ?)', [new Date()])
      });
  }

  /**
   * Processar pagamento de assinatura
   */
  static async processSubscriptionPayment(payment) {
    const metadata = JSON.parse(payment.metadata || '{}');
    
    // Ativar assinatura
    await db('subscriptions').insert({
      user_id: payment.user_id,
      plan_id: metadata.plan_id,
      stripe_subscription_id: metadata.stripe_subscription_id,
      status: 'active',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      currency: payment.currency
    });

    // Atualizar usuário
    await db('users')
      .where({ id: payment.user_id })
      .update({
        account_status: 'active',
        subscription_status: 'active',
        current_plan_id: metadata.plan_id,
        first_payment_at: db.raw('COALESCE(first_payment_at, ?)', [new Date()])
      });
  }

  /**
   * Completar migração de conta
   */
  static async completeMigration(migration) {
    await db('user_migrations')
      .where({ id: migration.id })
      .update({
        status: 'completed',
        completed_at: new Date()
      });

    await db('users')
      .where({ id: migration.user_id })
      .update({
        account_status: 'active',
        migrated_at: new Date()
      });
  }

  /**
   * Calcular bônus de recarga
   */
  static calculateBonus(amount, currency) {
    // Buscar configurações de bônus
    const bonusTiers = [
      { minimum: 100, bonus_percentage: 10 },
      { minimum: 500, bonus_percentage: 15 },
      { minimum: 1000, bonus_percentage: 20 }
    ];

    let bonusPercentage = 0;
    for (const tier of bonusTiers.reverse()) {
      if (amount >= tier.minimum) {
        bonusPercentage = tier.bonus_percentage;
        break;
      }
    }

    return (amount * bonusPercentage / 100);
  }

  /**
   * Listar links de pagamento do usuário
   */
  static async getUserPaymentLinks(userId, options = {}) {
    const { page = 1, limit = 20, status } = options;
    const offset = (page - 1) * limit;

    let query = db('payments')
      .where({ user_id: userId })
      .whereIn('type', ['prepaid', 'subscription'])
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (status) {
      query = query.where({ status });
    }

    const payments = await query;

    return {
      payments: payments.map(payment => ({
        ...payment,
        amount: parseFloat(payment.amount),
        fee_amount: parseFloat(payment.fee_amount),
        metadata: JSON.parse(payment.metadata || '{}')
      })),
      pagination: {
        page,
        limit,
        has_more: payments.length === limit
      }
    };
  }
}

export default PaymentLinkService;
