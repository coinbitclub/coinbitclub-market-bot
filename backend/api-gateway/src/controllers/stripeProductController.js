import StripeProductService from '../services/stripeProductService.js';
import logger from '../../../common/logger.js';

/**
 * Controller para Produtos e Checkout Stripe
 */
export class StripeProductController {

  /**
   * Listar produtos disponíveis
   * GET /api/products
   */
  static async getProducts(req, res) {
    try {
      const {
        type = null,
        include_prices = 'true'
      } = req.query;

      const productService = new StripeProductService();
      const products = await productService.getProducts({
        type,
        include_prices: include_prices === 'true'
      });

      res.json({
        success: true,
        data: products
      });

    } catch (error) {
      logger.error('Erro ao listar produtos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obter produto específico
   * GET /api/products/:id
   */
  static async getProduct(req, res) {
    try {
      const { id } = req.params;

      const productService = new StripeProductService();
      const product = await productService.getProduct(id);

      res.json({
        success: true,
        data: product
      });

    } catch (error) {
      logger.error('Erro ao obter produto:', error);
      
      if (error.message === 'Produto não encontrado') {
        return res.status(404).json({
          success: false,
          message: 'Produto não encontrado'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Criar sessão de checkout
   * POST /api/checkout/create-session
   */
  static async createCheckoutSession(req, res) {
    try {
      const userId = req.user?.id || null;
      const {
        price_id,
        success_url,
        cancel_url,
        promotional_code = null
      } = req.body;

      // Validar campos obrigatórios
      if (!price_id || !success_url || !cancel_url) {
        return res.status(400).json({
          success: false,
          message: 'price_id, success_url e cancel_url são obrigatórios'
        });
      }

      const productService = new StripeProductService();
      const session = await productService.createCheckoutSession({
        price_id,
        user_id: userId,
        success_url,
        cancel_url,
        promotional_code,
        metadata: {
          source: 'web_checkout'
        }
      });

      logger.info('Checkout session criada', {
        userId,
        priceId: price_id,
        sessionId: session.session.id
      });

      res.json({
        success: true,
        data: {
          checkout_url: session.checkout_url,
          session_id: session.session.id
        }
      });

    } catch (error) {
      logger.error('Erro ao criar checkout session:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Webhook do Stripe
   * POST /api/webhooks/stripe
   */
  static async handleStripeWebhook(req, res) {
    try {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!endpointSecret) {
        logger.error('STRIPE_WEBHOOK_SECRET não configurado');
        return res.status(400).send('Webhook secret not configured');
      }

      // Verificar assinatura do webhook
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        logger.error('Erro na verificação do webhook:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Processar evento
      const productService = new StripeProductService();
      
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          await productService.processCheckoutCompleted(session.id, session);
          logger.info('Checkout session processada:', session.id);
          break;

        case 'payment_intent.succeeded':
          logger.info('Payment intent succeeded:', event.data.object.id);
          break;

        case 'invoice.payment_succeeded':
          logger.info('Invoice payment succeeded:', event.data.object.id);
          break;

        default:
          logger.info('Evento não tratado:', event.type);
      }

      res.json({ received: true });

    } catch (error) {
      logger.error('Erro no webhook Stripe:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar webhook'
      });
    }
  }

  /**
   * Verificar status de sessão de checkout
   * GET /api/checkout/session/:session_id
   */
  static async getCheckoutSession(req, res) {
    try {
      const { session_id } = req.params;
      const userId = req.user?.id;

      // Buscar sessão no banco
      let query = db('checkout_sessions')
        .where('stripe_session_id', session_id);

      // Se não for admin, filtrar por usuário
      if (req.user?.role !== 'admin' && userId) {
        query = query.where('user_id', userId);
      }

      const session = await query.first();

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Sessão não encontrada'
        });
      }

      res.json({
        success: true,
        data: {
          id: session.id,
          stripe_session_id: session.stripe_session_id,
          status: session.status,
          amount: parseFloat(session.amount),
          currency: session.currency,
          completed_at: session.completed_at,
          created_at: session.created_at
        }
      });

    } catch (error) {
      logger.error('Erro ao obter sessão de checkout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Criar produto (Admin)
   * POST /api/admin/products
   */
  static async createProduct(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const {
        name,
        description,
        type,
        features = [],
        is_active = true,
        metadata = {}
      } = req.body;

      // Validar campos obrigatórios
      if (!name || !type) {
        return res.status(400).json({
          success: false,
          message: 'Nome e tipo são obrigatórios'
        });
      }

      if (!['subscription', 'prepaid', 'one_time'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo deve ser subscription, prepaid ou one_time'
        });
      }

      const productService = new StripeProductService();
      const result = await productService.createProduct({
        name,
        description,
        type,
        features,
        is_active,
        metadata
      });

      logger.info('Produto criado por admin', {
        adminId: req.user.id,
        productId: result.product.id,
        productName: name
      });

      res.json({
        success: true,
        message: 'Produto criado com sucesso',
        data: result
      });

    } catch (error) {
      logger.error('Erro ao criar produto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Criar preço para produto (Admin)
   * POST /api/admin/products/:id/prices
   */
  static async createPrice(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const { id: product_id } = req.params;
      const {
        amount,
        currency,
        interval = null,
        interval_count = 1,
        trial_period_days = 0,
        is_active = true,
        nickname = null,
        metadata = {}
      } = req.body;

      // Validar campos obrigatórios
      if (!amount || !currency) {
        return res.status(400).json({
          success: false,
          message: 'Valor e moeda são obrigatórios'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valor deve ser maior que zero'
        });
      }

      const productService = new StripeProductService();
      const result = await productService.createPrice({
        product_id,
        amount,
        currency: currency.toUpperCase(),
        interval,
        interval_count,
        trial_period_days,
        is_active,
        nickname,
        metadata
      });

      logger.info('Preço criado por admin', {
        adminId: req.user.id,
        productId: product_id,
        priceId: result.price.id,
        amount,
        currency
      });

      res.json({
        success: true,
        message: 'Preço criado com sucesso',
        data: result
      });

    } catch (error) {
      logger.error('Erro ao criar preço:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Sincronizar produtos do Stripe (Admin)
   * POST /api/admin/products/sync
   */
  static async syncProducts(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const productService = new StripeProductService();
      const result = await productService.syncStripeProducts();

      logger.info('Sincronização de produtos executada', {
        adminId: req.user.id,
        result
      });

      res.json({
        success: true,
        message: 'Sincronização concluída',
        data: result
      });

    } catch (error) {
      logger.error('Erro na sincronização de produtos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obter estatísticas de produtos (Admin)
   * GET /api/admin/products/stats
   */
  static async getProductStats(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const productService = new StripeProductService();
      const stats = await productService.getProductStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Erro ao obter estatísticas de produtos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default StripeProductController;
