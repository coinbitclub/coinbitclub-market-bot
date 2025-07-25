import express from 'express';
import StripeProductController from '../controllers/stripeProductController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { body, query, param } from 'express-validator';

const router = express.Router();

/**
 * @route GET /api/products
 * @desc Listar produtos disponíveis (público)
 * @access Public
 */
router.get('/',
  [
    query('type')
      .optional()
      .isIn(['subscription', 'prepaid', 'one_time'])
      .withMessage('Tipo deve ser subscription, prepaid ou one_time'),
    query('include_prices')
      .optional()
      .isBoolean()
      .withMessage('include_prices deve ser boolean')
  ],
  validateRequest,
  StripeProductController.getProducts
);

/**
 * @route GET /api/products/:id
 * @desc Obter produto específico (público)
 * @access Public
 */
router.get('/:id',
  [
    param('id')
      .isUUID()
      .withMessage('ID do produto deve ser um UUID válido')
  ],
  validateRequest,
  StripeProductController.getProduct
);

/**
 * @route POST /api/checkout/create-session
 * @desc Criar sessão de checkout
 * @access Public (mas pode ter usuário logado)
 */
router.post('/checkout/create-session',
  optionalAuth, // Permite usuário logado ou não
  [
    body('price_id')
      .isUUID()
      .withMessage('price_id deve ser um UUID válido'),
    body('success_url')
      .isURL()
      .withMessage('success_url deve ser uma URL válida'),
    body('cancel_url')
      .isURL()
      .withMessage('cancel_url deve ser uma URL válida'),
    body('promotional_code')
      .optional()
      .isString()
      .withMessage('promotional_code deve ser uma string')
  ],
  validateRequest,
  StripeProductController.createCheckoutSession
);

/**
 * @route GET /api/checkout/session/:session_id
 * @desc Verificar status de sessão de checkout
 * @access Private (opcional para usuários logados)
 */
router.get('/checkout/session/:session_id',
  optionalAuth,
  [
    param('session_id')
      .isString()
      .withMessage('session_id deve ser uma string')
  ],
  validateRequest,
  StripeProductController.getCheckoutSession
);

/**
 * @route POST /api/webhooks/stripe
 * @desc Webhook do Stripe
 * @access Public (mas verificado por assinatura)
 */
router.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }), // Raw body para verificação de assinatura
  StripeProductController.handleStripeWebhook
);

// === ROTAS ADMINISTRATIVAS ===

/**
 * @route POST /api/admin/products
 * @desc Criar produto (Admin)
 * @access Admin only
 */
router.post('/admin/products',
  authenticateToken,
  [
    body('name')
      .notEmpty()
      .withMessage('Nome é obrigatório')
      .isLength({ max: 255 })
      .withMessage('Nome deve ter no máximo 255 caracteres'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Descrição deve ter no máximo 1000 caracteres'),
    body('type')
      .isIn(['subscription', 'prepaid', 'one_time'])
      .withMessage('Tipo deve ser subscription, prepaid ou one_time'),
    body('features')
      .optional()
      .isArray()
      .withMessage('Features deve ser um array'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active deve ser boolean'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('metadata deve ser um objeto')
  ],
  validateRequest,
  StripeProductController.createProduct
);

/**
 * @route POST /api/admin/products/:id/prices
 * @desc Criar preço para produto (Admin)
 * @access Admin only
 */
router.post('/admin/products/:id/prices',
  authenticateToken,
  [
    param('id')
      .isUUID()
      .withMessage('ID do produto deve ser um UUID válido'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Valor deve ser maior que zero'),
    body('currency')
      .isIn(['BRL', 'USD', 'EUR'])
      .withMessage('Moeda deve ser BRL, USD ou EUR'),
    body('interval')
      .optional()
      .isIn(['day', 'week', 'month', 'year'])
      .withMessage('Intervalo deve ser day, week, month ou year'),
    body('interval_count')
      .optional()
      .isInt({ min: 1 })
      .withMessage('interval_count deve ser um número inteiro maior que zero'),
    body('trial_period_days')
      .optional()
      .isInt({ min: 0 })
      .withMessage('trial_period_days deve ser um número inteiro não negativo'),
    body('nickname')
      .optional()
      .isLength({ max: 100 })
      .withMessage('nickname deve ter no máximo 100 caracteres'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('metadata deve ser um objeto')
  ],
  validateRequest,
  StripeProductController.createPrice
);

/**
 * @route POST /api/admin/products/sync
 * @desc Sincronizar produtos do Stripe (Admin)
 * @access Admin only
 */
router.post('/admin/products/sync',
  authenticateToken,
  StripeProductController.syncProducts
);

/**
 * @route GET /api/admin/products/stats
 * @desc Obter estatísticas de produtos (Admin)
 * @access Admin only
 */
router.get('/admin/products/stats',
  authenticateToken,
  StripeProductController.getProductStats
);

export default router;
