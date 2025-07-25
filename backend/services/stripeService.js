import Stripe from 'stripe';
import db from '../common/db.js';
import logger from '../common/logger.js';

class StripeService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
    
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }

  /**
   * Criar produto no Stripe
   */
  async createProduct(productData) {
    try {
      const product = await this.stripe.products.create({
        name: productData.name,
        description: productData.description,
        type: 'service',
        metadata: productData.metadata || {}
      });

      // Determinar região baseada no metadata
      const region = productData.metadata?.region || 'global';
      const productType = productData.type === 'subscription' ? 'subscription' : 'prepaid';

      // Salvar no banco (usar estrutura correta)
      await db('stripe_products').insert({
        id: product.id,
        name: product.name,
        description: product.description,
        region: region,
        product_type: productType,
        metadata: product.metadata
      });

      logger.info(`Produto criado no Stripe: ${product.id}`);
      return product;
    } catch (error) {
      logger.error('Erro ao criar produto no Stripe:', error);
      throw error;
    }
  }

  /**
   * Criar preço no Stripe
   */
  async createPrice(priceData) {
    try {
      const price = await this.stripe.prices.create({
        product: priceData.product_id,
        unit_amount: Math.round(priceData.amount * 100), // Converter para centavos
        currency: priceData.currency.toLowerCase(),
        recurring: priceData.recurring ? {
          interval: priceData.interval || 'month',
          interval_count: priceData.interval_count || 1,
          trial_period_days: priceData.trial_period_days || 0
        } : undefined,
        nickname: priceData.nickname,
        metadata: priceData.metadata || {}
      });

      // Buscar produto no banco (usar id correto)
      const product = await db('stripe_products')
        .where('id', priceData.product_id)
        .first();

      if (product) {
        // Salvar preço no banco (usar estrutura correta)
        await db('stripe_prices').insert({
          id: price.id,
          product_id: product.id,
          unit_amount: Math.round(priceData.amount * 100),
          currency: priceData.currency,
          recurring_interval: priceData.interval,
          recurring_interval_count: priceData.interval_count || 1,
          nickname: priceData.nickname,
          metadata: price.metadata
        });
      }

      logger.info(`Preço criado no Stripe: ${price.id}`);
      return price;
    } catch (error) {
      logger.error('Erro ao criar preço no Stripe:', error);
      throw error;
    }
  }

  /**
   * Criar cupom de desconto
   */
  async createCoupon(couponData) {
    try {
      const coupon = await this.stripe.coupons.create({
        id: couponData.code,
        percent_off: couponData.discount_type === 'percentage' ? couponData.discount_value : undefined,
        amount_off: couponData.discount_type === 'fixed_amount' ? Math.round(couponData.discount_value * 100) : undefined,
        currency: couponData.currency?.toLowerCase(),
        duration: 'once', // Aplicar apenas uma vez
        max_redemptions: couponData.max_redemptions,
        redeem_by: couponData.valid_until ? Math.floor(new Date(couponData.valid_until).getTime() / 1000) : undefined,
        metadata: {
          first_purchase_only: couponData.first_purchase_only || true,
          applies_to_subscription: couponData.applies_to_subscription || true,
          applies_to_prepaid: couponData.applies_to_prepaid || true,
          minimum_amount: couponData.minimum_amount || 0
        }
      });

      logger.info(`Cupom criado no Stripe: ${coupon.id}`);
      return coupon;
    } catch (error) {
      logger.error('Erro ao criar cupom no Stripe:', error);
      throw error;
    }
  }

  /**
   * Criar código promocional
   */
  async createPromotionCode(promotionData) {
    try {
      const promotionCode = await this.stripe.promotionCodes.create({
        coupon: promotionData.coupon_id,
        code: promotionData.code,
        active: true,
        max_redemptions: promotionData.max_redemptions,
        expires_at: promotionData.valid_until ? Math.floor(new Date(promotionData.valid_until).getTime() / 1000) : undefined,
        metadata: promotionData.metadata || {}
      });

      // Salvar no banco (usar estrutura correta da tabela)
      await db('promotional_codes').insert({
        id: promotionCode.id,
        stripe_coupon_id: promotionData.coupon_id,
        code: promotionData.code,
        name: promotionData.description || promotionData.code,
        percent_off: promotionData.discount_type === 'percentage' ? promotionData.discount_value : null,
        amount_off: promotionData.discount_type === 'fixed_amount' ? Math.round(promotionData.discount_value * 100) : null,
        currency: promotionData.currency,
        duration: promotionData.duration || 'once',
        max_redemptions: promotionData.max_redemptions,
        valid_from: promotionData.valid_from,
        valid_until: promotionData.valid_until,
        region: promotionData.metadata?.region || 'global',
        min_amount: promotionData.minimum_amount ? Math.round(promotionData.minimum_amount * 100) : null,
        restrictions: JSON.stringify({
          first_purchase_only: promotionData.first_purchase_only || true,
          applies_to_subscription: promotionData.applies_to_subscription || true,
          applies_to_prepaid: promotionData.applies_to_prepaid || true
        }),
        metadata: promotionData.metadata || {}
      });

      logger.info(`Código promocional criado: ${promotionCode.code}`);
      return promotionCode;
    } catch (error) {
      logger.error('Erro ao criar código promocional:', error);
      throw error;
    }
  }

  /**
   * Criar sessão de checkout
   */
  async createCheckoutSession(sessionData) {
    try {
      const {
        user_id,
        price_id,
        success_url,
        cancel_url,
        coupon_code,
        custom_amount,
        currency = 'BRL'
      } = sessionData;

      // Buscar preço no banco
      const price = await db('stripe_prices')
        .join('stripe_products', 'stripe_prices.product_id', 'stripe_products.id')
        .where('stripe_prices.id', price_id)
        .select(
          'stripe_prices.*',
          'stripe_products.product_type as product_type',
          'stripe_products.name as product_name'
        )
        .first();

      if (!price) {
        throw new Error('Preço não encontrado');
      }

      // Validar se é primeira compra se houver cupom
      if (coupon_code) {
        const hasExistingPayments = await this.checkUserFirstPurchase(user_id);
        if (hasExistingPayments) {
          const promoCode = await db('promotional_codes')
            .where('code', coupon_code)
            .where('first_purchase_only', true)
            .first();
          
          if (promoCode) {
            throw new Error('Este cupom é válido apenas para a primeira compra');
          }
        }
      }

      const sessionConfig = {
        mode: price.product_type === 'subscription' ? 'subscription' : 'payment',
        success_url: success_url,
        cancel_url: cancel_url,
        metadata: {
          user_id: user_id.toString(),
          product_type: price.product_type,
          currency: currency
        },
        client_reference_id: user_id.toString()
      };

      // Configurar linha de item
      if (custom_amount && price.product_type === 'prepaid') {
        // Para recargas customizadas
        sessionConfig.line_items = [{
          price_data: {
            currency: currency.toLowerCase(),
            product: price.stripe_product_id,
            unit_amount: Math.round(custom_amount * 100)
          },
          quantity: 1
        }];
      } else {
        // Para produtos com preço fixo
        sessionConfig.line_items = [{
          price: price_id,
          quantity: 1
        }];
      }

      // Aplicar cupom se fornecido
      if (coupon_code) {
        const promoCode = await db('promotional_codes')
          .where('code', coupon_code)
          .where('is_active', true)
          .first();

        if (promoCode) {
          // Verificar valor mínimo
          const amount = custom_amount || price.amount;
          if (promoCode.minimum_amount && amount < promoCode.minimum_amount) {
            throw new Error(`Valor mínimo para este cupom: ${promoCode.minimum_amount}`);
          }

          sessionConfig.discounts = [{
            coupon: promoCode.stripe_coupon_id
          }];
        }
      }

      const session = await this.stripe.checkout.sessions.create(sessionConfig);

      // Salvar sessão no banco
      await db('checkout_sessions').insert({
        stripe_session_id: session.id,
        user_id: user_id,
        price_id: price.id,
        amount: custom_amount || price.amount,
        currency: currency,
        expires_at: new Date(session.expires_at * 1000),
        metadata: sessionConfig.metadata
      });

      logger.info(`Sessão de checkout criada: ${session.id}`);
      return session;
    } catch (error) {
      logger.error('Erro ao criar sessão de checkout:', error);
      throw error;
    }
  }

  /**
   * Verificar se é primeira compra do usuário
   */
  async checkUserFirstPurchase(userId) {
    const existingPayment = await db('payments')
      .where('user_id', userId)
      .where('status', 'succeeded')
      .first();

    return !!existingPayment;
  }

  /**
   * Processar webhook do Stripe
   */
  async processWebhook(rawBody, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret
      );

      // Log do webhook
      await db('webhook_logs').insert({
        provider: 'stripe',
        event_type: event.type,
        event_id: event.id,
        payload: event,
        status: 'received'
      });

      logger.info(`Webhook recebido: ${event.type} - ${event.id}`);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;
        
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        
        default:
          logger.info(`Webhook não processado: ${event.type}`);
      }

      // Atualizar status do webhook
      await db('webhook_logs')
        .where('event_id', event.id)
        .update({
          status: 'processed',
          processed_at: new Date()
        });

    } catch (error) {
      logger.error('Erro ao processar webhook:', error);
      
      // Atualizar status de erro
      await db('webhook_logs')
        .where('event_id', event.id)
        .update({
          status: 'failed',
          processing_notes: error.message
        });
      
      throw error;
    }
  }

  /**
   * Processar checkout concluído
   */
  async handleCheckoutCompleted(session) {
    try {
      const userId = parseInt(session.client_reference_id);
      
      // Buscar sessão no banco
      const checkoutSession = await db('checkout_sessions')
        .where('stripe_session_id', session.id)
        .first();

      if (!checkoutSession) {
        throw new Error(`Sessão não encontrada: ${session.id}`);
      }

      // Atualizar sessão
      await db('checkout_sessions')
        .where('id', checkoutSession.id)
        .update({
          status: 'complete',
          completed_at: new Date(),
          stripe_payment_intent_id: session.payment_intent,
          stripe_subscription_id: session.subscription
        });

      // Criar registro de pagamento
      await db('payments').insert({
        user_id: userId,
        stripe_payment_intent_id: session.payment_intent,
        stripe_subscription_id: session.subscription,
        type: session.mode === 'subscription' ? 'subscription' : 'prepaid',
        amount: checkoutSession.amount,
        currency: checkoutSession.currency,
        status: 'succeeded',
        paid_at: new Date(),
        description: `Pagamento via checkout - ${session.id}`
      });

      // Se for recarga pré-paga, adicionar ao saldo
      if (session.mode === 'payment') {
        await this.addPrepaidBalance(userId, checkoutSession.amount, checkoutSession.currency);
      }

      logger.info(`Checkout processado com sucesso: ${session.id}`);
    } catch (error) {
      logger.error('Erro ao processar checkout:', error);
      throw error;
    }
  }

  /**
   * Adicionar saldo pré-pago
   */
  async addPrepaidBalance(userId, amount, currency) {
    try {
      // Buscar saldo atual
      let balance = await db('user_prepaid_balance')
        .where('user_id', userId)
        .where('currency', currency)
        .first();

      const balanceBefore = balance ? balance.balance : 0;
      const balanceAfter = balanceBefore + amount;

      if (balance) {
        // Atualizar saldo existente
        await db('user_prepaid_balance')
          .where('id', balance.id)
          .update({
            balance: balanceAfter,
            last_transaction_at: new Date()
          });
      } else {
        // Criar novo saldo
        await db('user_prepaid_balance').insert({
          user_id: userId,
          balance: amount,
          currency: currency,
          last_transaction_at: new Date()
        });
      }

      // Registrar transação
      await db('prepaid_transactions').insert({
        user_id: userId,
        type: 'credit',
        amount: amount,
        currency: currency,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: 'Recarga via checkout'
      });

      logger.info(`Saldo adicionado: ${amount} ${currency} para usuário ${userId}`);
    } catch (error) {
      logger.error('Erro ao adicionar saldo:', error);
      throw error;
    }
  }

  /**
   * Processar pagamento bem-sucedido
   */
  async handlePaymentSucceeded(paymentIntent) {
    // Atualizar status do pagamento se existir
    await db('payments')
      .where('stripe_payment_intent_id', paymentIntent.id)
      .update({
        status: 'succeeded',
        paid_at: new Date()
      });
  }

  /**
   * Processar pagamento falhado
   */
  async handlePaymentFailed(paymentIntent) {
    // Atualizar status do pagamento se existir
    await db('payments')
      .where('stripe_payment_intent_id', paymentIntent.id)
      .update({
        status: 'failed',
        failed_at: new Date(),
        failure_reason: paymentIntent.last_payment_error?.message
      });
  }

  /**
   * Processar pagamento de fatura (assinatura)
   */
  async handleInvoicePaymentSucceeded(invoice) {
    // Atualizar status do pagamento se existir
    await db('payments')
      .where('stripe_invoice_id', invoice.id)
      .update({
        status: 'succeeded',
        paid_at: new Date()
      });
  }

  /**
   * Processar criação de assinatura
   */
  async handleSubscriptionCreated(subscription) {
    // Lógica para nova assinatura
    logger.info(`Nova assinatura criada: ${subscription.id}`);
  }

  /**
   * Processar atualização de assinatura
   */
  async handleSubscriptionUpdated(subscription) {
    // Lógica para assinatura atualizada
    logger.info(`Assinatura atualizada: ${subscription.id}`);
  }

  /**
   * Processar cancelamento de assinatura
   */
  async handleSubscriptionDeleted(subscription) {
    // Lógica para assinatura cancelada
    logger.info(`Assinatura cancelada: ${subscription.id}`);
  }

  /**
   * Buscar produtos ativos
   */
  async getActiveProducts() {
    return await db('stripe_products')
      .join('stripe_prices', 'stripe_products.id', 'stripe_prices.product_id')
      .where('stripe_products.is_active', true)
      .where('stripe_prices.is_active', true)
      .select(
        'stripe_products.*',
        'stripe_prices.stripe_price_id',
        'stripe_prices.amount',
        'stripe_prices.currency',
        'stripe_prices.interval',
        'stripe_prices.nickname'
      );
  }

  /**
   * Validar código promocional
   */
  async validatePromotionalCode(code, userId, amount, currency, productType) {
    const promoCode = await db('promotional_codes')
      .where('code', code)
      .where('is_active', true)
      .first();

    if (!promoCode) {
      throw new Error('Código promocional não encontrado ou inativo');
    }

    // Verificar validade
    const now = new Date();
    if (promoCode.valid_from && new Date(promoCode.valid_from) > now) {
      throw new Error('Código promocional ainda não é válido');
    }
    
    if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
      throw new Error('Código promocional expirado');
    }

    // Verificar limite de uso
    if (promoCode.max_redemptions && promoCode.times_redeemed >= promoCode.max_redemptions) {
      throw new Error('Código promocional esgotado');
    }

    // Verificar primeira compra
    if (promoCode.first_purchase_only) {
      const hasExistingPayments = await this.checkUserFirstPurchase(userId);
      if (hasExistingPayments) {
        throw new Error('Este cupom é válido apenas para a primeira compra');
      }
    }

    // Verificar tipo de produto
    if (productType === 'subscription' && !promoCode.applies_to_subscription) {
      throw new Error('Este cupom não é válido para assinaturas');
    }
    
    if (productType === 'prepaid' && !promoCode.applies_to_prepaid) {
      throw new Error('Este cupom não é válido para recargas');
    }

    // Verificar valor mínimo
    if (promoCode.minimum_amount && amount < promoCode.minimum_amount) {
      throw new Error(`Valor mínimo para este cupom: ${promoCode.minimum_amount}`);
    }

    // Verificar se usuário já usou
    const existingUsage = await db('promotional_code_usage')
      .where('promotional_code_id', promoCode.id)
      .where('user_id', userId)
      .first();

    if (existingUsage) {
      throw new Error('Você já utilizou este código promocional');
    }

    return promoCode;
  }

  /**
   * Calcular valor com desconto
   */
  calculateDiscount(amount, promoCode) {
    if (promoCode.discount_type === 'percentage') {
      return amount * (promoCode.discount_value / 100);
    } else {
      return Math.min(promoCode.discount_value, amount);
    }
  }
}

export default new StripeService();
