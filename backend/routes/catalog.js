const express = require('express');
const { ProductCatalogController } = require('../controllers/productCatalogController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { body, query } = require('express-validator');

const router = express.Router();
const catalogController = new ProductCatalogController();

// Validações
const checkoutValidation = [
    body('product_id').notEmpty().withMessage('product_id é obrigatório'),
    body('price_id').notEmpty().withMessage('price_id é obrigatório'),
    body('success_url').optional().isURL().withMessage('success_url deve ser uma URL válida'),
    body('cancel_url').optional().isURL().withMessage('cancel_url deve ser uma URL válida'),
    body('customer_email').optional().isEmail().withMessage('customer_email deve ser um email válido'),
    body('promo_code').optional().isString().isLength({ min: 3, max: 20 })
];

const promoCodeValidation = [
    query('code').notEmpty().withMessage('Código promocional é obrigatório')
];

const categoryValidation = [
    query('category').optional().isIn(['basic', 'professional', 'premium', 'enterprise'])
        .withMessage('Categoria inválida'),
    query('type').optional().isIn(['subscription', 'prepaid'])
        .withMessage('Tipo inválido')
];

// Rotas públicas (sem autenticação)

/**
 * @route GET /api/catalog/public
 * @desc Buscar catálogo público de produtos
 * @access Public
 */
router.get('/public', async (req, res) => {
    await catalogController.getPublicCatalog(req, res);
});

/**
 * @route GET /api/catalog/products
 * @desc Buscar produtos por categoria/tipo
 * @access Public
 */
router.get('/products', 
    categoryValidation,
    validateRequest,
    async (req, res) => {
        await catalogController.getProductsByCategory(req, res);
    }
);

/**
 * @route GET /api/catalog/promo-code/validate
 * @desc Validar código promocional
 * @access Public
 */
router.get('/promo-code/validate',
    promoCodeValidation,
    validateRequest,
    async (req, res) => {
        await catalogController.validatePromoCode(req, res);
    }
);

/**
 * @route POST /api/catalog/checkout
 * @desc Criar sessão de checkout para produto
 * @access Public
 */
router.post('/checkout',
    checkoutValidation,
    validateRequest,
    async (req, res) => {
        await catalogController.createProductCheckout(req, res);
    }
);

// Rotas administrativas (requerem autenticação de admin)

/**
 * @route POST /api/catalog/admin/initialize
 * @desc Inicializar catálogo completo
 * @access Admin
 */
router.post('/admin/initialize',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        await catalogController.initializeCatalog(req, res);
    }
);

/**
 * @route GET /api/catalog/admin/full
 * @desc Buscar catálogo completo para administração
 * @access Admin
 */
router.get('/admin/full',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        await catalogController.getAdminCatalog(req, res);
    }
);

/**
 * @route POST /api/catalog/admin/sync
 * @desc Sincronizar catálogo com Stripe
 * @access Admin
 */
router.post('/admin/sync',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        await catalogController.syncWithStripe(req, res);
    }
);

// Rotas para usuários autenticados

/**
 * @route POST /api/catalog/user/checkout
 * @desc Criar checkout personalizado para usuário logado
 * @access User
 */
router.post('/user/checkout',
    authenticateToken,
    checkoutValidation,
    validateRequest,
    async (req, res) => {
        // Adicionar informações do usuário à requisição
        req.body.customer_email = req.user.email;
        req.body.metadata = {
            ...req.body.metadata,
            user_id: req.user.id,
            user_type: req.user.user_type || 'regular'
        };
        
        await catalogController.createProductCheckout(req, res);
    }
);

/**
 * @route GET /api/catalog/user/recommendations
 * @desc Buscar produtos recomendados para o usuário
 * @access User
 */
router.get('/user/recommendations',
    authenticateToken,
    async (req, res) => {
        try {
            // Implementar lógica de recomendação baseada no perfil do usuário
            const userType = req.user.user_type || 'regular';
            const currentPlan = req.user.current_plan || 'free';
            
            let recommendedCategory = 'basic';
            
            if (currentPlan === 'free') {
                recommendedCategory = 'basic';
            } else if (currentPlan === 'basic') {
                recommendedCategory = 'professional';
            } else if (currentPlan === 'professional') {
                recommendedCategory = 'premium';
            }

            // Buscar produtos recomendados
            req.query.category = recommendedCategory;
            req.query.type = 'subscription';
            
            await catalogController.getProductsByCategory(req, res);
        } catch (error) {
            console.error('Erro ao buscar recomendações:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
);

/**
 * @route GET /api/catalog/user/purchase-history
 * @desc Buscar histórico de compras do usuário
 * @access User
 */
router.get('/user/purchase-history',
    authenticateToken,
    async (req, res) => {
        try {
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            // Buscar histórico de compras
            const purchases = await catalogController.stripeService.db('checkout_sessions')
                .join('stripe_products', 'checkout_sessions.product_id', 'stripe_products.id')
                .join('stripe_prices', 'checkout_sessions.price_id', 'stripe_prices.id')
                .select(
                    'checkout_sessions.*',
                    'stripe_products.name as product_name',
                    'stripe_products.description as product_description',
                    'stripe_prices.unit_amount',
                    'stripe_prices.currency'
                )
                .where('checkout_sessions.customer_email', req.user.email)
                .where('checkout_sessions.status', 'completed')
                .orderBy('checkout_sessions.created_at', 'desc')
                .limit(limit)
                .offset(offset);

            const total = await catalogController.stripeService.db('checkout_sessions')
                .where('customer_email', req.user.email)
                .where('status', 'completed')
                .count('* as count')
                .first();

            res.json({
                success: true,
                data: {
                    purchases: purchases.map(purchase => ({
                        id: purchase.id,
                        product_name: purchase.product_name,
                        product_description: purchase.product_description,
                        amount: purchase.amount_total,
                        currency: purchase.currency.toUpperCase(),
                        formatted_amount: catalogController.formatPrice(purchase.amount_total, purchase.currency),
                        status: purchase.status,
                        payment_date: purchase.created_at,
                        stripe_session_id: purchase.stripe_session_id
                    })),
                    pagination: {
                        current_page: parseInt(page),
                        total_pages: Math.ceil(total.count / limit),
                        total_items: total.count,
                        items_per_page: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao buscar histórico de compras:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
);

module.exports = router;
