import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { couponAffiliateController } from '../controllers/coupon-affiliate.controller';

const router = Router();

// Middleware simples para rotas protegidas (temporário)
const simpleAuth = (req: any, res: any, next: any) => {
  // Por enquanto, permitir todas as requisições
  // TODO: Implementar autenticação real quando necessário
  next();
};

// ========================================
// ROTAS DE PAGAMENTO E PLANOS
// ========================================

// Inicializar produtos no Stripe (executar uma vez apenas)
router.post('/initialize-stripe', paymentController.initializeStripeProducts);

// Listar planos disponíveis
router.get('/plans', paymentController.getPlans);

// Obter links de pagamento diretos
router.get('/links', paymentController.getPaymentLinks);

// Criar checkout session
router.post('/checkout/:priceId', paymentController.createCheckout);

// Webhook do Stripe
router.post('/webhook', paymentController.handleWebhook);

// ========================================
// ROTAS DE CUPONS
// ========================================

// Gerar cupom individual
router.post('/coupons/generate', simpleAuth, couponAffiliateController.generateCoupon);

// Gerar cupons automáticos (VIP, Primeira Compra, Black Friday)
router.post('/coupons/auto-generate', simpleAuth, couponAffiliateController.generateAutomaticCoupons);

// Validar cupom
router.post('/coupons/:code/validate', couponAffiliateController.validateCoupon);

// Listar cupons
router.get('/coupons', couponAffiliateController.listCoupons);

// Estatísticas de cupom
router.get('/coupons/:couponId/stats', simpleAuth, couponAffiliateController.getCouponStats);

// ========================================
// ROTAS DE AFILIADOS
// ========================================

// Criar afiliado individual
router.post('/affiliates/create', simpleAuth, couponAffiliateController.createAffiliate);

// Gerar afiliados para todos os usuários
router.post('/affiliates/generate-all', simpleAuth, couponAffiliateController.generateAllAffiliates);

// Buscar afiliado por usuário
router.get('/affiliates/user/:userId', couponAffiliateController.getAffiliateByUser);

// Buscar afiliado por código
router.get('/affiliates/code/:code', couponAffiliateController.getAffiliateByCode);

// Top afiliados
router.get('/affiliates/top', simpleAuth, couponAffiliateController.getTopAffiliates);

// Pagar comissão
router.post('/affiliates/:affiliateId/pay', simpleAuth, couponAffiliateController.payCommission);

// Landing page de afiliado
router.get('/ref/:code', couponAffiliateController.getAffiliateLanding);

// ========================================
// ROTAS DE TESTE E DEMONSTRAÇÃO
// ========================================

// Demonstração dos links de pagamento
router.get('/demo', (req, res) => {
  res.json({
    success: true,
    message: 'MarketBot - Sistema de Pagamentos Ativo',
    demo_links: {
      plano_mensal: {
        preco: 'R$ 497,00/mês',
        descricao: 'Trading automático com renovação mensal',
        link: 'https://marketbot.ngrok.app/api/v1/payments/checkout/price_monthly_497',
        features: [
          '✅ Trading automático 24/7',
          '✅ Sinais ilimitados',
          '✅ Suporte prioritário',
          '✅ Dashboard avançado',
          '✅ APIs Binance/Bybit',
          '✅ Stop Loss automático'
        ]
      },
      plano_prepago: {
        preco: 'R$ 1.997,00 (4 meses)',
        descricao: 'Créditos pré-pagos com 25% de desconto',
        link: 'https://marketbot.ngrok.app/api/v1/payments/checkout/price_prepaid_1997',
        features: [
          '✅ Trading automático 24/7',
          '✅ Sinais ilimitados',
          '✅ Suporte VIP',
          '✅ Dashboard avançado',
          '✅ APIs Binance/Bybit',
          '✅ Stop Loss automático',
          '🎯 25% DESCONTO',
          '🎯 Sem renovação automática'
        ]
      }
    },
    sistema_afiliados: {
      comissao_normal: '1.5%',
      comissao_vip: '5.0%',
      exemplo_ganho_mensal: 'R$ 74,55 por referral',
      exemplo_ganho_prepago: 'R$ 299,55 por referral VIP'
    },
    cupons_disponiveis: {
      primeiro_mes: '10% desconto',
      vip: '15% desconto',
      black_friday: '25% desconto'
    }
  });
});

export { router as paymentRoutes };
