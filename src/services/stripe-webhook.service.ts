// ========================================
// MARKETBOT - STRIPE WEBHOOKS SERVICE
// Sistema completo de webhooks para pagamentos Stripe
// ========================================

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { DatabaseService } from './database.service';

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  created: number;
  processed: boolean;
  error_message?: string;
}

export interface SubscriptionUpdate {
  user_id: number;
  stripe_subscription_id: string;
  status: string;
  current_period_start: Date;
  current_period_end: Date;
  plan_type: string;
  amount: number;
  currency: string;
}

export interface PaymentProcessed {
  user_id: number;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: string;
  type: 'subscription' | 'credit_purchase' | 'withdrawal_fee';
  description: string;
}

export class StripeWebhookService {
  private static instance: StripeWebhookService;
  private stripe: Stripe;
  private db: any;
  private webhookSecret: string;

  // Eventos importantes do Stripe que devemos processar
  private readonly SUPPORTED_EVENTS = [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'checkout.session.completed',
    'checkout.session.expired'
  ];

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'STRIPE_KEY_NOT_SET', {
      apiVersion: '2023-08-16'
    });
    
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'WEBHOOK_SECRET_NOT_SET';
    
    const dbService = DatabaseService.getInstance();
    this.db = dbService.getPool();
  }

  static getInstance(): StripeWebhookService {
    if (!StripeWebhookService.instance) {
      StripeWebhookService.instance = new StripeWebhookService();
    }
    return StripeWebhookService.instance;
  }

  // ========================================
  // PROCESSAMENTO PRINCIPAL DE WEBHOOKS
  // ========================================

  async handleWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      // Verificar assinatura do webhook
      event = this.stripe.webhooks.constructEvent(
        req.body,
        signature,
        this.webhookSecret
      );
    } catch (error) {
      console.error('❌ Erro na verificação do webhook:', error);
      res.status(400).send(`Webhook signature verification failed`);
      return;
    }

    // Verificar se é um evento suportado
    if (!this.SUPPORTED_EVENTS.includes(event.type)) {
      console.log(`⚠️ Evento não suportado: ${event.type}`);
      res.status(200).send('OK - Event not processed');
      return;
    }

    // Verificar duplicação
    const isDuplicate = await this.checkDuplicateEvent(event.id);
    if (isDuplicate) {
      console.log(`⚠️ Evento duplicado ignorado: ${event.id}`);
      res.status(200).send('OK - Duplicate event');
      return;
    }

    try {
      // Registrar evento
      await this.logWebhookEvent(event);

      // Processar evento baseado no tipo
      await this.processEvent(event);

      // Marcar como processado
      await this.markEventAsProcessed(event.id);

      console.log(`✅ Webhook processado com sucesso: ${event.type} - ${event.id}`);
      res.status(200).send('OK');

    } catch (error) {
      console.error(`❌ Erro ao processar webhook ${event.type}:`, error);
      
      // Registrar erro
      await this.logWebhookError(event.id, (error as Error).message);
      
      res.status(500).send('Webhook processing failed');
    }
  }

  // ========================================
  // PROCESSAMENTO POR TIPO DE EVENTO
  // ========================================

  private async processEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event);
        break;
      
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event);
        break;
      
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event);
        break;
      
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event);
        break;
      
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event);
        break;
      
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event);
        break;
      
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event);
        break;
      
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event);
        break;
      
      case 'checkout.session.expired':
        await this.handleCheckoutSessionExpired(event);
        break;
      
      default:
        console.log(`⚠️ Evento não implementado: ${event.type}`);
    }
  }

  // ========================================
  // HANDLERS ESPECÍFICOS POR EVENTO
  // ========================================

  private async handlePaymentIntentSucceeded(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    console.log(`💳 Pagamento bem-sucedido: ${paymentIntent.id} - $${(paymentIntent.amount / 100).toFixed(2)}`);

    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Buscar usuário pelo customer_id do Stripe
      const userResult = await client.query(
        'SELECT id, email, full_name FROM users WHERE stripe_customer_id = $1',
        [paymentIntent.customer]
      );

      if (userResult.rows.length === 0) {
        console.log('⚠️ Usuário não encontrado para customer:', paymentIntent.customer);
        return;
      }

      const user = userResult.rows[0];
      const amount = paymentIntent.amount / 100; // Converter de centavos

      // Determinar tipo de pagamento baseado nos metadados
      const paymentType = paymentIntent.metadata?.type || 'credit_purchase';
      
      // Processar baseado no tipo
      switch (paymentType) {
        case 'subscription':
          await this.processSubscriptionPayment(client, user.id, paymentIntent, amount);
          break;
        
        case 'credit_purchase':
          await this.processCreditPurchase(client, user.id, paymentIntent, amount);
          break;
        
        case 'withdrawal_fee':
          await this.processWithdrawalFee(client, user.id, paymentIntent, amount);
          break;
        
        default:
          console.log('⚠️ Tipo de pagamento não reconhecido:', paymentType);
      }

      // Registrar no histórico de pagamentos
      await client.query(`
        INSERT INTO payment_history (
          user_id, type, amount, currency, status, description, 
          stripe_payment_intent_id, reference_id
        ) VALUES ($1, $2, $3, $4, 'COMPLETED', $5, $6, $7)
      `, [
        user.id, 
        paymentType.toUpperCase(), 
        amount, 
        paymentIntent.currency.toUpperCase(),
        `Pagamento Stripe - ${paymentIntent.description || paymentType}`,
        paymentIntent.id,
        paymentIntent.metadata?.reference_id
      ]);

      await client.query('COMMIT');

      console.log(`✅ Pagamento processado para usuário ${user.email}: $${amount} ${paymentIntent.currency.toUpperCase()}`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async handleSubscriptionCreated(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    
    console.log(`📅 Nova assinatura criada: ${subscription.id}`);

    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Buscar usuário
      const userResult = await client.query(
        'SELECT id, email FROM users WHERE stripe_customer_id = $1',
        [subscription.customer]
      );

      if (userResult.rows.length === 0) {
        console.log('⚠️ Usuário não encontrado para assinatura');
        return;
      }

      const user = userResult.rows[0];
      const priceId = subscription.items.data[0]?.price.id;
      
      // Determinar tipo de plano baseado no price_id
      const planType = await this.determinePlanType(priceId);
      
      // Atualizar usuário com nova assinatura
      await client.query(`
        UPDATE users SET 
          stripe_subscription_id = $1,
          subscription_plan = $2,
          subscription_status = $3,
          subscription_current_period_start = $4,
          subscription_current_period_end = $5,
          updated_at = NOW()
        WHERE id = $6
      `, [
        subscription.id,
        planType,
        subscription.status,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        user.id
      ]);

      await client.query('COMMIT');

      console.log(`✅ Assinatura ativada para ${user.email}: ${planType} - ${subscription.status}`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    
    console.log(`📅 Assinatura atualizada: ${subscription.id} - Status: ${subscription.status}`);

    const client = await this.db.connect();
    
    try {
      // Atualizar status da assinatura
      await client.query(`
        UPDATE users SET 
          subscription_status = $1,
          subscription_current_period_start = $2,
          subscription_current_period_end = $3,
          updated_at = NOW()
        WHERE stripe_subscription_id = $4
      `, [
        subscription.status,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        subscription.id
      ]);

      // Se assinatura foi cancelada, atualizar permissões
      if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
        await client.query(`
          UPDATE users SET 
            subscription_plan = 'FREE',
            is_active = CASE WHEN subscription_status = 'canceled' THEN false ELSE is_active END
          WHERE stripe_subscription_id = $1
        `, [subscription.id]);
      }

      console.log(`✅ Assinatura ${subscription.id} atualizada para status: ${subscription.status}`);

    } catch (error) {
      console.error('❌ Erro ao atualizar assinatura:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    
    console.log(`🛒 Checkout concluído: ${session.id}`);

    // Se for uma assinatura, ela será processada pelo evento subscription.created
    if (session.mode === 'subscription') {
      console.log('📅 Checkout de assinatura - será processado pelo evento subscription.created');
      return;
    }

    // Processar compras one-time (créditos, taxas, etc.)
    if (session.mode === 'payment') {
      const client = await this.db.connect();
      
      try {
        // Buscar usuário
        const userResult = await client.query(
          'SELECT id, email FROM users WHERE stripe_customer_id = $1',
          [session.customer]
        );

        if (userResult.rows.length === 0) {
          console.log('⚠️ Usuário não encontrado para checkout');
          return;
        }

        const user = userResult.rows[0];
        const amount = (session.amount_total || 0) / 100;

        // Processar baseado nos metadados
        const purchaseType = session.metadata?.type || 'credit_purchase';
        const credits = parseFloat(session.metadata?.credits || '0');

        if (purchaseType === 'credit_purchase' && credits > 0) {
          // Adicionar créditos ao usuário
          await client.query(`
            UPDATE users SET 
              balance_usd = COALESCE(balance_usd, 0) + $1,
              updated_at = NOW()
            WHERE id = $2
          `, [credits, user.id]);

          console.log(`✅ Créditos adicionados para ${user.email}: $${credits}`);
        }

      } catch (error) {
        console.error('❌ Erro ao processar checkout:', error);
        throw error;
      } finally {
        client.release();
      }
    }
  }

  // ========================================
  // MÉTODOS DE SUPORTE
  // ========================================

  private async processCreditPurchase(client: any, userId: number, paymentIntent: Stripe.PaymentIntent, amount: number): Promise<void> {
    const credits = parseFloat(paymentIntent.metadata?.credits || amount.toString());
    
    await client.query(`
      UPDATE users SET 
        balance_usd = COALESCE(balance_usd, 0) + $1,
        updated_at = NOW()
      WHERE id = $2
    `, [credits, userId]);

    console.log(`💰 Créditos adicionados: $${credits} para usuário ${userId}`);
  }

  private async processSubscriptionPayment(client: any, userId: number, paymentIntent: Stripe.PaymentIntent, amount: number): Promise<void> {
    // Pagamento de assinatura - apenas registrar
    console.log(`📅 Pagamento de assinatura processado: $${amount} para usuário ${userId}`);
  }

  private async processWithdrawalFee(client: any, userId: number, paymentIntent: Stripe.PaymentIntent, amount: number): Promise<void> {
    // Taxa de saque paga - liberar saque pendente se houver
    const withdrawalId = paymentIntent.metadata?.withdrawal_id;
    
    if (withdrawalId) {
      await client.query(`
        UPDATE withdrawal_requests SET 
          status = 'APPROVED',
          approved_at = NOW()
        WHERE id = $1 AND user_id = $2 AND status = 'PENDING_FEE_PAYMENT'
      `, [withdrawalId, userId]);

      console.log(`💸 Taxa de saque paga, liberando saque ${withdrawalId}`);
    }
  }

  private async determinePlanType(priceId: string): Promise<string> {
    // Mapear price_id para tipo de plano
    const planMapping: Record<string, string> = {
      'price_monthly_basic': 'MONTHLY',
      'price_monthly_premium': 'MONTHLY_PREMIUM',
      'price_annual_basic': 'ANNUAL',
      'price_annual_premium': 'ANNUAL_PREMIUM'
    };

    return planMapping[priceId] || 'MONTHLY';
  }

  private async checkDuplicateEvent(eventId: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        'SELECT id FROM stripe_webhook_events WHERE stripe_event_id = $1',
        [eventId]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Erro ao verificar evento duplicado:', error);
      return false;
    }
  }

  private async logWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      await this.db.query(`
        INSERT INTO stripe_webhook_events (
          stripe_event_id, event_type, event_data, processed, created_at
        ) VALUES ($1, $2, $3, false, NOW())
      `, [event.id, event.type, JSON.stringify(event.data)]);
    } catch (error) {
      console.error('❌ Erro ao registrar webhook event:', error);
    }
  }

  private async markEventAsProcessed(eventId: string): Promise<void> {
    try {
      await this.db.query(`
        UPDATE stripe_webhook_events 
        SET processed = true, processed_at = NOW()
        WHERE stripe_event_id = $1
      `, [eventId]);
    } catch (error) {
      console.error('❌ Erro ao marcar evento como processado:', error);
    }
  }

  private async logWebhookError(eventId: string, errorMessage: string): Promise<void> {
    try {
      await this.db.query(`
        UPDATE stripe_webhook_events 
        SET error_message = $1, processed_at = NOW()
        WHERE stripe_event_id = $2
      `, [errorMessage, eventId]);
    } catch (error) {
      console.error('❌ Erro ao registrar erro do webhook:', error);
    }
  }

  // ========================================
  // HANDLERS PARA EVENTOS DE FALHA
  // ========================================

  private async handlePaymentIntentFailed(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    console.log(`❌ Pagamento falhou: ${paymentIntent.id}`);

    const client = await this.db.connect();
    
    try {
      const userResult = await client.query(
        'SELECT id, email FROM users WHERE stripe_customer_id = $1',
        [paymentIntent.customer]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        
        // Registrar falha no histórico
        await client.query(`
          INSERT INTO payment_history (
            user_id, type, amount, currency, status, description, 
            stripe_payment_intent_id, error_message
          ) VALUES ($1, 'PAYMENT_FAILED', $2, $3, 'FAILED', $4, $5, $6)
        `, [
          user.id,
          paymentIntent.amount / 100,
          paymentIntent.currency.toUpperCase(),
          `Falha no pagamento - ${paymentIntent.last_payment_error?.message || 'Erro desconhecido'}`,
          paymentIntent.id,
          paymentIntent.last_payment_error?.message
        ]);

        console.log(`❌ Falha de pagamento registrada para ${user.email}`);
      }
    } catch (error) {
      console.error('❌ Erro ao processar falha de pagamento:', error);
    } finally {
      client.release();
    }
  }

  private async handleInvoicePaymentSucceeded(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    
    console.log(`💳 Pagamento de fatura bem-sucedido: ${invoice.id}`);

    const client = await this.db.connect();
    
    try {
      // Buscar usuário
      const userResult = await client.query(
        'SELECT id, email FROM users WHERE stripe_customer_id = $1',
        [invoice.customer]
      );

      if (userResult.rows.length === 0) {
        console.log('⚠️ Usuário não encontrado para fatura');
        return;
      }

      const user = userResult.rows[0];
      const amount = (invoice.amount_paid || 0) / 100;

      // Se for pagamento de assinatura, atualizar status
      if (invoice.subscription) {
        await client.query(`
          UPDATE users SET 
            subscription_status = 'active',
            updated_at = NOW()
          WHERE stripe_subscription_id = $1
        `, [invoice.subscription]);
      }

      // Registrar pagamento no histórico
      await client.query(`
        INSERT INTO payment_history (
          user_id, type, amount, currency, status, description, 
          stripe_invoice_id, reference_id
        ) VALUES ($1, 'SUBSCRIPTION_PAYMENT', $2, $3, 'COMPLETED', $4, $5, $6)
      `, [
        user.id,
        amount,
        (invoice.currency || 'usd').toUpperCase(),
        `Pagamento de assinatura - Fatura ${invoice.number}`,
        invoice.id,
        invoice.subscription
      ]);

      console.log(`✅ Pagamento de fatura processado para ${user.email}: $${amount}`);

    } catch (error) {
      console.error('❌ Erro ao processar pagamento de fatura:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async handleInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    
    console.log(`❌ Pagamento de fatura falhou: ${invoice.id}`);

    // Marcar assinatura como em atraso se necessário
    if (invoice.subscription) {
      const client = await this.db.connect();
      
      try {
        await client.query(`
          UPDATE users SET 
            subscription_status = 'past_due',
            updated_at = NOW()
          WHERE stripe_subscription_id = $1
        `, [invoice.subscription]);

        console.log(`⚠️ Assinatura marcada como em atraso: ${invoice.subscription}`);
      } catch (error) {
        console.error('❌ Erro ao atualizar status da assinatura:', error);
      } finally {
        client.release();
      }
    }
  }

  private async handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    
    console.log(`❌ Assinatura cancelada: ${subscription.id}`);

    const client = await this.db.connect();
    
    try {
      await client.query(`
        UPDATE users SET 
          subscription_plan = 'FREE',
          subscription_status = 'canceled',
          stripe_subscription_id = NULL,
          updated_at = NOW()
        WHERE stripe_subscription_id = $1
      `, [subscription.id]);

      console.log(`✅ Usuário revertido para plano gratuito: ${subscription.id}`);
    } catch (error) {
      console.error('❌ Erro ao cancelar assinatura:', error);
    } finally {
      client.release();
    }
  }

  private async handleCheckoutSessionExpired(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    
    console.log(`⏰ Checkout expirado: ${session.id}`);
    
    // Apenas log - não precisa de ação específica
  }

  // ========================================
  // MÉTODOS UTILITÁRIOS
  // ========================================

  async getWebhookStats(startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const whereClause = startDate && endDate ? 
        'WHERE created_at BETWEEN $1 AND $2' : '';
      const params = startDate && endDate ? [startDate, endDate] : [];

      const result = await this.db.query(`
        SELECT 
          event_type,
          COUNT(*) as total_events,
          COUNT(CASE WHEN processed = true THEN 1 END) as processed_events,
          COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as failed_events
        FROM stripe_webhook_events 
        ${whereClause}
        GROUP BY event_type
        ORDER BY total_events DESC
      `, params);

      return result.rows;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas de webhooks:', error);
      return [];
    }
  }

  async retryFailedWebhooks(limit = 10): Promise<number> {
    try {
      const failedEvents = await this.db.query(`
        SELECT stripe_event_id, event_type, event_data 
        FROM stripe_webhook_events 
        WHERE processed = false AND error_message IS NOT NULL
        ORDER BY created_at ASC
        LIMIT $1
      `, [limit]);

      let retriedCount = 0;

      for (const eventRow of failedEvents.rows) {
        try {
          const eventData = JSON.parse(eventRow.event_data);
          const mockEvent = {
            id: eventRow.stripe_event_id,
            type: eventRow.event_type,
            data: eventData
          } as Stripe.Event;

          await this.processEvent(mockEvent);
          await this.markEventAsProcessed(eventRow.stripe_event_id);
          
          retriedCount++;
          console.log(`✅ Webhook retry successful: ${eventRow.stripe_event_id}`);
        } catch (error) {
          console.error(`❌ Webhook retry failed: ${eventRow.stripe_event_id}`, error);
        }
      }

      return retriedCount;
    } catch (error) {
      console.error('❌ Erro ao reprocessar webhooks:', error);
      return 0;
    }
  }
}

export default StripeWebhookService;
