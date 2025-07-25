const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const logger = require('../common/logger');
const db = require('../common/db');

/**
 * Criar sessão de checkout
 */
router.post('/checkout/create-session', async (req, res) => {
  try {
    const {
      user_id,
      price_id,
      custom_amount,
      currency = 'BRL',
      coupon_code,
      product_type
    } = req.body;

    // Validar dados obrigatórios
    if (!user_id || !price_id) {
      return res.status(400).json({
        error: 'user_id e price_id são obrigatórios'
      });
    }

    // Validar código promocional se fornecido
    let validatedCoupon = null;
    if (coupon_code) {
      try {
        const amount = custom_amount || 0;
        validatedCoupon = await stripeService.validatePromotionalCode(
          coupon_code, 
          user_id, 
          amount, 
          currency, 
          product_type
        );
      } catch (error) {
        return res.status(400).json({
          error: error.message
        });
      }
    }

    // URLs de retorno
    const success_url = `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${process.env.FRONTEND_URL}/checkout/cancel`;

    const session = await stripeService.createCheckoutSession({
      user_id,
      price_id,
      custom_amount,
      currency,
      coupon_code: validatedCoupon?.code,
      success_url,
      cancel_url
    });

    res.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    logger.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Webhook do Stripe
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    await stripeService.processWebhook(req.body, signature);
    
    res.json({ received: true });
  } catch (error) {
    logger.error('Erro no webhook:', error);
    res.status(400).json({
      error: error.message
    });
  }
});

/**
 * Buscar produtos disponíveis
 */
router.get('/products', async (req, res) => {
  try {
    const { currency = 'BRL' } = req.query;
    
    const products = await stripeService.getActiveProducts();
    
    // Filtrar por moeda
    const filteredProducts = products.filter(p => 
      p.currency.toUpperCase() === currency.toUpperCase()
    );

    res.json(filteredProducts);
  } catch (error) {
    logger.error('Erro ao buscar produtos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Validar código promocional
 */
router.post('/validate-coupon', async (req, res) => {
  try {
    const { code, user_id, amount, currency, product_type } = req.body;

    if (!code || !user_id || !amount || !currency || !product_type) {
      return res.status(400).json({
        error: 'Todos os campos são obrigatórios'
      });
    }

    const promoCode = await stripeService.validatePromotionalCode(
      code, 
      user_id, 
      amount, 
      currency, 
      product_type
    );

    const discount = stripeService.calculateDiscount(amount, promoCode);
    const finalAmount = amount - discount;

    res.json({
      valid: true,
      code: promoCode.code,
      discount_type: promoCode.discount_type,
      discount_value: promoCode.discount_value,
      discount_amount: discount,
      final_amount: finalAmount,
      description: promoCode.description
    });

  } catch (error) {
    res.status(400).json({
      valid: false,
      error: error.message
    });
  }
});

/**
 * Buscar histórico de pagamentos do usuário
 */
router.get('/payments/history/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const payments = await db('payments')
      .where('user_id', user_id)
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .offset(offset);

    const total = await db('payments')
      .where('user_id', user_id)
      .count('id as count')
      .first();

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    });

  } catch (error) {
    logger.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Buscar saldo pré-pago do usuário
 */
router.get('/balance/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const balances = await db('user_prepaid_balance')
      .where('user_id', user_id);

    const balanceMap = {};
    balances.forEach(balance => {
      balanceMap[balance.currency] = {
        balance: parseFloat(balance.balance),
        pending_balance: parseFloat(balance.pending_balance),
        last_transaction_at: balance.last_transaction_at
      };
    });

    res.json(balanceMap);

  } catch (error) {
    logger.error('Erro ao buscar saldo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Buscar configurações de desconto por faixa
 */
router.get('/discount-tiers', async (req, res) => {
  try {
    const { currency = 'BRL' } = req.query;

    const settings = await db('payment_settings')
      .where('key', 'prepaid_discounts')
      .first();

    if (!settings) {
      return res.json({ tiers: [] });
    }

    const discountConfig = settings.value;
    const tiers = currency.toUpperCase() === 'BRL' 
      ? discountConfig.brl_tiers 
      : discountConfig.usd_tiers;

    res.json({
      enabled: discountConfig.enabled,
      first_time_only: discountConfig.first_time_only,
      tiers: tiers || []
    });

  } catch (error) {
    logger.error('Erro ao buscar tiers de desconto:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Verificar se é primeira compra do usuário
 */
router.get('/first-purchase/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const hasExistingPayments = await stripeService.checkUserFirstPurchase(user_id);

    res.json({
      is_first_purchase: !hasExistingPayments
    });

  } catch (error) {
    logger.error('Erro ao verificar primeira compra:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Cancelar sessão de checkout
 */
router.post('/checkout/cancel/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    // Atualizar status da sessão no banco
    await db('checkout_sessions')
      .where('stripe_session_id', session_id)
      .update({
        status: 'expired'
      });

    res.json({ success: true });

  } catch (error) {
    logger.error('Erro ao cancelar sessão:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Buscar detalhes de uma sessão
 */
router.get('/checkout/session/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    const session = await db('checkout_sessions')
      .join('stripe_prices', 'checkout_sessions.price_id', 'stripe_prices.id')
      .join('stripe_products', 'stripe_prices.product_id', 'stripe_products.id')
      .where('checkout_sessions.stripe_session_id', session_id)
      .select(
        'checkout_sessions.*',
        'stripe_products.name as product_name',
        'stripe_products.description as product_description',
        'stripe_prices.nickname as price_nickname'
      )
      .first();

    if (!session) {
      return res.status(404).json({
        error: 'Sessão não encontrada'
      });
    }

    res.json(session);

  } catch (error) {
    logger.error('Erro ao buscar sessão:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
