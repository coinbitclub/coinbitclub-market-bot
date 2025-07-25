import express from 'express';
import { PaymentService } from '../services/paymentService.js';
import { ReconciliationService } from '../services/reconciliationService.js';
import { db } from '../../../common/db.js';
import { handleAsyncError } from '../../../common/utils.js';
import { validate } from '../../../common/validation.js';
import Joi from 'joi';
import logger from '../../../common/logger.js';

const router = express.Router();

// Schemas de validação
const createPrepaidPaymentSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().valid('BRL', 'USD').default('BRL'),
  payment_method_id: Joi.string().optional()
});

const debitPrepaidSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().valid('BRL', 'USD').default('BRL'),
  description: Joi.string().required(),
  reference_id: Joi.string().optional()
});

/**
 * Criar pagamento pré-pago
 */
export const createPrepaidPayment = handleAsyncError(async (req, res) => {
  const { error, value } = createPrepaidPaymentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { amount, currency, payment_method_id } = value;
  const userId = req.user.id;

  const result = await PaymentService.createPrepaidPayment(userId, amount, currency, payment_method_id);

  res.json({
    success: true,
    data: {
      payment_id: result.payment.id,
      client_secret: result.paymentIntent.client_secret,
      status: result.paymentIntent.status,
      amount: amount,
      bonus_amount: result.bonusAmount,
      total_credit: result.totalCredit,
      requires_action: result.paymentIntent.status === 'requires_action',
      next_action: result.paymentIntent.next_action
    }
  });
});

/**
 * Confirmar pagamento pré-pago
 */
export const confirmPrepaidPayment = handleAsyncError(async (req, res) => {
  const { payment_intent_id } = req.body;
  const userId = req.user.id;

  if (!payment_intent_id) {
    return res.status(400).json({ error: 'payment_intent_id é obrigatório' });
  }

  // Buscar pagamento
  const payment = await db('payments')
    .where({ 
      stripe_payment_intent_id: payment_intent_id,
      user_id: userId 
    })
    .first();

  if (!payment) {
    return res.status(404).json({ error: 'Pagamento não encontrado' });
  }

  if (payment.status === 'succeeded') {
    return res.json({
      success: true,
      message: 'Pagamento já foi confirmado',
      status: 'succeeded'
    });
  }

  // Reconciliar o pagamento
  const reconciliationResult = await ReconciliationService.reconcilePayment(payment);

  res.json({
    success: true,
    status: reconciliationResult.status,
    message: reconciliationResult.status === 'matched' 
      ? 'Pagamento confirmado com sucesso' 
      : 'Pagamento processado, aguardando confirmação'
  });
});

/**
 * Obter saldo pré-pago do usuário
 */
export const getPrepaidBalance = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  const { currency = 'BRL' } = req.query;

  const balance = await PaymentService.getUserPrepaidBalance(userId, currency);

  res.json({
    success: true,
    data: {
      balance,
      currency
    }
  });
});

/**
 * Listar transações pré-pagas do usuário
 */
export const getPrepaidTransactions = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, type } = req.query;

  const result = await PaymentService.getUserPrepaidTransactions(userId, {
    page: parseInt(page),
    limit: parseInt(limit),
    type
  });

  res.json({
    success: true,
    data: result.transactions,
    pagination: result.pagination
  });
});

/**
 * Debitar saldo pré-pago (admin apenas)
 */
export const debitPrepaidBalance = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { error, value } = debitPrepaidSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { user_id } = req.params;
  const { amount, currency, description, reference_id } = value;

  const newBalance = await PaymentService.debitPrepaidBalance(
    parseInt(user_id), 
    amount, 
    currency, 
    description, 
    reference_id
  );

  res.json({
    success: true,
    data: {
      new_balance: newBalance,
      amount_debited: amount,
      currency
    }
  });
});

/**
 * Listar todos os pagamentos (admin)
 */
export const getAllPayments = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { 
    page = 1, 
    limit = 50, 
    status, 
    type, 
    user_id,
    date_from,
    date_to 
  } = req.query;

  const offset = (page - 1) * limit;

  let query = db('payments')
    .join('users', 'payments.user_id', 'users.id')
    .select(
      'payments.*',
      'users.name as user_name',
      'users.email as user_email'
    )
    .orderBy('payments.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  let countQuery = db('payments').count('* as total');

  // Filtros
  if (status) {
    query = query.where('payments.status', status);
    countQuery = countQuery.where('status', status);
  }

  if (type) {
    query = query.where('payments.type', type);
    countQuery = countQuery.where('type', type);
  }

  if (user_id) {
    query = query.where('payments.user_id', user_id);
    countQuery = countQuery.where('user_id', user_id);
  }

  if (date_from) {
    query = query.where('payments.created_at', '>=', date_from);
    countQuery = countQuery.where('created_at', '>=', date_from);
  }

  if (date_to) {
    query = query.where('payments.created_at', '<=', date_to);
    countQuery = countQuery.where('created_at', '<=', date_to);
  }

  const [payments, totalResult] = await Promise.all([
    query,
    countQuery.first()
  ]);

  res.json({
    success: true,
    data: payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(totalResult.total),
      pages: Math.ceil(totalResult.total / limit)
    }
  });
});

/**
 * Obter detalhes de um pagamento
 */
export const getPaymentDetails = handleAsyncError(async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  let query = db('payments')
    .join('users', 'payments.user_id', 'users.id')
    .leftJoin('payment_reconciliation', 'payments.id', 'payment_reconciliation.payment_id')
    .where('payments.id', paymentId)
    .select(
      'payments.*',
      'users.name as user_name',
      'users.email as user_email',
      'payment_reconciliation.reconciliation_status',
      'payment_reconciliation.gateway_amount',
      'payment_reconciliation.gateway_fee',
      'payment_reconciliation.reconciliation_notes',
      'payment_reconciliation.reconciled_at'
    );

  // Se não for admin, só pode ver seus próprios pagamentos
  if (!isAdmin) {
    query = query.where('payments.user_id', userId);
  }

  const payment = await query.first();

  if (!payment) {
    return res.status(404).json({ error: 'Pagamento não encontrado' });
  }

  // Se for pagamento pré-pago, buscar transações relacionadas
  let relatedTransactions = [];
  if (payment.type === 'prepaid') {
    relatedTransactions = await db('prepaid_transactions')
      .where({ payment_id: paymentId })
      .orderBy('created_at', 'desc');
  }

  res.json({
    success: true,
    data: {
      ...payment,
      related_transactions: relatedTransactions
    }
  });
});

/**
 * Executar reconciliação manual
 */
export const runReconciliation = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { date_from, date_to } = req.body;

  const dateFrom = date_from ? new Date(date_from) : null;
  const dateTo = date_to ? new Date(date_to) : null;

  const results = await ReconciliationService.reconcilePayments(dateFrom, dateTo);

  res.json({
    success: true,
    message: 'Reconciliação executada com sucesso',
    data: results
  });
});

/**
 * Obter discrepâncias pendentes
 */
export const getPendingDiscrepancies = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const discrepancies = await ReconciliationService.getPendingDiscrepancies();

  res.json({
    success: true,
    data: discrepancies
  });
});

/**
 * Resolver discrepância
 */
export const resolveDiscrepancy = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { reconciliationId } = req.params;
  const { resolution, notes } = req.body;

  if (!resolution || !notes) {
    return res.status(400).json({ error: 'Resolução e notas são obrigatórias' });
  }

  await ReconciliationService.resolveDiscrepancy(
    reconciliationId, 
    resolution, 
    notes, 
    req.user.id
  );

  res.json({
    success: true,
    message: 'Discrepância resolvida com sucesso'
  });
});

/**
 * Gerar relatório de reconciliação
 */
export const generateReconciliationReport = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { date_from, date_to } = req.query;

  if (!date_from || !date_to) {
    return res.status(400).json({ error: 'Datas de início e fim são obrigatórias' });
  }

  const report = await ReconciliationService.generateReconciliationReport(
    new Date(date_from),
    new Date(date_to)
  );

  res.json({
    success: true,
    data: report
  });
});

/**
 * Obter estatísticas de pagamentos
 */
export const getPaymentStats = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { period = '30d' } = req.query;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const [
    totalVolume,
    totalCount,
    successfulPayments,
    failedPayments,
    prepaidVolume,
    subscriptionVolume,
    averageTicket
  ] = await Promise.all([
    // Volume total
    db('payments')
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .where('status', 'succeeded')
      .sum('amount as total')
      .first(),

    // Contagem total
    db('payments')
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .count('* as count')
      .first(),

    // Pagamentos bem sucedidos
    db('payments')
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .where('status', 'succeeded')
      .count('* as count')
      .first(),

    // Pagamentos falhados
    db('payments')
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .where('status', 'failed')
      .count('* as count')
      .first(),

    // Volume pré-pago
    db('payments')
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .where('status', 'succeeded')
      .where('type', 'prepaid')
      .sum('amount as total')
      .first(),

    // Volume assinaturas
    db('payments')
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .where('status', 'succeeded')
      .where('type', 'subscription')
      .sum('amount as total')
      .first(),

    // Ticket médio
    db('payments')
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .where('status', 'succeeded')
      .avg('amount as average')
      .first()
  ]);

  const successRate = totalCount.count > 0 ? 
    (successfulPayments.count / totalCount.count * 100).toFixed(2) : 0;

  res.json({
    success: true,
    data: {
      period: `${days}d`,
      total_volume: parseFloat(totalVolume.total || 0),
      total_count: parseInt(totalCount.count),
      successful_payments: parseInt(successfulPayments.count),
      failed_payments: parseInt(failedPayments.count),
      success_rate: parseFloat(successRate),
      prepaid_volume: parseFloat(prepaidVolume.total || 0),
      subscription_volume: parseFloat(subscriptionVolume.total || 0),
      average_ticket: parseFloat(averageTicket.average || 0)
    }
  });
});

// Rotas
router.post('/prepaid', createPrepaidPayment);
router.post('/prepaid/confirm', confirmPrepaidPayment);
router.get('/prepaid/balance', getPrepaidBalance);
router.get('/prepaid/transactions', getPrepaidTransactions);
router.post('/prepaid/debit/:user_id', debitPrepaidBalance);

router.get('/payments', getAllPayments);
router.get('/payments/:paymentId', getPaymentDetails);
router.get('/stats', getPaymentStats);

router.post('/reconciliation/run', runReconciliation);
router.get('/reconciliation/discrepancies', getPendingDiscrepancies);
router.post('/reconciliation/resolve/:reconciliationId', resolveDiscrepancy);
router.get('/reconciliation/report', generateReconciliationReport);

export default router;
