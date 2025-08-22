import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

// ========================================
// ROTAS DE TESTE DIRETO PARA SISTEMA FINANCEIRO
// ========================================

// Validar cupom (rota GET simplificada)
router.get('/validate-coupon/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    // Cupons válidos de teste + cupons de crédito
    const validCoupons = [
      'WELCOME10', 
      'PROMO20', 
      'VIP25',
      'CREDIT250BRL',  // Cupom de crédito R$ 250
      'CREDIT50USD'    // Cupom de crédito $50 USD
    ];
    
    const isValid = validCoupons.includes(code);
    let discount = 0;
    let description = '';
    let creditAmount = 0;
    let currency = '';
    
    if (isValid) {
      switch (code) {
        case 'WELCOME10':
          discount = 10;
          description = 'Cupom de 10% de desconto';
          break;
        case 'PROMO20':
          discount = 20;
          description = 'Cupom de 20% de desconto';
          break;
        case 'VIP25':
          discount = 25;
          description = 'Cupom VIP de 25% de desconto';
          break;
        case 'CREDIT250BRL':
          discount = 0;
          creditAmount = 250;
          currency = 'BRL';
          description = 'Cupom de crédito direto: R$ 250 será adicionado à sua carteira';
          break;
        case 'CREDIT50USD':
          discount = 0;
          creditAmount = 50;
          currency = 'USD';
          description = 'Cupom de crédito direto: $50 USD será adicionado à sua carteira';
          break;
      }
    }
    
    res.json({
      success: isValid,
      coupon: {
        code,
        discount,
        creditAmount,
        currency,
        description,
        valid: isValid,
        reason: isValid ? 'Cupom válido' : 'Cupom não encontrado',
        type: creditAmount > 0 ? 'credit' : 'discount'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao validar cupom'
    });
  }
});

// Gerar afiliado (rota simplificada)
router.post('/affiliate/generate', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const affiliateCode = `AFF${Date.now().toString().slice(-6)}`;
    
    res.json({
      success: true,
      affiliateCode,
      userId: userId || 1,
      commissionRate: 10
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar afiliado'
    });
  }
});

// Validar afiliado
router.get('/affiliate/validate/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const isValid = code.startsWith('AFF') && code.length === 9;
    
    res.json({
      success: isValid,
      affiliate: isValid ? {
        id: 1,
        code,
        userId: 1,
        commissionRate: 10,
        totalReferrals: 5,
        totalEarnings: 250
      } : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao validar afiliado'
    });
  }
});

// Gerar cupom (rota simplificada)
router.post('/coupon/generate', async (req: Request, res: Response) => {
  try {
    const { discountPercentage, description, maxUses } = req.body;
    const code = `CUP${Date.now().toString().slice(-5)}`;
    
    res.json({
      success: true,
      coupon: {
        code,
        discount: discountPercentage || 10,
        description: description || 'Cupom gerado automaticamente',
        maxUses: maxUses || 100,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar cupom'
    });
  }
});

// Links de recarga por região
router.get('/recharge-links/:region', async (req: Request, res: Response) => {
  try {
    const { region } = req.params;
    
    if (region === 'brasil') {
      const links = [
        { amount: 'R$ 500', url: 'https://buy.stripe.com/test_9AQaEJ8QB0oA8Hm4gi' },
        { amount: 'R$ 1000', url: 'https://buy.stripe.com/test_dR68wB28leL66z6fZ1' },
        { amount: 'R$ 2000', url: 'https://buy.stripe.com/test_28o9B7dh12wI2je9AD' },
        { amount: 'R$ 3000', url: 'https://buy.stripe.com/test_5kA5kx0ol0oAczufZ3' },
        { amount: 'R$ 5000', url: 'https://buy.stripe.com/test_8wM9B728l0oA6z6fZ4' }
      ];
      
      res.json({
        success: true,
        region: 'Brasil',
        currency: 'BRL',
        links,
        redirect_url: 'https://marketbot.ngrok.app/dashboard/wallet'
      });
    } else if (region === 'global') {
      const links = [
        { amount: '$30', url: 'https://buy.stripe.com/test_9AQ8wB4wl2wI8Hm5ko' },
        { amount: '$50', url: 'https://buy.stripe.com/test_fZe3cpcclbEB5v2aEL' },
        { amount: '$100', url: 'https://buy.stripe.com/test_3cs14h7MD0oA4ra4gp' },
        { amount: '$200', url: 'https://buy.stripe.com/test_8wM6ox5At4EQ7Deaer' },
        { amount: '$500', url: 'https://buy.stripe.com/test_aEU7sx14daEp1jaeEP' },
        { amount: '$1000', url: 'https://buy.stripe.com/test_14k5kx8QBcIxbPu28j' }
      ];
      
      res.json({
        success: true,
        region: 'Global',
        currency: 'USD',
        links,
        redirect_url: 'https://marketbot.ngrok.app/dashboard/wallet'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Região inválida. Use: brasil ou global'
      });
    }
  } catch (error) {
    console.error('Erro ao obter links de recarga:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Produtos Stripe
router.get('/stripe-products', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      products: [
        {
          id: 'marketbot_flex',
          name: 'MarketBot FLEX',
          description: 'Plano flexível sem mensalidade',
          active: true,
          prices: [
            {
              id: 'price_flex_topup',
              amount: 50000, // R$ 500
              currency: 'brl',
              interval: null,
              interval_count: null
            }
          ]
        },
        {
          id: 'marketbot_pro_brasil',
          name: 'MarketBot PRO Brasil',
          description: 'Plano profissional para o Brasil',
          active: true,
          prices: [
            {
              id: 'price_pro_brasil_monthly',
              amount: 29700, // R$ 297
              currency: 'brl',
              interval: 'month',
              interval_count: 1
            }
          ]
        },
        {
          id: 'marketbot_pro_global',
          name: 'MarketBot PRO Global',
          description: 'Plano profissional global',
          active: true,
          prices: [
            {
              id: 'price_pro_global_monthly',
              amount: 5000, // $50
              currency: 'usd',
              interval: 'month',
              interval_count: 1
            }
          ]
        }
      ],
      total_products: 3,
      total_prices: 3
    });
  } catch (error) {
    console.error('Erro ao obter produtos Stripe:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar produtos'
    });
  }
});

export { router as testRoutes };
