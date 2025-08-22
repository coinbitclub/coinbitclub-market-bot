import { Request, Response } from 'express';
import { stripeService } from '../services/stripe.service';
import { couponService } from '../services/coupon.service';
import { affiliateService } from '../services/affiliate.service';
import { DatabaseService } from '../services/database.service';

export class PaymentController {
  private db = DatabaseService.getInstance();

  // ========================================
  // INICIALIZAÇÃO DO STRIPE (EXECUTAR UMA VEZ)
  // ========================================

  async initializeStripeProducts(req: Request, res: Response) {
    try {
      console.log('🚀 Inicializando produtos no Stripe...');
      
      // Criar produtos
      const products = await stripeService.createProducts();
      
      // Criar preços
      const prices = await stripeService.createPrices();
      
      // Gerar links de pagamento principais
      const monthlyLink = await stripeService.createPaymentLink('price_monthly_497');
      const prepaidLink = await stripeService.createPaymentLink('price_prepaid_1997');

      console.log('✅ Stripe configurado com sucesso!');

      res.json({
        success: true,
        message: 'Produtos e preços criados no Stripe',
        data: {
          products,
          prices,
          payment_links: {
            monthly: monthlyLink.url,
            prepaid: prepaidLink.url
          }
        }
      });
    } catch (error) {
      console.error('❌ Erro ao inicializar Stripe:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao configurar Stripe',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  // ========================================
  // LISTAR PLANOS DISPONÍVEIS
  // ========================================

  async getPlans(req: Request, res: Response) {
    try {
      const products = await stripeService.getAllProducts();
      const prices = await stripeService.getAllPrices();

      const plans = prices.map(price => ({
        id: price.id,
        product_id: price.product,
        name: (price.product as any).name,
        description: (price.product as any).description,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
        metadata: price.metadata,
        payment_link: `https://marketbot.ngrok.app/api/v1/payments/checkout/${price.id}`
      }));

      res.json({
        success: true,
        data: {
          plans,
          total: plans.length
        }
      });
    } catch (error) {
      console.error('❌ Erro ao listar planos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar planos'
      });
    }
  }

  // ========================================
  // CHECKOUT COM CUPOM E AFILIADO
  // ========================================

  async createCheckout(req: Request, res: Response) {
    try {
      const { priceId } = req.params;
      const { coupon_code, affiliate_code, user_id } = req.body;

      let discountAmount = 0;
      let couponData = null;

      // Validar cupom se fornecido
      if (coupon_code) {
        couponData = await couponService.validateCoupon(coupon_code, user_id);
        if (!couponData) {
          return res.status(400).json({
            success: false,
            message: 'Cupom inválido ou expirado'
          });
        }
        discountAmount = couponData.discount_value;
      }

      // Validar afiliado se fornecido
      let affiliateData = null;
      if (affiliate_code) {
        affiliateData = await affiliateService.getAffiliateByCode(affiliate_code);
        if (!affiliateData) {
          return res.status(400).json({
            success: false,
            message: 'Código de afiliado inválido'
          });
        }
      }

      // Criar checkout session
      const session = await stripeService.createCheckoutSession(
        priceId,
        user_id.toString(),
        affiliate_code
      );

      return res.json({
        success: true,
        data: {
          checkout_url: session.url,
          session_id: session.id,
          discount_applied: discountAmount,
          affiliate_commission: affiliateData?.commission_rate || 0
        }
      });
    } catch (error) {
      console.error('❌ Erro ao criar checkout:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar checkout'
      });
    }
  }

  // ========================================
  // LINKS DE PAGAMENTO DIRETOS
  // ========================================

  async getPaymentLinks(req: Request, res: Response) {
    try {
      const { affiliate_code } = req.query;

      // Link Plano Mensal
      const monthlyLink = await stripeService.createPaymentLink(
        'price_monthly_497',
        affiliate_code as string,
        { source: 'direct_link' }
      );

      // Link Plano Pré-pago
      const prepaidLink = await stripeService.createPaymentLink(
        'price_prepaid_1997',
        affiliate_code as string,
        { source: 'direct_link' }
      );

      res.json({
        success: true,
        data: {
          monthly_plan: {
            price: 'R$ 497,00',
            interval: 'mensal',
            link: monthlyLink.url,
            features: [
              'Trading automático 24/7',
              'Sinais ilimitados',
              'Suporte prioritário',
              'Dashboard avançado'
            ]
          },
          prepaid_plan: {
            price: 'R$ 1.997,00',
            interval: 'pré-pago (4 meses)',
            discount: '25% OFF',
            link: prepaidLink.url,
            features: [
              'Trading automático 24/7',
              'Sinais ilimitados',
              'Suporte VIP',
              'Dashboard avançado',
              'Sem renovação automática',
              'Desconto especial'
            ]
          }
        }
      });
    } catch (error) {
      console.error('❌ Erro ao gerar links:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar links de pagamento'
      });
    }
  }

  // ========================================
  // WEBHOOK DO STRIPE
  // ========================================

  async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = req.body;

      // Verificar webhook
      const event = stripeService.constructEvent(payload, signature);

      console.log(`📥 Webhook recebido: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as any);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as any);
          break;

        case 'invoice.payment_succeeded':
          await this.handleSubscriptionPayment(event.data.object as any);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(event.data.object as any);
          break;

        default:
          console.log(`⚠️ Evento não tratado: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('❌ Erro no webhook:', error);
      res.status(400).json({
        success: false,
        message: 'Webhook inválido'
      });
    }
  }

  // ========================================
  // HANDLERS DE EVENTOS DO STRIPE
  // ========================================

  private async handleCheckoutCompleted(session: any) {
    try {
      const userId = session.metadata.userId;
      const affiliateCode = session.metadata.affiliate_code;
      const planType = session.metadata.plan_type;

      // Ativar plano do usuário
      await this.activateUserPlan(userId, planType, session.id);

      // Processar afiliado se existir
      if (affiliateCode && affiliateCode !== 'direct') {
        await affiliateService.processReferral(
          affiliateCode,
          parseInt(userId),
          session.id,
          session.amount_total / 100 // Converter de centavos
        );
      }

      console.log(`✅ Checkout processado para usuário ${userId}`);
    } catch (error) {
      console.error('❌ Erro ao processar checkout:', error);
    }
  }

  private async handlePaymentSucceeded(paymentIntent: any) {
    try {
      console.log(`✅ Pagamento confirmado: ${paymentIntent.id}`);
      // Lógica adicional se necessário
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
    }
  }

  private async handleSubscriptionPayment(invoice: any) {
    try {
      console.log(`✅ Cobrança de assinatura: ${invoice.id}`);
      // Renovar plano do usuário
    } catch (error) {
      console.error('❌ Erro ao processar cobrança:', error);
    }
  }

  private async handleSubscriptionCancelled(subscription: any) {
    try {
      console.log(`❌ Assinatura cancelada: ${subscription.id}`);
      // Desativar plano do usuário
    } catch (error) {
      console.error('❌ Erro ao cancelar assinatura:', error);
    }
  }

  // ========================================
  // UTILITÁRIOS
  // ========================================

  private async activateUserPlan(userId: string, planType: string, orderId: string) {
    try {
      const expiresAt = new Date();
      
      if (planType === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 4); // Pré-pago = 4 meses
      }

      const query = `
        INSERT INTO user_subscriptions (
          user_id, plan_type, status, expires_at, stripe_order_id
        ) VALUES ($1, $2, 'active', $3, $4)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          plan_type = $2,
          status = 'active',
          expires_at = $3,
          stripe_order_id = $4,
          updated_at = NOW()
      `;

      await this.db.query(query, [userId, planType, expiresAt, orderId]);
      
      console.log(`✅ Plano ativado para usuário ${userId}: ${planType}`);
    } catch (error) {
      console.error('❌ Erro ao ativar plano:', error);
      throw error;
    }
  }

  // ========================================
  // MÉTODOS AUXILIARES PARA TESTES
  // ========================================

  async getRechargeLinks(req: Request, res: Response) {
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
  }

  async getStripeProducts(req: Request, res: Response) {
    try {
      const stripe = stripeService.stripeInstance;
      
      const products = await stripe.products.list({
        expand: ['data.default_price']
      });
      
      const prices = await stripe.prices.list({
        expand: ['data.product']
      });
      
      res.json({
        success: true,
        products: products.data.map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          active: product.active,
          prices: prices.data
            .filter((price: any) => price.product === product.id)
            .map((price: any) => ({
              id: price.id,
              amount: price.unit_amount,
              currency: price.currency,
              interval: price.recurring?.interval,
              interval_count: price.recurring?.interval_count
            }))
        })),
        total_products: products.data.length,
        total_prices: prices.data.length
      });
    } catch (error) {
      console.error('Erro ao obter produtos Stripe:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar produtos'
      });
    }
  }
}

export const paymentController = new PaymentController();
