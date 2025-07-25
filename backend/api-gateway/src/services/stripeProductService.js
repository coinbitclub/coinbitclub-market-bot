import Stripe from 'stripe';
import { db } from '../../../common/db.js';
import logger from '../../../common/logger.js';

/**
 * Serviço de Produtos e Planos Stripe
 * Gerencia produtos, preços e assinaturas
 */
export class StripeProductService {
  
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  /**
   * Criar produto no Stripe e no banco de dados
   */
  async createProduct(productData) {
    const trx = await db.transaction();

    try {
      const {
        name,
        description,
        type, // 'subscription' ou 'prepaid'
        features = [],
        is_active = true,
        metadata = {}
      } = productData;

      // Criar produto no Stripe
      const stripeProduct = await this.stripe.products.create({
        name,
        description,
        metadata: {
          type,
          ...metadata
        },
        active: is_active
      });

      // Salvar no banco de dados
      const product = await trx('stripe_products').insert({
        id: require('crypto').randomUUID(),
        stripe_product_id: stripeProduct.id,
        name,
        description,
        type,
        features: JSON.stringify(features),
        is_active,
        metadata: JSON.stringify(metadata),
        created_at: new Date()
      }).returning('*');

      await trx.commit();

      logger.info('Produto criado', {
        productId: product[0].id,
        stripeProductId: stripeProduct.id,
        name
      });

      return {
        success: true,
        product: product[0],
        stripe_product: stripeProduct
      };

    } catch (error) {
      await trx.rollback();
      logger.error('Erro ao criar produto:', error);
      throw error;
    }
  }

  /**
   * Criar preço para produto
   */
  async createPrice(priceData) {
    const trx = await db.transaction();

    try {
      const {
        product_id,
        amount,
        currency,
        interval = null, // Para assinaturas: 'month', 'year'
        interval_count = 1,
        trial_period_days = 0,
        is_active = true,
        nickname = null,
        metadata = {}
      } = priceData;

      // Buscar produto
      const product = await trx('stripe_products')
        .where('id', product_id)
        .first();

      if (!product) {
        throw new Error('Produto não encontrado');
      }

      // Configurar dados do preço para Stripe
      const stripePriceData = {
        currency: currency.toLowerCase(),
        unit_amount: Math.round(amount * 100), // Stripe usa centavos
        product: product.stripe_product_id,
        metadata,
        active: is_active
      };

      if (nickname) {
        stripePriceData.nickname = nickname;
      }

      // Se for assinatura, adicionar dados recorrentes
      if (product.type === 'subscription' && interval) {
        stripePriceData.recurring = {
          interval,
          interval_count,
          trial_period_days: trial_period_days > 0 ? trial_period_days : undefined
        };
      }

      // Criar preço no Stripe
      const stripePrice = await this.stripe.prices.create(stripePriceData);

      // Salvar no banco de dados
      const price = await trx('stripe_prices').insert({
        id: require('crypto').randomUUID(),
        product_id,
        stripe_price_id: stripePrice.id,
        amount,
        currency: currency.toUpperCase(),
        interval,
        interval_count,
        trial_period_days,
        is_active,
        nickname,
        metadata: JSON.stringify(metadata),
        created_at: new Date()
      }).returning('*');

      await trx.commit();

      logger.info('Preço criado', {
        priceId: price[0].id,
        stripePriceId: stripePrice.id,
        amount,
        currency
      });

      return {
        success: true,
        price: price[0],
        stripe_price: stripePrice
      };

    } catch (error) {
      await trx.rollback();
      logger.error('Erro ao criar preço:', error);
      throw error;
    }
  }

  /**
   * Listar produtos disponíveis
   */
  async getProducts(filters = {}) {
    try {
      const {
        type = null,
        is_active = true,
        include_prices = true
      } = filters;

      let query = db('stripe_products')
        .where('is_active', is_active)
        .orderBy('created_at', 'desc');

      if (type) {
        query = query.where('type', type);
      }

      const products = await query;

      // Incluir preços se solicitado
      if (include_prices) {
        for (let product of products) {
          const prices = await db('stripe_prices')
            .where('product_id', product.id)
            .where('is_active', true)
            .orderBy('amount', 'asc');

          product.prices = prices.map(price => ({
            ...price,
            features: JSON.parse(price.features || '[]'),
            metadata: JSON.parse(price.metadata || '{}')
          }));
          
          product.features = JSON.parse(product.features || '[]');
          product.metadata = JSON.parse(product.metadata || '{}');
        }
      }

      return products;

    } catch (error) {
      logger.error('Erro ao listar produtos:', error);
      throw error;
    }
  }

  /**
   * Obter produto específico
   */
  async getProduct(productId) {
    try {
      const product = await db('stripe_products')
        .where('id', productId)
        .first();

      if (!product) {
        throw new Error('Produto não encontrado');
      }

      // Buscar preços
      const prices = await db('stripe_prices')
        .where('product_id', productId)
        .where('is_active', true)
        .orderBy('amount', 'asc');

      product.prices = prices.map(price => ({
        ...price,
        metadata: JSON.parse(price.metadata || '{}')
      }));
      
      product.features = JSON.parse(product.features || '[]');
      product.metadata = JSON.parse(product.metadata || '{}');

      return product;

    } catch (error) {
      logger.error('Erro ao obter produto:', error);
      throw error;
    }
  }

  /**
   * Criar checkout session para produto
   */
  async createCheckoutSession(sessionData) {
    try {
      const {
        price_id,
        user_id,
        success_url,
        cancel_url,
        customer_email = null,
        trial_period_days = null,
        promotional_code = null,
        metadata = {}
      } = sessionData;

      // Buscar preço e produto
      const price = await db('stripe_prices')
        .leftJoin('stripe_products', 'stripe_prices.product_id', 'stripe_products.id')
        .where('stripe_prices.id', price_id)
        .select(
          'stripe_prices.*',
          'stripe_products.name as product_name',
          'stripe_products.type as product_type'
        )
        .first();

      if (!price) {
        throw new Error('Preço não encontrado');
      }

      // Buscar usuário se fornecido
      let customer_email_final = customer_email;
      if (user_id) {
        const user = await db('users').where('id', user_id).first();
        if (user) {
          customer_email_final = user.email;
        }
      }

      // Configurar dados da sessão
      const sessionConfig = {
        payment_method_types: ['card'],
        line_items: [{
          price: price.stripe_price_id,
          quantity: 1
        }],
        mode: price.product_type === 'subscription' ? 'subscription' : 'payment',
        success_url,
        cancel_url,
        metadata: {
          user_id: user_id || '',
          price_id,
          product_type: price.product_type,
          ...metadata
        }
      };

      // Adicionar email do cliente se disponível
      if (customer_email_final) {
        sessionConfig.customer_email = customer_email_final;
      }

      // Adicionar período de teste se aplicável
      if (trial_period_days && price.product_type === 'subscription') {
        sessionConfig.subscription_data = {
          trial_period_days
        };
      }

      // Adicionar código promocional se fornecido
      if (promotional_code) {
        sessionConfig.discounts = [{
          promotion_code: promotional_code
        }];
      }

      // Criar sessão no Stripe
      const session = await this.stripe.checkout.sessions.create(sessionConfig);

      // Salvar sessão no banco
      await db('checkout_sessions').insert({
        id: require('crypto').randomUUID(),
        stripe_session_id: session.id,
        user_id,
        price_id,
        status: 'open',
        amount: price.amount,
        currency: price.currency,
        metadata: JSON.stringify(metadata),
        created_at: new Date()
      });

      logger.info('Checkout session criada', {
        sessionId: session.id,
        userId: user_id,
        priceId: price_id,
        productType: price.product_type
      });

      return {
        success: true,
        session,
        checkout_url: session.url
      };

    } catch (error) {
      logger.error('Erro ao criar checkout session:', error);
      throw error;
    }
  }

  /**
   * Processar webhook de checkout completado
   */
  async processCheckoutCompleted(sessionId, stripeSession) {
    const trx = await db.transaction();

    try {
      // Buscar sessão no banco
      const checkoutSession = await trx('checkout_sessions')
        .where('stripe_session_id', sessionId)
        .first();

      if (!checkoutSession) {
        logger.warn('Sessão de checkout não encontrada:', sessionId);
        return { success: false, reason: 'session_not_found' };
      }

      // Atualizar status da sessão
      await trx('checkout_sessions')
        .where('stripe_session_id', sessionId)
        .update({
          status: 'complete',
          completed_at: new Date(),
          stripe_payment_intent_id: stripeSession.payment_intent,
          stripe_subscription_id: stripeSession.subscription
        });

      // Buscar preço e produto
      const price = await trx('stripe_prices')
        .leftJoin('stripe_products', 'stripe_prices.product_id', 'stripe_products.id')
        .where('stripe_prices.id', checkoutSession.price_id)
        .select(
          'stripe_prices.*',
          'stripe_products.type as product_type',
          'stripe_products.name as product_name'
        )
        .first();

      // Registrar pagamento
      const payment = await trx('payments').insert({
        id: require('crypto').randomUUID(),
        user_id: checkoutSession.user_id,
        stripe_payment_intent_id: stripeSession.payment_intent,
        stripe_subscription_id: stripeSession.subscription,
        type: price.product_type === 'subscription' ? 'subscription' : 'prepaid',
        status: 'succeeded',
        amount: checkoutSession.amount,
        currency: checkoutSession.currency,
        payment_method: 'card',
        description: `Compra: ${price.product_name}`,
        paid_at: new Date(),
        metadata: JSON.stringify({
          checkout_session_id: sessionId,
          price_id: checkoutSession.price_id,
          product_type: price.product_type
        })
      }).returning('*');

      // Se for prepago, creditar saldo
      if (price.product_type === 'prepaid') {
        await this.creditPrepaidBalance(
          trx,
          checkoutSession.user_id,
          checkoutSession.amount,
          checkoutSession.currency,
          payment[0].id
        );
      }

      // Se for assinatura, atualizar status do usuário
      if (price.product_type === 'subscription') {
        await trx('users')
          .where('id', checkoutSession.user_id)
          .update({
            account_status: 'active',
            subscription_status: 'active',
            stripe_subscription_id: stripeSession.subscription
          });
      }

      await trx.commit();

      logger.info('Checkout processado com sucesso', {
        sessionId,
        userId: checkoutSession.user_id,
        paymentId: payment[0].id,
        productType: price.product_type
      });

      return {
        success: true,
        payment: payment[0],
        product_type: price.product_type
      };

    } catch (error) {
      await trx.rollback();
      logger.error('Erro ao processar checkout:', error);
      throw error;
    }
  }

  /**
   * Creditar saldo pré-pago
   */
  async creditPrepaidBalance(trx, userId, amount, currency, paymentId) {
    // Buscar configurações de bônus
    const bonusSettings = await trx('payment_settings')
      .where('key', 'prepaid_bonus')
      .first();

    let bonusAmount = 0;
    if (bonusSettings && bonusSettings.value.enabled) {
      const tiers = bonusSettings.value.tiers || [];
      const applicableTier = tiers
        .filter(tier => amount >= tier.minimum)
        .sort((a, b) => b.minimum - a.minimum)[0];

      if (applicableTier) {
        bonusAmount = amount * (applicableTier.bonus_percentage / 100);
      }
    }

    const totalCredit = amount + bonusAmount;

    // Buscar saldo atual
    let balance = await trx('user_prepaid_balance')
      .where('user_id', userId)
      .where('currency', currency)
      .first();

    const balanceBefore = balance ? parseFloat(balance.balance) : 0;
    const balanceAfter = balanceBefore + totalCredit;

    if (balance) {
      // Atualizar saldo existente
      await trx('user_prepaid_balance')
        .where('user_id', userId)
        .where('currency', currency)
        .update({
          balance: balanceAfter,
          last_transaction_at: new Date()
        });
    } else {
      // Criar novo saldo
      await trx('user_prepaid_balance').insert({
        id: require('crypto').randomUUID(),
        user_id: userId,
        currency,
        balance: balanceAfter,
        pending_balance: 0,
        last_transaction_at: new Date(),
        created_at: new Date()
      });
    }

    // Registrar transação principal
    await trx('prepaid_transactions').insert({
      id: require('crypto').randomUUID(),
      user_id: userId,
      payment_id: paymentId,
      type: 'credit',
      amount,
      currency,
      balance_before: balanceBefore,
      balance_after: balanceBefore + amount,
      description: 'Recarga via checkout',
      source_type: 'payment',
      source_reference_id: paymentId,
      created_at: new Date()
    });

    // Registrar bônus se aplicável
    if (bonusAmount > 0) {
      await trx('prepaid_transactions').insert({
        id: require('crypto').randomUUID(),
        user_id: userId,
        payment_id: paymentId,
        type: 'bonus',
        amount: bonusAmount,
        currency,
        balance_before: balanceBefore + amount,
        balance_after: balanceAfter,
        description: `Bônus de recarga (${((bonusAmount / amount) * 100).toFixed(1)}%)`,
        source_type: 'bonus',
        source_reference_id: paymentId,
        created_at: new Date()
      });
    }

    return {
      credited_amount: amount,
      bonus_amount: bonusAmount,
      total_credited: totalCredit,
      new_balance: balanceAfter
    };
  }

  /**
   * Sincronizar produtos do Stripe
   */
  async syncStripeProducts() {
    try {
      const stripeProducts = await this.stripe.products.list({
        active: true,
        limit: 100
      });

      let syncedCount = 0;
      let errorCount = 0;

      for (const stripeProduct of stripeProducts.data) {
        try {
          // Verificar se produto já existe
          const existingProduct = await db('stripe_products')
            .where('stripe_product_id', stripeProduct.id)
            .first();

          if (!existingProduct) {
            // Criar produto no banco
            await db('stripe_products').insert({
              id: require('crypto').randomUUID(),
              stripe_product_id: stripeProduct.id,
              name: stripeProduct.name,
              description: stripeProduct.description || '',
              type: stripeProduct.metadata.type || 'prepaid',
              features: JSON.stringify([]),
              is_active: stripeProduct.active,
              metadata: JSON.stringify(stripeProduct.metadata || {}),
              created_at: new Date()
            });

            syncedCount++;
          }
        } catch (error) {
          logger.error(`Erro ao sincronizar produto ${stripeProduct.id}:`, error);
          errorCount++;
        }
      }

      logger.info('Sincronização de produtos concluída', {
        syncedCount,
        errorCount,
        totalProducts: stripeProducts.data.length
      });

      return {
        success: true,
        synced: syncedCount,
        errors: errorCount,
        total: stripeProducts.data.length
      };

    } catch (error) {
      logger.error('Erro na sincronização de produtos:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de produtos
   */
  async getProductStats() {
    try {
      const [
        totalProducts,
        activeProducts,
        revenueByProduct,
        popularProducts
      ] = await Promise.all([
        db('stripe_products').count('* as count').first(),
        db('stripe_products').where('is_active', true).count('* as count').first(),
        
        // Receita por produto (últimos 30 dias)
        db('payments')
          .leftJoin('checkout_sessions', 'payments.id', 'checkout_sessions.stripe_payment_intent_id')
          .leftJoin('stripe_prices', 'checkout_sessions.price_id', 'stripe_prices.id')
          .leftJoin('stripe_products', 'stripe_prices.product_id', 'stripe_products.id')
          .where('payments.status', 'succeeded')
          .where('payments.paid_at', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
          .sum('payments.amount as revenue')
          .count('payments.id as sales')
          .groupBy('stripe_products.id', 'stripe_products.name')
          .select('stripe_products.id', 'stripe_products.name'),

        // Produtos mais populares
        db('checkout_sessions')
          .leftJoin('stripe_prices', 'checkout_sessions.price_id', 'stripe_prices.id')
          .leftJoin('stripe_products', 'stripe_prices.product_id', 'stripe_products.id')
          .where('checkout_sessions.status', 'complete')
          .count('checkout_sessions.id as purchases')
          .groupBy('stripe_products.id', 'stripe_products.name')
          .select('stripe_products.id', 'stripe_products.name')
          .orderBy('purchases', 'desc')
          .limit(5)
      ]);

      return {
        total_products: parseInt(totalProducts.count),
        active_products: parseInt(activeProducts.count),
        revenue_by_product: revenueByProduct.map(item => ({
          ...item,
          revenue: parseFloat(item.revenue || 0),
          sales: parseInt(item.sales)
        })),
        popular_products: popularProducts.map(item => ({
          ...item,
          purchases: parseInt(item.purchases)
        }))
      };

    } catch (error) {
      logger.error('Erro ao obter estatísticas de produtos:', error);
      throw error;
    }
  }
}

export default StripeProductService;
