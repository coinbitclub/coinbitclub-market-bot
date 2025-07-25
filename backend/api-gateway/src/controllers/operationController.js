import express from 'express';
import { OperationControlService } from '../services/operationControlService.js';
import { db } from '../../../common/db.js';
import { handleAsyncError } from '../../../common/utils.js';
import Joi from 'joi';
import logger from '../../../common/logger.js';

const router = express.Router();

// Schemas de validação
const operationDebitSchema = Joi.object({
  operation_type: Joi.string().valid('trade', 'copy_trade', 'signal', 'premium_feature').required(),
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().valid('BRL', 'USD').default('BRL'),
  description: Joi.string().max(255).optional(),
  metadata: Joi.object().optional()
});

const operationCreditSchema = Joi.object({
  operation_type: Joi.string().valid('trade_profit', 'copy_trade_profit', 'signal_profit', 'bonus', 'refund').required(),
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().valid('BRL', 'USD').default('BRL'),
  description: Joi.string().max(255).optional(),
  metadata: Joi.object().optional()
});

const affiliateCommissionSchema = Joi.object({
  profit_amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().valid('BRL', 'USD').default('BRL'),
  operation_type: Joi.string().valid('trade_profit', 'copy_trade_profit', 'signal_profit').required(),
  metadata: Joi.object().optional()
});

/**
 * Verificar se usuário pode operar
 */
export const checkOperationEligibility = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  const { operation_type, amount, currency = 'BRL' } = req.query;

  if (!operation_type || !amount) {
    return res.status(400).json({ 
      error: 'operation_type e amount são obrigatórios' 
    });
  }

  const canOperate = await OperationControlService.canUserOperate(
    userId, 
    operation_type, 
    parseFloat(amount), 
    currency
  );

  res.json({
    success: true,
    data: {
      can_operate: canOperate.allowed,
      reason: canOperate.reason,
      current_balance: canOperate.currentBalance,
      minimum_required: canOperate.minimumRequired,
      remaining_after_operation: canOperate.remainingAfterOperation
    }
  });
});

/**
 * Executar débito de operação
 */
export const executeOperationDebit = handleAsyncError(async (req, res) => {
  const { error, value } = operationDebitSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const userId = req.user.id;
  const { operation_type, amount, currency, description, metadata } = value;

  const result = await OperationControlService.executeOperationDebit(
    userId,
    operation_type,
    amount,
    currency,
    description,
    metadata
  );

  res.json({
    success: true,
    message: 'Operação debitada com sucesso',
    data: {
      operation_id: result.operationId,
      debited_amount: result.debitedAmount,
      remaining_balance: result.remainingBalance,
      operation_type: result.operationType
    }
  });
});

/**
 * Executar crédito de operação
 */
export const executeOperationCredit = handleAsyncError(async (req, res) => {
  const { error, value } = operationCreditSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const userId = req.user.id;
  const { operation_type, amount, currency, description, metadata } = value;

  const result = await OperationControlService.executeOperationCredit(
    userId,
    operation_type,
    amount,
    currency,
    description,
    metadata
  );

  res.json({
    success: true,
    message: 'Operação creditada com sucesso',
    data: {
      operation_id: result.operationId,
      credited_amount: result.creditedAmount,
      new_balance: result.newBalance,
      operation_type: result.operationType
    }
  });
});

/**
 * Processar comissão de afiliado baseada em lucro
 */
export const processAffiliateCommission = handleAsyncError(async (req, res) => {
  const { error, value } = affiliateCommissionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const userId = req.user.id;
  const { profit_amount, currency, operation_type, metadata } = value;

  const result = await OperationControlService.processAffiliateCommissionOnProfit(
    userId,
    profit_amount,
    currency,
    operation_type,
    metadata
  );

  if (!result.affiliate) {
    return res.json({
      success: true,
      message: 'Usuário não possui afiliado',
      data: {
        has_affiliate: false,
        profit_amount: profit_amount
      }
    });
  }

  res.json({
    success: true,
    message: 'Comissão de afiliado processada com sucesso',
    data: {
      has_affiliate: true,
      affiliate_id: result.affiliate.id,
      affiliate_name: result.affiliate.name,
      commission_rate: result.commissionRate,
      commission_amount: result.commissionAmount,
      affiliate_tier: result.affiliateTier,
      operation_type: operation_type,
      profit_amount: profit_amount
    }
  });
});

/**
 * Obter estatísticas de operações do usuário
 */
export const getUserOperationStats = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  const { period = '30d', currency = 'BRL' } = req.query;

  const stats = await OperationControlService.getUserOperationStats(userId, {
    period,
    currency
  });

  res.json({
    success: true,
    data: stats
  });
});

/**
 * ADMIN: Obter estatísticas globais de operações
 */
export const getGlobalOperationStats = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { period = '30d', currency = 'BRL' } = req.query;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const [
    totalOperations,
    totalDebits,
    totalCredits,
    uniqueUsers,
    operationsByType,
    recentActivity
  ] = await Promise.all([
    db('operation_logs')
      .where('currency', currency)
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .count('* as count')
      .first(),

    db('operation_logs')
      .where('currency', currency)
      .where('operation_direction', 'debit')
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .sum('amount as total')
      .first(),

    db('operation_logs')
      .where('currency', currency)
      .where('operation_direction', 'credit')
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .sum('amount as total')
      .first(),

    db('operation_logs')
      .where('currency', currency)
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .countDistinct('user_id as count')
      .first(),

    db('operation_logs')
      .where('currency', currency)
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .select('operation_type')
      .sum('amount as total_amount')
      .count('* as operation_count')
      .groupBy('operation_type')
      .orderBy('total_amount', 'desc'),

    db('operation_logs')
      .join('users', 'operation_logs.user_id', 'users.id')
      .where('operation_logs.currency', currency)
      .where('operation_logs.created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '24 hours'`))
      .select(
        'operation_logs.*',
        'users.name as user_name',
        'users.email as user_email'
      )
      .orderBy('operation_logs.created_at', 'desc')
      .limit(20)
  ]);

  res.json({
    success: true,
    data: {
      period: `${days}d`,
      currency,
      total_operations: parseInt(totalOperations.count),
      total_debits: parseFloat(totalDebits.total || 0),
      total_credits: parseFloat(totalCredits.total || 0),
      net_flow: parseFloat(totalCredits.total || 0) - parseFloat(totalDebits.total || 0),
      unique_users: parseInt(uniqueUsers.count),
      operations_by_type: operationsByType.map(item => ({
        operation_type: item.operation_type,
        total_amount: parseFloat(item.total_amount),
        operation_count: parseInt(item.operation_count)
      })),
      recent_activity: recentActivity.map(item => ({
        ...item,
        amount: parseFloat(item.amount)
      }))
    }
  });
});

/**
 * ADMIN: Listar logs de operações
 */
export const getOperationLogs = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { 
    page = 1, 
    limit = 50, 
    user_id,
    operation_type,
    operation_direction,
    currency,
    start_date,
    end_date
  } = req.query;

  const offset = (page - 1) * limit;

  let query = db('operation_logs')
    .join('users', 'operation_logs.user_id', 'users.id')
    .select(
      'operation_logs.*',
      'users.name as user_name',
      'users.email as user_email'
    )
    .orderBy('operation_logs.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  let countQuery = db('operation_logs').count('* as total');

  // Filtros
  if (user_id) {
    query = query.where('operation_logs.user_id', user_id);
    countQuery = countQuery.where('user_id', user_id);
  }

  if (operation_type) {
    query = query.where('operation_logs.operation_type', operation_type);
    countQuery = countQuery.where('operation_type', operation_type);
  }

  if (operation_direction) {
    query = query.where('operation_logs.operation_direction', operation_direction);
    countQuery = countQuery.where('operation_direction', operation_direction);
  }

  if (currency) {
    query = query.where('operation_logs.currency', currency);
    countQuery = countQuery.where('currency', currency);
  }

  if (start_date) {
    query = query.where('operation_logs.created_at', '>=', start_date);
    countQuery = countQuery.where('created_at', '>=', start_date);
  }

  if (end_date) {
    query = query.where('operation_logs.created_at', '<=', end_date);
    countQuery = countQuery.where('created_at', '<=', end_date);
  }

  const [logs, totalResult] = await Promise.all([
    query,
    countQuery.first()
  ]);

  res.json({
    success: true,
    data: logs.map(log => ({
      ...log,
      amount: parseFloat(log.amount),
      balance_before: parseFloat(log.balance_before),
      balance_after: parseFloat(log.balance_after)
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(totalResult.total),
      pages: Math.ceil(totalResult.total / limit)
    }
  });
});

/**
 * ADMIN: Obter settings de controle de operação
 */
export const getOperationSettings = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const settings = await db('system_settings')
    .whereIn('key', [
      'min_balance_for_operations_brl',
      'min_balance_for_operations_usd',
      'affiliate_commission_normal',
      'affiliate_commission_vip'
    ])
    .select('key', 'value', 'description');

  const formattedSettings = {};
  settings.forEach(setting => {
    formattedSettings[setting.key] = {
      value: setting.value,
      description: setting.description
    };
  });

  res.json({
    success: true,
    data: formattedSettings
  });
});

/**
 * ADMIN: Atualizar settings de controle de operação
 */
export const updateOperationSettings = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const allowedSettings = [
    'min_balance_for_operations_brl',
    'min_balance_for_operations_usd',
    'affiliate_commission_normal',
    'affiliate_commission_vip'
  ];

  const updates = [];
  
  for (const [key, value] of Object.entries(req.body)) {
    if (allowedSettings.includes(key)) {
      updates.push(
        db('system_settings')
          .where({ key })
          .update({ 
            value: value.toString(),
            updated_at: new Date()
          })
      );
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Nenhuma configuração válida fornecida' });
  }

  await Promise.all(updates);

  // Log de auditoria
  await db('audit_logs').insert({
    user_id: req.user.id,
    action: 'update_operation_settings',
    resource_type: 'system_settings',
    resource_id: null,
    details: {
      updated_settings: req.body
    }
  });

  res.json({
    success: true,
    message: 'Configurações atualizadas com sucesso'
  });
});

/**
 * Obter saldo e informações de operação do usuário
 */
export const getUserOperationInfo = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  const { currency = 'BRL' } = req.query;

  // Buscar saldo atual
  const balanceResult = await db('users')
    .where({ id: userId })
    .select(
      currency === 'BRL' ? 'prepaid_balance_brl as balance' : 'prepaid_balance_usd as balance'
    )
    .first();

  // Buscar configuração mínima
  const minBalanceSetting = await db('system_settings')
    .where({ key: `min_balance_for_operations_${currency.toLowerCase()}` })
    .select('value')
    .first();

  const minBalance = parseFloat(minBalanceSetting?.value || 0);
  const currentBalance = parseFloat(balanceResult?.balance || 0);

  // Buscar últimas operações
  const recentOperations = await db('operation_logs')
    .where({ user_id: userId, currency })
    .orderBy('created_at', 'desc')
    .limit(10)
    .select('*');

  res.json({
    success: true,
    data: {
      user_id: userId,
      currency,
      current_balance: currentBalance,
      minimum_balance_required: minBalance,
      can_operate: currentBalance >= minBalance,
      available_for_operations: Math.max(0, currentBalance - minBalance),
      recent_operations: recentOperations.map(op => ({
        ...op,
        amount: parseFloat(op.amount),
        balance_before: parseFloat(op.balance_before),
        balance_after: parseFloat(op.balance_after)
      }))
    }
  });
});

// Rotas
router.get('/check-eligibility', checkOperationEligibility);
router.post('/debit', executeOperationDebit);
router.post('/credit', executeOperationCredit);
router.post('/affiliate-commission', processAffiliateCommission);
router.get('/my-stats', getUserOperationStats);
router.get('/my-info', getUserOperationInfo);

// Rotas admin
router.get('/admin/stats', getGlobalOperationStats);
router.get('/admin/logs', getOperationLogs);
router.get('/admin/settings', getOperationSettings);
router.post('/admin/settings', updateOperationSettings);

export default router;
