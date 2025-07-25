/**
 * Rotas de Pagamentos
 * Endpoints para recargas, assinaturas e saques
 */
import express from 'express';
import paymentsController from '../controllers/paymentsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { body, query } from 'express-validator';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

/**
 * Recargas (Prepaid)
 */

// Criar checkout para recarga flexível
router.post('/prepaid/checkout', [
  body('amount')
    .isNumeric()
    .withMessage('Valor deve ser numérico')
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }
      return true;
    }),
  body('currency')
    .optional()
    .isIn(['BRL', 'USD'])
    .withMessage('Moeda deve ser BRL ou USD'),
  body('promotional_code')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Código promocional inválido'),
  validateRequest
], paymentsController.createPrepaidCheckout);

// Obter valores sugeridos para recarga
router.get('/prepaid/suggested-amounts', async (req, res) => {
  try {
    const { currency = 'BRL' } = req.query;
    
    const suggestedAmounts = {
      BRL: [100, 200, 500, 1000, 2000, 5000, 10000],
      USD: [20, 50, 100, 250, 500, 1000, 2500]
    };
    
    const discountSettings = await db('payment_settings')
      .where('key', 'prepaid_discounts')
      .first();
    
    let discountTiers = [];
    if (discountSettings && discountSettings.value.enabled) {
      discountTiers = currency === 'BRL' 
        ? discountSettings.value.brl_tiers 
        : discountSettings.value.usd_tiers;
    }
    
    const currencyConfig = await db('currency_settings')
      .where('currency', currency)
      .first();
    
    res.json({
      currency: currency,
      minimum_amount: currencyConfig.minimum_balance,
      suggested_amounts: suggestedAmounts[currency] || [],
      discount_tiers: discountTiers.map(tier => ({
        minimum: tier.minimum / 100,
        maximum: tier.maximum / 100,
        discount_percentage: tier.discount_percentage
      })),
      payment_methods: currencyConfig.payment_methods
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Assinaturas
 */

// Criar checkout para assinatura
router.post('/subscription/checkout', [
  body('plan_type')
    .isIn(['brasil_mensal', 'brasil_comissao', 'exterior_mensal', 'exterior_comissao'])
    .withMessage('Tipo de plano inválido'),
  body('promotional_code')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Código promocional inválido'),
  validateRequest
], paymentsController.createSubscriptionCheckout);

// Obter planos disponíveis
router.get('/subscription/plans', async (req, res) => {
  try {
    const subscriptionSettings = await db('payment_settings')
      .where('key', 'subscription_plans')
      .first();
    
    const plans = subscriptionSettings.value;
    
    res.json({
      plans: {
        brasil: {
          mensal: {
            monthly_fee: plans.brasil_mensal.monthly_fee / 100,
            commission_rate: plans.brasil_mensal.commission_rate,
            currency: plans.brasil_mensal.currency,
            description: 'Plano mensal para operadores do Brasil'
          },
          comissao: {
            monthly_fee: plans.brasil_comissao.monthly_fee / 100,
            commission_rate: plans.brasil_comissao.commission_rate,
            currency: plans.brasil_comissao.currency,
            description: 'Plano apenas comissão para operadores do Brasil'
          }
        },
        internacional: {
          mensal: {
            monthly_fee: plans.exterior_mensal.monthly_fee / 100,
            commission_rate: plans.exterior_mensal.commission_rate,
            currency: plans.exterior_mensal.currency,
            description: 'Monthly plan for international operators'
          },
          comissao: {
            monthly_fee: plans.exterior_comissao.monthly_fee / 100,
            commission_rate: plans.exterior_comissao.commission_rate,
            currency: plans.exterior_comissao.currency,
            description: 'Commission only plan for international operators'
          }
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar assinatura atual
router.get('/subscription/current', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const currentSubscription = await db('payments')
      .where('user_id', userId)
      .where('type', 'subscription')
      .where('status', 'succeeded')
      .whereNotNull('stripe_subscription_id')
      .orderBy('created_at', 'desc')
      .first();
    
    if (!currentSubscription) {
      return res.json({ has_subscription: false });
    }
    
    // Verificar status no Stripe
    const stripeSubscription = await stripeService.stripe.subscriptions.retrieve(
      currentSubscription.stripe_subscription_id
    );
    
    res.json({
      has_subscription: true,
      subscription: {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        current_period_start: stripeSubscription.current_period_start,
        current_period_end: stripeSubscription.current_period_end,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end
      },
      payment: currentSubscription
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Saques
 */

// Solicitar saque
router.post('/withdrawal/request', [
  body('amount')
    .isNumeric()
    .withMessage('Valor deve ser numérico')
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }
      return true;
    }),
  body('currency')
    .optional()
    .isIn(['BRL', 'USD'])
    .withMessage('Moeda deve ser BRL ou USD'),
  body('withdrawal_type')
    .isIn(['user_prepaid', 'admin_profit', 'affiliate_commission'])
    .withMessage('Tipo de saque inválido'),
  body('pix_key')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Chave PIX inválida'),
  body('crypto_address')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 20, max: 100 })
    .withMessage('Endereço crypto inválido'),
  body('bank_details')
    .optional()
    .isObject()
    .withMessage('Dados bancários devem ser um objeto'),
  validateRequest
], paymentsController.requestWithdrawal);

// Listar solicitações de saque
router.get('/withdrawal/requests', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser entre 1 e 100'),
  query('status')
    .optional()
    .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled'])
    .withMessage('Status inválido'),
  validateRequest
], async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;
    
    let query = db('withdrawal_requests')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);
    
    if (status) {
      query = query.where('status', status);
    }
    
    const requests = await query;
    
    const totalQuery = db('withdrawal_requests')
      .where('user_id', userId)
      .count('* as count');
    
    if (status) {
      totalQuery.where('status', status);
    }
    
    const total = await totalQuery.first();
    
    res.json({
      requests: requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Cancelar solicitação de saque
router.post('/withdrawal/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const withdrawal = await db('withdrawal_requests')
      .where('id', id)
      .where('user_id', userId)
      .where('status', 'pending')
      .first();
    
    if (!withdrawal) {
      return res.status(404).json({
        error: 'Solicitação de saque não encontrada ou não pode ser cancelada'
      });
    }
    
    await db('withdrawal_requests')
      .where('id', id)
      .update({
        status: 'cancelled',
        processing_notes: 'Cancelado pelo usuário'
      });
    
    res.json({
      message: 'Solicitação de saque cancelada com sucesso'
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Consultas gerais
 */

// Obter saldo do usuário
router.get('/balance', paymentsController.getUserBalance);

// Obter histórico de pagamentos
router.get('/history', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser entre 1 e 100'),
  query('type')
    .optional()
    .isIn(['subscription', 'prepaid', 'one_time', 'refund'])
    .withMessage('Tipo inválido'),
  validateRequest
], paymentsController.getPaymentHistory);

// Obter transações de saldo
router.get('/transactions', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser entre 1 e 100'),
  query('type')
    .optional()
    .isIn(['credit', 'debit', 'bonus', 'refund', 'fee'])
    .withMessage('Tipo inválido'),
  validateRequest
], async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;
    
    let query = db('prepaid_transactions')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);
    
    if (type) {
      query = query.where('type', type);
    }
    
    const transactions = await query;
    
    const totalQuery = db('prepaid_transactions')
      .where('user_id', userId)
      .count('* as count');
    
    if (type) {
      totalQuery.where('type', type);
    }
    
    const total = await totalQuery.first();
    
    res.json({
      transactions: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Webhook do Stripe (sem autenticação)
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), paymentsController.handleStripeWebhook);

export default router;
