// ========================================
// MARKETBOT - FINANCIAL CONTROLLER
// Sistema financeiro completo para pagamentos
// FASE 3 - Sistema de pagamentos e planos
// ========================================

import { Request, Response } from 'express';
import { stripeService } from '../services/stripe.service.js';
import { DatabaseService } from '../services/database.service.js';
import { logger } from '../utils/logger.js';
import Stripe from 'stripe';

export interface PaymentPlan {
  id: string;
  name: string;
  type: 'MONTHLY' | 'PREPAID';
  priceUsd: number;
  priceBrl: number;
  stripePriceId: string;
  features: string[];
  commissionRate: number;
  isActive: boolean;
}

export class FinancialController {
  // ========================================
  // LISTAR PLANOS DISPONÍVEIS
  // ========================================
  async getPlans(req: Request, res: Response): Promise<Response | void> {
    try {
      logger.info('📋 Buscando planos disponíveis');

      // Buscar produtos e preços do Stripe
      const products = await stripeService.getAllProducts();
      const prices = await stripeService.getAllPrices();

      const plans: PaymentPlan[] = products.map(product => {
        const price = prices.find(p => p.product === product.id);
        const isMonthly = product.metadata?.type === 'monthly';
        
        return {
          id: product.id,
          name: product.name,
          type: isMonthly ? 'MONTHLY' : 'PREPAID',
          priceUsd: price ? (price.unit_amount || 0) / 100 : 0,
          priceBrl: price ? (price.unit_amount || 0) / 100 : 0,
          stripePriceId: price?.id || '',
          features: product.metadata?.features?.split(',') || [],
          commissionRate: parseFloat(product.metadata?.commission_rate || '0'),
          isActive: product.active
        };
      });

      res.json({
        success: true,
        data: {
          plans: plans.filter(p => p.isActive),
          totalPlans: plans.length
        }
      });

    } catch (error) {
      logger.error('❌ Erro ao buscar planos:', error);
      res.status(500).json({
        success: false,
        error: 'Falha ao buscar planos disponíveis'
      });
    }
  }

  // ========================================
  // CRIAR SESSÃO DE PAGAMENTO
  // ========================================
  async createPaymentSession(req: Request, res: Response): Promise<Response | void> {
    try {
      const { planId, userId, affiliateCode, couponCode } = req.body;

      if (!planId || !userId) {
        return res.status(400).json({
          success: false,
          error: 'planId e userId são obrigatórios'
        });
      }

      logger.info(`💳 Criando sessão de pagamento - Plano: ${planId}, Usuário: ${userId}`);

      // Buscar detalhes do plano
      const products = await stripeService.getAllProducts();
      const prices = await stripeService.getAllPrices();
      
      const product = products.find(p => p.id === planId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Plano não encontrado'
        });
      }

      const price = prices.find(p => p.product === planId);
      if (!price) {
        return res.status(404).json({
          success: false,
          error: 'Preço do plano não encontrado'
        });
      }

      // Criar sessão de checkout
      const session = await stripeService.createCheckoutSession(
        price.id,
        userId,
        affiliateCode
      );

      // Registrar tentativa de pagamento no banco
      await this.recordPaymentAttempt({
        sessionId: session.id,
        userId,
        planId,
        priceId: price.id,
        amount: (price.unit_amount || 0) / 100,
        currency: price.currency.toUpperCase(),
        affiliateCode,
        couponCode,
        status: 'PENDING'
      });

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          checkoutUrl: session.url,
          planName: product.name,
          amount: (price.unit_amount || 0) / 100,
          currency: price.currency.toUpperCase()
        }
      });

    } catch (error) {
      logger.error('❌ Erro ao criar sessão de pagamento:', error);
      res.status(500).json({
        success: false,
        error: 'Falha ao criar sessão de pagamento'
      });
    }
  }

  // ========================================
  // VERIFICAR STATUS DO PAGAMENTO
  // ========================================
  async checkPaymentStatus(req: Request, res: Response): Promise<Response | void> {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'sessionId é obrigatório'
        });
      }

      logger.info(`🔍 Verificando status do pagamento: ${sessionId}`);

      // Buscar no banco de dados
      const paymentQuery = `
        SELECT * FROM payment_sessions 
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const paymentResult = await DatabaseService.getInstance().query(paymentQuery, [sessionId]);
      
      if (paymentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Sessão de pagamento não encontrada'
        });
      }

      const payment = paymentResult.rows[0];

      // Verificar também no Stripe para ter certeza
      try {
        const stripeSession = await stripeService.stripeInstance.checkout.sessions.retrieve(sessionId);
        
        // Atualizar status se necessário
        if (stripeSession.payment_status === 'paid' && payment.status !== 'COMPLETED') {
          await this.updatePaymentStatus(sessionId, 'COMPLETED');
          payment.status = 'COMPLETED';
        }
      } catch (stripeError) {
        logger.warn('⚠️ Erro ao verificar sessão no Stripe:', stripeError);
      }

      res.json({
        success: true,
        data: {
          sessionId: payment.session_id,
          status: payment.status,
          planId: payment.plan_id,
          amount: parseFloat(payment.amount),
          currency: payment.currency,
          createdAt: payment.created_at,
          completedAt: payment.completed_at
        }
      });

    } catch (error) {
      logger.error('❌ Erro ao verificar status do pagamento:', error);
      res.status(500).json({
        success: false,
        error: 'Falha ao verificar status do pagamento'
      });
    }
  }

  // ========================================
  // WEBHOOK DO STRIPE
  // ========================================
  async handleStripeWebhook(req: Request, res: Response): Promise<Response | void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const body = req.body;

      if (!signature) {
        return res.status(400).json({
          success: false,
          error: 'Assinatura do webhook ausente'
        });
      }

      logger.info('📨 Processando webhook do Stripe');

      // Validar e processar evento
      const event = stripeService.constructEvent(body, signature);

      await this.processStripeEvent(event);

      res.json({ received: true });

    } catch (error) {
      logger.error('❌ Erro ao processar webhook do Stripe:', error);
      res.status(400).json({
        success: false,
        error: 'Falha ao processar webhook'
      });
    }
  }

  // ========================================
  // HISTÓRICO DE PAGAMENTOS DO USUÁRIO
  // ========================================
  async getUserPaymentHistory(req: Request, res: Response): Promise<Response | void> {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId é obrigatório'
        });
      }

      const offset = (Number(page) - 1) * Number(limit);

      const query = `
        SELECT 
          ps.*,
          sp.name as plan_name,
          sp.type as plan_type
        FROM payment_sessions ps
        LEFT JOIN stripe_products sp ON ps.plan_id = sp.stripe_id
        WHERE ps.user_id = $1
        ORDER BY ps.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM payment_sessions 
        WHERE user_id = $1
      `;

      const [payments, countResult] = await Promise.all([
        DatabaseService.getInstance().query(query, [userId, limit, offset]),
        DatabaseService.getInstance().query(countQuery, [userId])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / Number(limit));

      res.json({
        success: true,
        data: {
          payments: payments.rows.map(payment => ({
            sessionId: payment.session_id,
            planName: payment.plan_name,
            planType: payment.plan_type,
            amount: parseFloat(payment.amount),
            currency: payment.currency,
            status: payment.status,
            createdAt: payment.created_at,
            completedAt: payment.completed_at,
            affiliateCode: payment.affiliate_code,
            couponCode: payment.coupon_code
          })),
          pagination: {
            currentPage: Number(page),
            totalPages,
            totalItems: total,
            itemsPerPage: Number(limit)
          }
        }
      });

    } catch (error) {
      logger.error('❌ Erro ao buscar histórico de pagamentos:', error);
      res.status(500).json({
        success: false,
        error: 'Falha ao buscar histórico de pagamentos'
      });
    }
  }

  // ========================================
  // MÉTODOS PRIVADOS
  // ========================================

  private async recordPaymentAttempt(data: {
    sessionId: string;
    userId: string;
    planId: string;
    priceId: string;
    amount: number;
    currency: string;
    affiliateCode?: string;
    couponCode?: string;
    status: string;
  }): Promise<void> {
    try {
      const query = `
        INSERT INTO payment_sessions (
          session_id, user_id, plan_id, price_id, amount, currency,
          affiliate_code, coupon_code, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      `;

      await DatabaseService.getInstance().query(query, [
        data.sessionId,
        data.userId,
        data.planId,
        data.priceId,
        data.amount,
        data.currency,
        data.affiliateCode,
        data.couponCode,
        data.status
      ]);

      logger.info(`✅ Tentativa de pagamento registrada: ${data.sessionId}`);
    } catch (error) {
      logger.error('❌ Erro ao registrar tentativa de pagamento:', error);
      throw error;
    }
  }

  private async updatePaymentStatus(sessionId: string, status: string): Promise<void> {
    try {
      const query = `
        UPDATE payment_sessions 
        SET status = $2, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE session_id = $1
      `;

      await DatabaseService.getInstance().query(query, [sessionId, status]);
      logger.info(`✅ Status do pagamento atualizado: ${sessionId} -> ${status}`);
    } catch (error) {
      logger.error('❌ Erro ao atualizar status do pagamento:', error);
      throw error;
    }
  }

  private async processStripeEvent(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'invoice.payment_succeeded':
          await this.handleSubscriptionPayment(event.data.object as Stripe.Invoice);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
          break;

        default:
          logger.info(`⚠️ Evento Stripe não tratado: ${event.type}`);
      }
    } catch (error) {
      logger.error('❌ Erro ao processar evento do Stripe:', error);
      throw error;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    try {
      logger.info(`✅ Checkout concluído: ${session.id}`);

      // Atualizar status do pagamento
      await this.updatePaymentStatus(session.id, 'COMPLETED');

      // Ativar plano do usuário
      const userId = session.metadata?.userId;
      const planType = session.metadata?.plan_type;
      
      if (userId && planType) {
        await this.activateUserPlan(userId, planType);
      }

      // Processar afiliado se houver
      const affiliateCode = session.metadata?.affiliate_code;
      if (affiliateCode && affiliateCode !== 'direct') {
        await this.processAffiliateCommission(session);
      }

    } catch (error) {
      logger.error('❌ Erro ao processar checkout concluído:', error);
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    logger.info(`✅ Pagamento bem-sucedido: ${paymentIntent.id}`);
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    logger.warn(`❌ Pagamento falhou: ${paymentIntent.id}`);
  }

  private async handleSubscriptionPayment(invoice: Stripe.Invoice): Promise<void> {
    logger.info(`✅ Pagamento de assinatura: ${invoice.id}`);
  }

  private async handleSubscriptionCancelled(subscription: Stripe.Subscription): Promise<void> {
    logger.info(`❌ Assinatura cancelada: ${subscription.id}`);
  }

  private async activateUserPlan(userId: string, planType: string): Promise<void> {
    try {
      const expiresAt = planType === 'monthly' 
        ? "CURRENT_TIMESTAMP + INTERVAL '30 days'"
        : null; // Prepaid não expira

      const query = `
        UPDATE users 
        SET 
          plan_type = $2,
          plan_status = 'ACTIVE',
          plan_activated_at = CURRENT_TIMESTAMP,
          plan_expires_at = ${expiresAt || 'NULL'},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await DatabaseService.getInstance().query(query, [userId, planType.toUpperCase()]);
      
      logger.info(`📋 Plano ${planType} ativado para usuário ${userId}`);
    } catch (error) {
      logger.error('❌ Erro ao ativar plano do usuário:', error);
      throw error;
    }
  }

  private async processAffiliateCommission(session: Stripe.Checkout.Session): Promise<void> {
    logger.info(`💰 Processando comissão de afiliado para sessão ${session.id}`);
    // Implementar sistema de afiliados
  }
}

export const financialController = new FinancialController();
