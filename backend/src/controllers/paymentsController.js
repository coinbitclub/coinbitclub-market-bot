/**
 * Controlador de Pagamentos
 * Gerencia recargas, assinaturas e saques
 */
import stripeService from '../services/stripeService.js';
import db from '../common/db.js';
import logger from '../common/logger.js';

class PaymentsController {
  
  /**
   * Criar checkout para recarga flexível
   */
  async createPrepaidCheckout(req, res) {
    try {
      const { amount, currency = 'BRL', promotional_code } = req.body;
      const userId = req.user.id;
      
      // Validar valores mínimos
      const currencyConfig = await db('currency_settings')
        .where('currency', currency)
        .first();
      
      if (!currencyConfig) {
        return res.status(400).json({
          error: 'Moeda não suportada',
          supported_currencies: ['BRL', 'USD']
        });
      }
      
      if (amount < currencyConfig.minimum_balance) {
        return res.status(400).json({
          error: 'Valor abaixo do mínimo',
          minimum: currencyConfig.minimum_balance,
          currency: currency
        });
      }
      
      // Verificar desconto automático por valor
      const discountSettings = await db('payment_settings')
        .where('key', 'prepaid_discounts')
        .first();
      
      let automaticDiscount = 0;
      if (discountSettings && discountSettings.value.enabled) {
        const tiers = currency === 'BRL' 
          ? discountSettings.value.brl_tiers 
          : discountSettings.value.usd_tiers;
        
        const amountCents = amount * 100;
        const applicableTier = tiers.find(tier => 
          amountCents >= tier.minimum && amountCents <= tier.maximum
        );
        
        if (applicableTier) {
          automaticDiscount = applicableTier.discount_percentage;
        }
      }
      
      // Criar produto Stripe temporário para recarga flexível
      const productName = `Recarga CoinBit Club - ${currency} ${amount}`;
      const productDescription = automaticDiscount > 0 
        ? `Recarga de ${currency} ${amount} (${automaticDiscount}% desconto incluído)`
        : `Recarga de ${currency} ${amount}`;
      
      // Calcular valor final com desconto
      let finalAmount = amount;
      if (automaticDiscount > 0) {
        finalAmount = amount * (1 - automaticDiscount / 100);
      }
      
      const product = await stripeService.stripe.products.create({
        name: productName,
        description: productDescription,
        type: 'service',
        metadata: {
          user_id: userId,
          original_amount: amount,
          currency: currency,
          discount_applied: automaticDiscount,
          type: 'flexible_prepaid'
        }
      });
      
      const price = await stripeService.stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(finalAmount * 100),
        currency: currency.toLowerCase(),
        metadata: {
          original_amount: amount,
          discount_percentage: automaticDiscount
        }
      });
      
      // Criar checkout session
      const checkoutSession = await stripeService.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price: price.id,
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        metadata: {
          user_id: userId,
          type: 'prepaid',
          original_amount: amount,
          currency: currency,
          discount_applied: automaticDiscount
        },
        customer_email: req.user.email,
        ...(promotional_code && { discounts: [{ coupon: promotional_code }] })
      });
      
      // Salvar sessão no banco
      await db('checkout_sessions').insert({
        id: checkoutSession.id,
        user_id: userId,
        amount: Math.round(finalAmount * 100),
        currency: currency,
        mode: 'payment',
        status: 'open',
        customer_email: req.user.email,
        expires_at: new Date(checkoutSession.expires_at * 1000),
        metadata: JSON.stringify({
          type: 'flexible_prepaid',
          original_amount: amount,
          discount_applied: automaticDiscount,
          stripe_product_id: product.id,
          stripe_price_id: price.id
        })
      });
      
      res.json({
        checkout_url: checkoutSession.url,
        session_id: checkoutSession.id,
        amount: finalAmount,
        original_amount: amount,
        discount_applied: automaticDiscount,
        currency: currency,
        expires_at: checkoutSession.expires_at
      });
      
    } catch (error) {
      logger.error('Erro ao criar checkout de recarga:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
  
  /**
   * Criar checkout para assinatura
   */
  async createSubscriptionCheckout(req, res) {
    try {
      const { plan_type, promotional_code } = req.body;
      const userId = req.user.id;
      
      // Validar tipo de plano
      const validPlans = ['brasil_mensal', 'brasil_comissao', 'exterior_mensal', 'exterior_comissao'];
      if (!validPlans.includes(plan_type)) {
        return res.status(400).json({
          error: 'Tipo de plano inválido',
          valid_plans: validPlans
        });
      }
      
      // Verificar se usuário já tem assinatura ativa
      const existingSubscription = await db('payments')
        .where('user_id', userId)
        .where('type', 'subscription')
        .where('status', 'succeeded')
        .where('stripe_subscription_id', '!=', null)
        .first();
      
      if (existingSubscription) {
        return res.status(400).json({
          error: 'Usuário já possui assinatura ativa',
          current_subscription: existingSubscription.stripe_subscription_id
        });
      }
      
      // Buscar configurações do plano
      const subscriptionSettings = await db('payment_settings')
        .where('key', 'subscription_plans')
        .first();
      
      const planConfig = subscriptionSettings.value[plan_type];
      if (!planConfig) {
        return res.status(400).json({
          error: 'Configuração do plano não encontrada'
        });
      }
      
      // Buscar produto e preço do Stripe
      const stripeProduct = await db('stripe_products')
        .where('metadata->type', 'subscription')
        .where('metadata->plan_type', plan_type)
        .where('is_active', true)
        .first();
      
      if (!stripeProduct) {
        return res.status(400).json({
          error: 'Produto não encontrado para este plano'
        });
      }
      
      const stripePrice = await db('stripe_prices')
        .where('product_id', stripeProduct.id)
        .where('is_active', true)
        .first();
      
      if (!stripePrice) {
        return res.status(400).json({
          error: 'Preço não encontrado para este plano'
        });
      }
      
      // Criar checkout session
      const checkoutSession = await stripeService.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price: stripePrice.stripe_price_id,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
        metadata: {
          user_id: userId,
          type: 'subscription',
          plan_type: plan_type
        },
        customer_email: req.user.email,
        ...(promotional_code && { discounts: [{ coupon: promotional_code }] })
      });
      
      // Salvar sessão no banco
      await db('checkout_sessions').insert({
        id: checkoutSession.id,
        user_id: userId,
        price_id: stripePrice.id,
        amount: stripePrice.amount,
        currency: stripePrice.currency,
        mode: 'subscription',
        status: 'open',
        customer_email: req.user.email,
        expires_at: new Date(checkoutSession.expires_at * 1000),
        metadata: JSON.stringify({
          type: 'subscription',
          plan_type: plan_type,
          stripe_product_id: stripeProduct.stripe_product_id,
          stripe_price_id: stripePrice.stripe_price_id
        })
      });
      
      res.json({
        checkout_url: checkoutSession.url,
        session_id: checkoutSession.id,
        plan_type: plan_type,
        amount: stripePrice.amount / 100,
        currency: stripePrice.currency.toUpperCase(),
        monthly_fee: planConfig.monthly_fee / 100,
        commission_rate: planConfig.commission_rate,
        expires_at: checkoutSession.expires_at
      });
      
    } catch (error) {
      logger.error('Erro ao criar checkout de assinatura:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
  
  /**
   * Solicitar saque
   */
  async requestWithdrawal(req, res) {
    try {
      const { amount, currency = 'BRL', withdrawal_type, bank_details, pix_key, crypto_address } = req.body;
      const userId = req.user.id;
      
      // Validar tipo de saque
      const validTypes = ['user_prepaid', 'admin_profit', 'affiliate_commission'];
      if (!validTypes.includes(withdrawal_type)) {
        return res.status(400).json({
          error: 'Tipo de saque inválido',
          valid_types: validTypes
        });
      }
      
      // Verificar saldo disponível
      const balance = await db('user_prepaid_balance')
        .where('user_id', userId)
        .where('currency', currency)
        .first();
      
      if (!balance || balance.balance < amount) {
        return res.status(400).json({
          error: 'Saldo insuficiente',
          available_balance: balance ? balance.balance : 0,
          currency: currency
        });
      }
      
      // Verificar configurações de saque
      const currencyConfig = await db('currency_settings')
        .where('currency', currency)
        .first();
      
      if (amount < currencyConfig.minimum_withdrawal) {
        return res.status(400).json({
          error: 'Valor abaixo do mínimo para saque',
          minimum: currencyConfig.minimum_withdrawal,
          currency: currency
        });
      }
      
      // Calcular taxas
      const feePercentage = currencyConfig.withdrawal_fee_percentage || 0;
      const feeFixed = currencyConfig.withdrawal_fee_fixed || 0;
      const feeAmount = (amount * feePercentage) + feeFixed;
      const netAmount = amount - feeAmount;
      
      // Validar dados de saque
      if (currency === 'BRL' && !pix_key && !bank_details) {
        return res.status(400).json({
          error: 'Para saques em BRL, forneça chave PIX ou dados bancários'
        });
      }
      
      if (currency === 'USD' && !crypto_address && !bank_details) {
        return res.status(400).json({
          error: 'Para saques em USD, forneça endereço crypto ou dados bancários'
        });
      }
      
      // Verificar limite diário
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dailyWithdrawals = await db('withdrawal_requests')
        .where('user_id', userId)
        .where('created_at', '>=', today)
        .count('* as count')
        .first();
      
      const withdrawalSettings = await db('payment_settings')
        .where('key', 'withdrawal_settings')
        .first();
      
      const maxDaily = withdrawalSettings.value.max_daily_withdrawals || 5;
      
      if (dailyWithdrawals.count >= maxDaily) {
        return res.status(400).json({
          error: 'Limite diário de saques excedido',
          max_daily: maxDaily,
          today_count: dailyWithdrawals.count
        });
      }
      
      // Criar solicitação de saque
      const withdrawalRequest = await db('withdrawal_requests').insert({
        user_id: userId,
        amount: amount,
        currency: currency,
        withdrawal_type: withdrawal_type,
        bank_details: bank_details ? JSON.stringify(bank_details) : null,
        pix_key: pix_key,
        crypto_address: crypto_address,
        fee_amount: feeAmount,
        net_amount: netAmount,
        status: amount <= withdrawalSettings.value.auto_approval_limit ? 'processing' : 'pending'
      }).returning('*');
      
      // Se for aprovação automática, processar imediatamente
      if (amount <= withdrawalSettings.value.auto_approval_limit) {
        await this.processWithdrawal(withdrawalRequest[0].id);
      }
      
      res.json({
        withdrawal_id: withdrawalRequest[0].id,
        amount: amount,
        fee_amount: feeAmount,
        net_amount: netAmount,
        currency: currency,
        status: withdrawalRequest[0].status,
        estimated_processing: withdrawalSettings.value.auto_approval_limit >= amount ? '24h' : '2-5 dias úteis'
      });
      
    } catch (error) {
      logger.error('Erro ao solicitar saque:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
  
  /**
   * Processar saque (função interna)
   */
  async processWithdrawal(withdrawalId) {
    try {
      const withdrawal = await db('withdrawal_requests')
        .where('id', withdrawalId)
        .first();
      
      if (!withdrawal) {
        throw new Error('Solicitação de saque não encontrada');
      }
      
      // Debitar do saldo do usuário
      await db.transaction(async (trx) => {
        // Atualizar saldo
        await trx('user_prepaid_balance')
          .where('user_id', withdrawal.user_id)
          .where('currency', withdrawal.currency)
          .decrement('balance', withdrawal.amount);
        
        // Registrar transação
        await trx('prepaid_transactions').insert({
          user_id: withdrawal.user_id,
          type: 'debit',
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          balance_before: 0, // Será calculado em trigger
          balance_after: 0,  // Será calculado em trigger
          description: `Saque solicitado - ${withdrawal.withdrawal_type}`,
          reference_id: withdrawalId,
          metadata: JSON.stringify({
            withdrawal_type: withdrawal.withdrawal_type,
            fee_amount: withdrawal.fee_amount,
            net_amount: withdrawal.net_amount
          })
        });
        
        // Atualizar status do saque
        await trx('withdrawal_requests')
          .where('id', withdrawalId)
          .update({
            status: 'completed',
            processed_at: new Date(),
            processing_notes: 'Processado automaticamente'
          });
      });
      
      logger.info(`Saque ${withdrawalId} processado com sucesso`);
      
    } catch (error) {
      logger.error(`Erro ao processar saque ${withdrawalId}:`, error);
      
      // Marcar como falha
      await db('withdrawal_requests')
        .where('id', withdrawalId)
        .update({
          status: 'failed',
          processing_notes: error.message
        });
    }
  }
  
  /**
   * Obter histórico de pagamentos do usuário
   */
  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, type } = req.query;
      
      let query = db('payments')
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset((page - 1) * limit);
      
      if (type) {
        query = query.where('type', type);
      }
      
      const payments = await query;
      
      const totalQuery = db('payments')
        .where('user_id', userId)
        .count('* as count');
      
      if (type) {
        totalQuery.where('type', type);
      }
      
      const total = await totalQuery.first();
      
      res.json({
        payments: payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(total.count / limit)
        }
      });
      
    } catch (error) {
      logger.error('Erro ao buscar histórico de pagamentos:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
  
  /**
   * Obter saldo atual do usuário
   */
  async getUserBalance(req, res) {
    try {
      const userId = req.user.id;
      
      const balances = await db('user_prepaid_balance')
        .where('user_id', userId)
        .select('*');
      
      const pendingWithdrawals = await db('withdrawal_requests')
        .where('user_id', userId)
        .whereIn('status', ['pending', 'processing'])
        .select('amount', 'currency', 'status');
      
      res.json({
        balances: balances,
        pending_withdrawals: pendingWithdrawals
      });
      
    } catch (error) {
      logger.error('Erro ao buscar saldo do usuário:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
  
  /**
   * Webhook do Stripe
   */
  async handleStripeWebhook(req, res) {
    try {
      const sig = req.headers['stripe-signature'];
      const event = stripeService.stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      // Log do webhook
      await db('webhook_logs').insert({
        provider: 'stripe',
        event_type: event.type,
        event_id: event.id,
        payload: JSON.stringify(event),
        status: 'received'
      });
      
      // Processar evento
      await this.processStripeEvent(event);
      
      res.json({ received: true });
      
    } catch (error) {
      logger.error('Erro no webhook do Stripe:', error);
      res.status(400).json({
        error: 'Webhook signature verification failed'
      });
    }
  }
  
  /**
   * Processar eventos do Stripe
   */
  async processStripeEvent(event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;
          
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
          
        case 'invoice.payment_succeeded':
          await this.handleSubscriptionPayment(event.data.object);
          break;
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object);
          break;
          
        default:
          logger.info(`Evento não processado: ${event.type}`);
      }
      
      // Atualizar log como processado
      await db('webhook_logs')
        .where('event_id', event.id)
        .update({
          status: 'processed',
          processed_at: new Date()
        });
        
    } catch (error) {
      logger.error(`Erro ao processar evento ${event.type}:`, error);
      
      // Atualizar log como falha
      await db('webhook_logs')
        .where('event_id', event.id)
        .update({
          status: 'failed',
          processing_notes: error.message
        });
    }
  }
  
  /**
   * Processar checkout completado
   */
  async handleCheckoutCompleted(session) {
    try {
      const userId = session.metadata.user_id;
      const sessionType = session.metadata.type;
      
      // Atualizar checkout session
      await db('checkout_sessions')
        .where('id', session.id)
        .update({
          status: 'complete',
          completed_at: new Date(),
          stripe_payment_intent_id: session.payment_intent,
          stripe_subscription_id: session.subscription
        });
      
      if (sessionType === 'prepaid' || sessionType === 'flexible_prepaid') {
        // Processar recarga
        const originalAmount = parseFloat(session.metadata.original_amount);
        const currency = session.metadata.currency;
        
        await db.transaction(async (trx) => {
          // Criar registro de pagamento
          await trx('payments').insert({
            user_id: userId,
            stripe_payment_intent_id: session.payment_intent,
            type: 'prepaid',
            status: 'succeeded',
            amount: session.amount_total,
            currency: currency,
            payment_method: 'card',
            description: `Recarga de ${currency} ${originalAmount}`,
            paid_at: new Date(),
            metadata: JSON.stringify(session.metadata)
          });
          
          // Atualizar saldo do usuário
          await trx('user_prepaid_balance')
            .insert({
              user_id: userId,
              balance: originalAmount,
              currency: currency,
              last_transaction_at: new Date()
            })
            .onConflict(['user_id', 'currency'])
            .merge({
              balance: db.raw('user_prepaid_balance.balance + ?', [originalAmount]),
              last_transaction_at: new Date()
            });
          
          // Registrar transação
          await trx('prepaid_transactions').insert({
            user_id: userId,
            type: 'credit',
            amount: originalAmount,
            currency: currency,
            balance_before: 0, // Será calculado
            balance_after: 0,  // Será calculado
            description: `Recarga via Stripe - ${session.payment_intent}`,
            reference_id: session.id,
            metadata: JSON.stringify(session.metadata)
          });
        });
      }
      
    } catch (error) {
      logger.error('Erro ao processar checkout completado:', error);
      throw error;
    }
  }
  
  /**
   * Processar pagamento de assinatura
   */
  async handleSubscriptionPayment(invoice) {
    try {
      const subscription = await stripeService.stripe.subscriptions.retrieve(invoice.subscription);
      const userId = subscription.metadata.user_id;
      
      await db('payments').insert({
        user_id: userId,
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: invoice.subscription,
        type: 'subscription',
        status: 'succeeded',
        amount: invoice.amount_paid,
        currency: invoice.currency.toUpperCase(),
        payment_method: 'card',
        description: `Pagamento mensal de assinatura`,
        paid_at: new Date(invoice.status_transitions.paid_at * 1000),
        metadata: JSON.stringify(invoice.lines.data[0])
      });
      
    } catch (error) {
      logger.error('Erro ao processar pagamento de assinatura:', error);
      throw error;
    }
  }
}

export default new PaymentsController();
