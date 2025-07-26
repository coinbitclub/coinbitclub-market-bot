import express from 'express';
import Stripe from 'stripe';
import { db } from '../../../common/db.js';
import { env } from '../../../common/env.js';
import { handleAsyncError } from '../../../common/utils.js';
import { ReconciliationService } from '../services/reconciliationService.js';
import { PaymentService } from '../services/paymentService.js';
import logger from '../../../common/logger.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const router = express.Router();

/**
 * Webhook principal do Stripe - versão melhorada
 */
export const stripeWebhookEnhanced = handleAsyncError(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    logger.error({ error: error.message }, 'Falha na verificação de assinatura do webhook');
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Log do webhook recebido
  await db('webhook_logs').insert({
    provider: 'stripe',
    event_type: event.type,
    event_id: event.id,
    payload: event,
    status: 'received'
  });

  logger.info({ 
    eventType: event.type, 
    eventId: event.id 
  }, 'Webhook Stripe recebido');

  try {
    // Marcar como processando
    await db('webhook_logs')
      .where({ event_id: event.id, provider: 'stripe' })
      .update({ status: 'processing' });

    let processResult = { processed: false, notes: '' };

    switch (event.type) {
      // Eventos de Payment Intent
      case 'payment_intent.succeeded':
        processResult = await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        processResult = await handlePaymentIntentFailed(event.data.object);
        break;

      case 'payment_intent.requires_action':
        processResult = await handlePaymentIntentRequiresAction(event.data.object);
        break;

      // Eventos de Invoice (assinaturas)
      case 'invoice.payment_succeeded':
        processResult = await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        processResult = await handleInvoicePaymentFailed(event.data.object);
        break;

      // Eventos de Subscription
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        processResult = await handleSubscriptionEvent(event.data.object);
        break;

      // Eventos de Charge
      case 'charge.succeeded':
        processResult = await handleChargeSucceeded(event.data.object);
        break;

      case 'charge.failed':
        processResult = await handleChargeFailed(event.data.object);
        break;

      // Eventos de Dispute
      case 'charge.dispute.created':
        processResult = await handleDisputeCreated(event.data.object);
        break;

      // Eventos de Refund
      case 'charge.refunded':
        processResult = await handleChargeRefunded(event.data.object);
        break;

      default:
        processResult = { processed: false, notes: `Evento não tratado: ${event.type}` };
        logger.info({ eventType: event.type }, 'Tipo de evento não tratado');
    }

    // Atualizar status do webhook
    await db('webhook_logs')
      .where({ event_id: event.id, provider: 'stripe' })
      .update({
        status: processResult.processed ? 'processed' : 'ignored',
        processing_notes: processResult.notes,
        processed_at: new Date()
      });

    res.json({ received: true, processed: processResult.processed });

  } catch (error) {
    logger.error({ error, event }, 'Erro ao processar webhook');
    
    // Atualizar status para falha
    await db('webhook_logs')
      .where({ event_id: event.id, provider: 'stripe' })
      .update({
        status: 'failed',
        processing_notes: error.message,
        processed_at: new Date()
      });

    res.status(500).json({ error: 'Falha no processamento do webhook' });
  }
});

/**
 * Payment Intent bem sucedido
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const payment = await db('payments')
      .where({ stripe_payment_intent_id: paymentIntent.id })
      .first();

    if (!payment) {
      return { processed: false, notes: 'Pagamento não encontrado no sistema' };
    }

    // Atualizar status do pagamento
    await db('payments')
      .where({ id: payment.id })
      .update({
        status: 'succeeded',
        paid_at: new Date(paymentIntent.created * 1000),
        fee_amount: paymentIntent.charges?.data[0]?.application_fee_amount ? 
          paymentIntent.charges.data[0].application_fee_amount / 100 : 0
      });

    // Se for pagamento pré-pago, creditar saldo
    if (payment.type === 'prepaid' && payment.status !== 'succeeded') {
      const metadata = payment.metadata || {};
      const totalCredit = metadata.total_credit || payment.amount;
      
      await PaymentService.creditPrepaidBalance(
        payment.user_id,
        parseFloat(totalCredit),
        payment.currency,
        payment.id,
        'Recarga confirmada via webhook'
      );
    }

    // Executar reconciliação automática
    await ReconciliationService.reconcilePayment(payment);

    // Log de auditoria
    await db('audit_logs').insert({
      user_id: payment.user_id,
      action: 'payment_succeeded',
      resource_type: 'payment',
      resource_id: payment.id,
      details: {
        payment_intent_id: paymentIntent.id,
        amount: payment.amount,
        type: payment.type
      }
    });

    logger.info({ 
      paymentId: payment.id, 
      userId: payment.user_id,
      amount: payment.amount 
    }, 'Payment Intent processado com sucesso');

    return { processed: true, notes: 'Payment Intent processado com sucesso' };

  } catch (error) {
    logger.error({ error, paymentIntentId: paymentIntent.id }, 'Erro ao processar Payment Intent succeeded');
    throw error;
  }
}

/**
 * Payment Intent falhou
 */
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    const payment = await db('payments')
      .where({ stripe_payment_intent_id: paymentIntent.id })
      .first();

    if (!payment) {
      return { processed: false, notes: 'Pagamento não encontrado no sistema' };
    }

    await db('payments')
      .where({ id: payment.id })
      .update({
        status: 'failed',
        failed_at: new Date(),
        failure_reason: paymentIntent.last_payment_error?.message || 'Falha no pagamento'
      });

    // Log de auditoria
    await db('audit_logs').insert({
      user_id: payment.user_id,
      action: 'payment_failed',
      resource_type: 'payment',
      resource_id: payment.id,
      details: {
        payment_intent_id: paymentIntent.id,
        failure_reason: paymentIntent.last_payment_error?.message
      }
    });

    logger.warn({ 
      paymentId: payment.id, 
      userId: payment.user_id,
      reason: paymentIntent.last_payment_error?.message 
    }, 'Payment Intent falhou');

    return { processed: true, notes: 'Payment Intent failure processado' };

  } catch (error) {
    logger.error({ error, paymentIntentId: paymentIntent.id }, 'Erro ao processar Payment Intent failed');
    throw error;
  }
}

/**
 * Payment Intent requer ação
 */
async function handlePaymentIntentRequiresAction(paymentIntent) {
  try {
    const payment = await db('payments')
      .where({ stripe_payment_intent_id: paymentIntent.id })
      .first();

    if (!payment) {
      return { processed: false, notes: 'Pagamento não encontrado no sistema' };
    }

    await db('payments')
      .where({ id: payment.id })
      .update({
        status: 'processing',
        metadata: {
          ...payment.metadata,
          requires_action: true,
          next_action: paymentIntent.next_action
        }
      });

    return { processed: true, notes: 'Payment Intent requires action processado' };

  } catch (error) {
    logger.error({ error, paymentIntentId: paymentIntent.id }, 'Erro ao processar Payment Intent requires action');
    throw error;
  }
}

/**
 * Invoice payment succeeded (assinaturas)
 */
async function handleInvoicePaymentSucceeded(invoice) {
  try {
    if (!invoice.subscription) {
      return { processed: false, notes: 'Invoice sem subscription associada' };
    }

    const subscription = await db('subscriptions')
      .where({ stripe_subscription_id: invoice.subscription })
      .first();

    if (!subscription) {
      return { processed: false, notes: 'Subscription não encontrada no sistema' };
    }

    // Criar registro de pagamento para a invoice
    const [payment] = await db('payments').insert({
      user_id: subscription.user_id,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: invoice.subscription,
      type: 'subscription',
      status: 'succeeded',
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      paid_at: new Date(invoice.status_transitions.paid_at * 1000),
      description: `Pagamento de assinatura - ${invoice.number}`,
      metadata: {
        invoice_id: invoice.id,
        subscription_id: invoice.subscription,
        period_start: invoice.lines.data[0]?.period?.start,
        period_end: invoice.lines.data[0]?.period?.end
      }
    }).returning('*');

    // Aprovar comissões de afiliado pendentes para este usuário
    await db('affiliate_commissions')
      .where({
        user_id: subscription.user_id,
        commission_type: 'subscription',
        status: 'pending'
      })
      .update({ status: 'approved' });

    // Log de auditoria
    await db('audit_logs').insert({
      user_id: subscription.user_id,
      action: 'subscription_payment_succeeded',
      resource_type: 'payment',
      resource_id: payment.id,
      details: {
        invoice_id: invoice.id,
        subscription_id: invoice.subscription,
        amount: invoice.amount_paid / 100
      }
    });

    logger.info({ 
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      amount: invoice.amount_paid / 100 
    }, 'Pagamento de assinatura processado');

    return { processed: true, notes: 'Invoice payment succeeded processado' };

  } catch (error) {
    logger.error({ error, invoiceId: invoice.id }, 'Erro ao processar invoice payment succeeded');
    throw error;
  }
}

/**
 * Invoice payment failed (assinaturas)
 */
async function handleInvoicePaymentFailed(invoice) {
  try {
    if (!invoice.subscription) {
      return { processed: false, notes: 'Invoice sem subscription associada' };
    }

    const subscription = await db('subscriptions')
      .where({ stripe_subscription_id: invoice.subscription })
      .first();

    if (!subscription) {
      return { processed: false, notes: 'Subscription não encontrada no sistema' };
    }

    // Criar registro de pagamento falhado
    await db('payments').insert({
      user_id: subscription.user_id,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: invoice.subscription,
      type: 'subscription',
      status: 'failed',
      amount: invoice.amount_due / 100,
      currency: invoice.currency.toUpperCase(),
      failed_at: new Date(),
      failure_reason: 'Falha no pagamento da fatura',
      description: `Falha no pagamento de assinatura - ${invoice.number}`,
      metadata: {
        invoice_id: invoice.id,
        subscription_id: invoice.subscription
      }
    });

    // Atualizar status da subscription se necessário
    if (invoice.billing_reason === 'subscription_cycle') {
      await db('subscriptions')
        .where({ id: subscription.id })
        .update({ status: 'past_due' });
    }

    // Log de auditoria
    await db('audit_logs').insert({
      user_id: subscription.user_id,
      action: 'subscription_payment_failed',
      resource_type: 'subscription',
      resource_id: subscription.id,
      details: {
        invoice_id: invoice.id,
        amount: invoice.amount_due / 100
      }
    });

    logger.warn({ 
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      amount: invoice.amount_due / 100 
    }, 'Falha no pagamento de assinatura');

    return { processed: true, notes: 'Invoice payment failed processado' };

  } catch (error) {
    logger.error({ error, invoiceId: invoice.id }, 'Erro ao processar invoice payment failed');
    throw error;
  }
}

/**
 * Subscription events
 */
async function handleSubscriptionEvent(subscription) {
  try {
    const existingSubscription = await db('subscriptions')
      .where({ stripe_subscription_id: subscription.id })
      .first();

    if (!existingSubscription) {
      return { processed: false, notes: 'Subscription não encontrada no sistema' };
    }

    // Atualizar dados da subscription
    await db('subscriptions')
      .where({ id: existingSubscription.id })
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        updated_at: new Date()
      });

    return { processed: true, notes: 'Subscription event processado' };

  } catch (error) {
    logger.error({ error, subscriptionId: subscription.id }, 'Erro ao processar subscription event');
    throw error;
  }
}

/**
 * Charge succeeded
 */
async function handleChargeSucceeded(charge) {
  try {
    // Buscar pagamento relacionado
    const payment = await db('payments')
      .where({ stripe_payment_intent_id: charge.payment_intent })
      .first();

    if (!payment) {
      return { processed: false, notes: 'Pagamento não encontrado para este charge' };
    }

    // Iniciar reconciliação se ainda não foi feita
    const existingReconciliation = await db('payment_reconciliation')
      .where({ payment_id: payment.id })
      .first();

    if (!existingReconciliation) {
      await ReconciliationService.reconcilePayment(payment);
    }

    return { processed: true, notes: 'Charge succeeded processado' };

  } catch (error) {
    logger.error({ error, chargeId: charge.id }, 'Erro ao processar charge succeeded');
    throw error;
  }
}

/**
 * Charge failed
 */
async function handleChargeFailed(charge) {
  try {
    const payment = await db('payments')
      .where({ stripe_payment_intent_id: charge.payment_intent })
      .first();

    if (payment) {
      await db('payments')
        .where({ id: payment.id })
        .update({
          status: 'failed',
          failed_at: new Date(),
          failure_reason: charge.failure_message || 'Falha no charge'
        });
    }

    return { processed: true, notes: 'Charge failed processado' };

  } catch (error) {
    logger.error({ error, chargeId: charge.id }, 'Erro ao processar charge failed');
    throw error;
  }
}

/**
 * Dispute created
 */
async function handleDisputeCreated(dispute) {
  try {
    // Log do dispute para análise manual
    await db('audit_logs').insert({
      user_id: null,
      action: 'dispute_created',
      resource_type: 'charge',
      resource_id: dispute.charge,
      details: {
        dispute_id: dispute.id,
        amount: dispute.amount / 100,
        reason: dispute.reason,
        status: dispute.status
      }
    });

    logger.warn({ 
      disputeId: dispute.id,
      chargeId: dispute.charge,
      amount: dispute.amount / 100,
      reason: dispute.reason 
    }, 'Dispute criado - requer atenção manual');

    return { processed: true, notes: 'Dispute created registrado' };

  } catch (error) {
    logger.error({ error, disputeId: dispute.id }, 'Erro ao processar dispute created');
    throw error;
  }
}

/**
 * Charge refunded
 */
async function handleChargeRefunded(charge) {
  try {
    const payment = await db('payments')
      .where({ stripe_payment_intent_id: charge.payment_intent })
      .first();

    if (payment) {
      // Criar registro de refund
      await db('payments').insert({
        user_id: payment.user_id,
        stripe_payment_intent_id: charge.payment_intent,
        type: 'refund',
        status: 'succeeded',
        amount: -Math.abs(charge.amount_refunded / 100),
        currency: charge.currency.toUpperCase(),
        paid_at: new Date(),
        description: `Reembolso para pagamento ${payment.id}`,
        metadata: {
          original_payment_id: payment.id,
          charge_id: charge.id,
          refund_reason: charge.refunds?.data[0]?.reason || 'N/A'
        }
      });

      // Se foi pagamento pré-pago, debitar o saldo
      if (payment.type === 'prepaid') {
        try {
          await PaymentService.debitPrepaidBalance(
            payment.user_id,
            charge.amount_refunded / 100,
            payment.currency,
            `Reembolso do pagamento ${payment.id}`,
            payment.id
          );
        } catch (balanceError) {
          logger.warn({ 
            error: balanceError, 
            paymentId: payment.id 
          }, 'Não foi possível debitar saldo para reembolso');
        }
      }
    }

    return { processed: true, notes: 'Charge refunded processado' };

  } catch (error) {
    logger.error({ error, chargeId: charge.id }, 'Erro ao processar charge refunded');
    throw error;
  }
}

/**
 * TradingView Signal Webhook - Processamento do código Pine CoinBitClub
 */
export const tradingViewSignalWebhook = handleAsyncError(async (req, res) => {
  const { token } = req.query;
  const signalData = req.body;

  // Verificar token de autenticação
  if (!token || token !== env.WEBHOOK_TOKEN) {
    logger.warn({ ip: req.ip, token }, 'Tentativa de acesso não autorizada ao webhook de sinal');
    return res.status(401).json({ error: 'Token inválido' });
  }

  try {
    // Salvar o webhook bruto
    const [webhookLog] = await db('raw_webhook').insert({
      source: 'tradingview_signal',
      payload: signalData,
      status: 'received',
      received_at: new Date(),
      ip_address: req.ip
    }).returning('id');

    logger.info({ 
      webhookId: webhookLog.id,
      ticker: signalData.ticker,
      signal: signalData 
    }, 'Webhook de sinal TradingView recebido');

    // Determinar ação baseada nos cruzamentos EMA9
    let action = 'HOLD';
    if (signalData.cruzou_acima_ema9 === '1' || signalData.cruzou_acima_ema9 === 1) {
      action = 'BUY';
    } else if (signalData.cruzou_abaixo_ema9 === '1' || signalData.cruzou_abaixo_ema9 === 1) {
      action = 'SELL';
    }

    // Salvar sinal processado na estrutura existente
    await db('trading_signals').insert({
      webhook_id: webhookLog.id,
      source: 'tradingview',
      symbol: signalData.ticker || 'UNKNOWN',
      action: action,
      price: parseFloat(signalData.close) || null,
      volume: parseFloat(signalData.vol_30) || null,
      strategy: 'CoinBitClub-CompleteSignal',
      exchange: 'tradingview',
      timeframe: '30m', // Baseado no timeframe do indicador
      signal_timestamp: signalData.time ? new Date(signalData.time) : new Date(),
      created_at: new Date(),
      processed_at: new Date(),
      status: 'processed',
      metadata: {
        // Dados técnicos do Pine Script
        ema9_30: parseFloat(signalData.ema9_30) || null,
        rsi_4h: parseFloat(signalData.rsi_4h) || null,
        rsi_15: parseFloat(signalData.rsi_15) || null,
        momentum_15: parseFloat(signalData.momentum_15) || null,
        atr_30: parseFloat(signalData.atr_30) || null,
        atr_pct_30: parseFloat(signalData.atr_pct_30) || null,
        vol_ma_30: parseFloat(signalData.vol_ma_30) || null,
        diff_btc_ema7: parseFloat(signalData.diff_btc_ema7) || null,
        cruzou_acima_ema9: signalData.cruzou_acima_ema9 === '1' || signalData.cruzou_acima_ema9 === 1,
        cruzou_abaixo_ema9: signalData.cruzou_abaixo_ema9 === '1' || signalData.cruzou_abaixo_ema9 === 1,
        
        // Dados originais para auditoria
        original_payload: signalData,
        processed_at: new Date()
      },
      raw_data: signalData
    });

    // Atualizar status do webhook
    await db('raw_webhook')
      .where({ id: webhookLog.id })
      .update({ 
        status: 'processed',
        processed_at: new Date()
      });

    res.json({ 
      status: 'success', 
      message: 'Sinal CoinBitClub recebido e processado',
      webhook_id: webhookLog.id,
      action: action,
      symbol: signalData.ticker,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error({ error, signalData }, 'Erro ao processar webhook de sinal TradingView');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * TradingView Dominance Webhook - Processamento do código Pine BTC Dominance
 */
export const tradingViewDominanceWebhook = handleAsyncError(async (req, res) => {
  const { token } = req.query;
  const dominanceData = req.body;

  // Verificar token de autenticação
  if (!token || token !== env.WEBHOOK_TOKEN) {
    logger.warn({ ip: req.ip, token }, 'Tentativa de acesso não autorizada ao webhook de dominância');
    return res.status(401).json({ error: 'Token inválido' });
  }

  try {
    // Salvar o webhook bruto
    const [webhookLog] = await db('raw_webhook').insert({
      source: 'tradingview_dominance',
      payload: dominanceData,
      status: 'received',
      received_at: new Date(),
      ip_address: req.ip
    }).returning('id');

    logger.info({ 
      webhookId: webhookLog.id,
      ticker: dominanceData.ticker,
      dominance: dominanceData.btc_dominance,
      sinal: dominanceData.sinal
    }, 'Webhook de dominância TradingView recebido');

    // Salvar dados de dominância
    await db('dominance_data').insert({
      webhook_id: webhookLog.id,
      symbol: dominanceData.ticker || 'BTC.D',
      dominance_percentage: parseFloat(dominanceData.btc_dominance) || null,
      signal_timestamp: dominanceData.time ? new Date(dominanceData.time) : new Date(),
      source: 'tradingview',
      metadata: {
        // Dados específicos do Pine Script de dominância
        ema_7: parseFloat(dominanceData.ema_7) || null,
        diff_pct: parseFloat(dominanceData.diff_pct) || null,
        sinal: dominanceData.sinal || 'NEUTRO',
        
        // Dados técnicos calculados
        dominance_trend: dominanceData.sinal,
        trend_strength: Math.abs(parseFloat(dominanceData.diff_pct) || 0),
        
        // Dados originais para auditoria
        original_payload: dominanceData,
        processed_at: new Date()
      }
    });

    // Atualizar status do webhook
    await db('raw_webhook')
      .where({ id: webhookLog.id })
      .update({ 
        status: 'processed',
        processed_at: new Date()
      });

    res.json({ 
      status: 'success', 
      message: 'Dados de dominância BTC recebidos e processados',
      webhook_id: webhookLog.id,
      dominance: dominanceData.btc_dominance,
      signal: dominanceData.sinal,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error({ error, dominanceData }, 'Erro ao processar webhook de dominância TradingView');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Endpoint para consultar sinais recentes
 */
export const getRecentSignals = handleAsyncError(async (req, res) => {
  const { limit = 50, symbol, status } = req.query;

  try {
    let query = db('trading_signals')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit));

    if (symbol) {
      query = query.where('symbol', 'ilike', `%${symbol}%`);
    }

    if (status) {
      query = query.where('status', status);
    }

    const signals = await query;

    res.json({
      status: 'success',
      count: signals.length,
      signals: signals
    });

  } catch (error) {
    logger.error({ error }, 'Erro ao consultar sinais recentes');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rotas dos webhooks
router.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhookEnhanced);
router.post('/signal', tradingViewSignalWebhook);
router.post('/dominance', tradingViewDominanceWebhook);

// Rotas de consulta
router.get('/signals/recent', getRecentSignals);

export default router;
