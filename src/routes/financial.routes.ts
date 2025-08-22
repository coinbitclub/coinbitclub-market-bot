// ========================================
// MARKETBOT - FINANCIAL ROUTES
// Sistema financeiro completo para pagamentos
// FASE 3 - Rotas de pagamentos e planos
// ========================================

import { Router } from 'express';
import { financialController } from '../controllers/financial.controller.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Middleware simples de autenticação
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token de acesso é obrigatório'
    });
  }

  // Por enquanto, apenas verificar se o token existe
  // TODO: Implementar validação JWT completa
  next();
};

// ========================================
// ROTAS PÚBLICAS (sem autenticação)
// ========================================

/**
 * GET /api/financial/plans
 * Listar todos os planos disponíveis
 */
router.get('/plans', async (req, res) => {
  try {
    await financialController.getPlans(req, res);
  } catch (error) {
    logger.error('❌ Erro na rota /plans:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/financial/webhook/stripe
 * Webhook do Stripe para processar eventos de pagamento
 */
router.post('/webhook/stripe', async (req, res) => {
  try {
    await financialController.handleStripeWebhook(req, res);
  } catch (error) {
    logger.error('❌ Erro no webhook Stripe:', error);
    res.status(400).json({
      success: false,
      error: 'Erro ao processar webhook'
    });
  }
});

// ========================================
// ROTAS PROTEGIDAS (com autenticação)
// ========================================

/**
 * POST /api/financial/payment/create
 * Criar nova sessão de pagamento
 * Body: { planId, userId, affiliateCode?, couponCode? }
 */
router.post('/payment/create', authenticateToken, async (req, res) => {
  try {
    await financialController.createPaymentSession(req, res);
  } catch (error) {
    logger.error('❌ Erro na rota /payment/create:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/financial/payment/status/:sessionId
 * Verificar status de uma sessão de pagamento
 */
router.get('/payment/status/:sessionId', authenticateToken, async (req, res) => {
  try {
    await financialController.checkPaymentStatus(req, res);
  } catch (error) {
    logger.error('❌ Erro na rota /payment/status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/financial/history/:userId
 * Histórico de pagamentos do usuário
 * Query params: page?, limit?
 */
router.get('/history/:userId', authenticateToken, async (req, res) => {
  try {
    await financialController.getUserPaymentHistory(req, res);
  } catch (error) {
    logger.error('❌ Erro na rota /history:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS DE ADMINISTRAÇÃO
// ========================================

/**
 * GET /api/financial/admin/payments
 * Listar todos os pagamentos (admin apenas)
 */
router.get('/admin/payments', authenticateToken, async (req, res) => {
  try {
    // TODO: Verificar se usuário é admin
    // TODO: Implementar listagem de todos os pagamentos
    res.json({
      success: true,
      message: 'Funcionalidade em desenvolvimento'
    });
  } catch (error) {
    logger.error('❌ Erro na rota admin/payments:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/financial/admin/refund
 * Processar reembolso (admin apenas)
 */
router.post('/admin/refund', authenticateToken, async (req, res) => {
  try {
    // TODO: Verificar se usuário é admin
    // TODO: Implementar sistema de reembolso
    res.json({
      success: true,
      message: 'Funcionalidade em desenvolvimento'
    });
  } catch (error) {
    logger.error('❌ Erro na rota admin/refund:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ========================================
// ROTAS DE TESTE (apenas em desenvolvimento)
// ========================================

if (process.env.NODE_ENV === 'development') {
  /**
   * POST /api/financial/test/create-products
   * Criar produtos de teste no Stripe
   */
  router.post('/test/create-products', async (req, res) => {
    try {
      logger.info('🧪 Criando produtos de teste no Stripe');
      
      // Importar stripeService
      const { stripeService } = await import('../services/stripe.service.js');
      
      // Criar produtos
      const products = await stripeService.createProducts();
      
      // Criar preços
      const prices = await stripeService.createPrices();
      
      res.json({
        success: true,
        data: {
          products,
          prices
        }
      });
    } catch (error) {
      logger.error('❌ Erro ao criar produtos de teste:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao criar produtos de teste'
      });
    }
  });

  /**
   * GET /api/financial/test/stripe-status
   * Verificar status da integração com Stripe
   */
  router.get('/test/stripe-status', async (req, res) => {
    try {
      const { stripeService } = await import('../services/stripe.service.js');
      
      const products = await stripeService.getAllProducts();
      const prices = await stripeService.getAllPrices();
      
      res.json({
        success: true,
        data: {
          stripeConnected: true,
          totalProducts: products.length,
          totalPrices: prices.length,
          products: products.map(p => ({
            id: p.id,
            name: p.name,
            active: p.active
          })),
          prices: prices.map(p => ({
            id: p.id,
            amount: p.unit_amount,
            currency: p.currency,
            recurring: p.recurring
          }))
        }
      });
    } catch (error) {
      logger.error('❌ Erro ao verificar status do Stripe:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar integração com Stripe'
      });
    }
  });
}

export default router;
