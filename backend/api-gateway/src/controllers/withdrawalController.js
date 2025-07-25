import express from 'express';
import { WithdrawalService } from '../services/withdrawalService.js';
import { db } from '../../../common/db.js';
import { handleAsyncError } from '../../../common/utils.js';
import Joi from 'joi';
import logger from '../../../common/logger.js';

const router = express.Router();

// Schemas de validação
const withdrawalRequestSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().valid('BRL', 'USD').default('BRL'),
  withdrawal_method: Joi.string().valid('pix', 'bank_transfer', 'crypto').required(),
  pix_key: Joi.when('withdrawal_method', {
    is: 'pix',
    then: Joi.string().required(),
    otherwise: Joi.string().optional()
  }),
  bank_details: Joi.when('withdrawal_method', {
    is: 'bank_transfer',
    then: Joi.object({
      bank_code: Joi.string().required(),
      agency: Joi.string().required(),
      account: Joi.string().required(),
      account_type: Joi.string().valid('corrente', 'poupanca').required(),
      holder_name: Joi.string().required(),
      holder_document: Joi.string().required()
    }).required(),
    otherwise: Joi.object().optional()
  }),
  crypto_address: Joi.when('withdrawal_method', {
    is: 'crypto',
    then: Joi.string().required(),
    otherwise: Joi.string().optional()
  })
});

const adminWithdrawalSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().valid('BRL', 'USD').default('BRL'),
  withdrawal_method: Joi.string().valid('pix', 'bank_transfer', 'crypto').required(),
  pix_key: Joi.string().optional(),
  bank_details: Joi.object().optional(),
  crypto_address: Joi.string().optional()
});

/**
 * Solicitar saque de saldo pré-pago
 */
export const requestWithdrawal = handleAsyncError(async (req, res) => {
  const { error, value } = withdrawalRequestSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const userId = req.user.id;
  const { amount, currency, withdrawal_method, pix_key, bank_details, crypto_address } = value;

  const withdrawalDetails = {};
  
  if (withdrawal_method === 'pix') {
    withdrawalDetails.pix_key = pix_key;
  } else if (withdrawal_method === 'bank_transfer') {
    withdrawalDetails.bank_details = bank_details;
  } else if (withdrawal_method === 'crypto') {
    withdrawalDetails.crypto_address = crypto_address;
  }

  const withdrawal = await WithdrawalService.requestWithdrawal(
    userId, 
    amount, 
    currency, 
    withdrawalDetails
  );

  res.json({
    success: true,
    message: 'Solicitação de saque criada com sucesso',
    data: {
      withdrawal_id: withdrawal.id,
      amount: withdrawal.amount,
      currency: withdrawal.currency,
      fee_amount: withdrawal.fee_amount,
      net_amount: withdrawal.net_amount,
      status: withdrawal.status,
      estimated_processing: withdrawal.status === 'pending' 
        ? 'Até 2 horas em horário comercial' 
        : 'Sendo processado'
    }
  });
});

/**
 * Listar saques do usuário
 */
export const getUserWithdrawals = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;

  const result = await WithdrawalService.getUserWithdrawals(userId, {
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.json({
    success: true,
    data: result.withdrawals,
    pagination: result.pagination
  });
});

/**
 * Cancelar saque
 */
export const cancelWithdrawal = handleAsyncError(async (req, res) => {
  const { withdrawalId } = req.params;
  const userId = req.user.id;

  await WithdrawalService.cancelWithdrawal(withdrawalId, userId);

  res.json({
    success: true,
    message: 'Saque cancelado com sucesso'
  });
});

/**
 * Obter detalhes de um saque
 */
export const getWithdrawalDetails = handleAsyncError(async (req, res) => {
  const { withdrawalId } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  let query = db('withdrawal_requests')
    .where({ id: withdrawalId });

  // Se não for admin, só pode ver seus próprios saques
  if (!isAdmin) {
    query = query.where({ user_id: userId });
  }

  const withdrawal = await query.first();

  if (!withdrawal) {
    return res.status(404).json({ error: 'Saque não encontrado' });
  }

  // Se for admin, buscar dados do usuário
  if (isAdmin) {
    const user = await db('users')
      .where({ id: withdrawal.user_id })
      .select('name', 'email')
      .first();
    
    withdrawal.user_info = user;
  }

  res.json({
    success: true,
    data: withdrawal
  });
});

/**
 * ADMIN: Solicitar saque de lucros
 */
export const requestAdminWithdrawal = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { error, value } = adminWithdrawalSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const adminId = req.user.id;
  const { amount, currency, withdrawal_method, pix_key, bank_details, crypto_address } = value;

  // Verificar lucros disponíveis
  const availableProfits = await WithdrawalService.calculateAvailableProfits(currency);
  
  if (availableProfits < amount) {
    return res.status(400).json({ 
      error: 'Lucros insuficientes',
      available_profits: availableProfits,
      requested_amount: amount
    });
  }

  const withdrawalDetails = {};
  
  if (withdrawal_method === 'pix') {
    withdrawalDetails.pix_key = pix_key;
  } else if (withdrawal_method === 'bank_transfer') {
    withdrawalDetails.bank_details = bank_details;
  } else if (withdrawal_method === 'crypto') {
    withdrawalDetails.crypto_address = crypto_address;
  }

  const withdrawal = await WithdrawalService.requestAdminWithdrawal(
    adminId, 
    amount, 
    currency, 
    withdrawalDetails
  );

  res.json({
    success: true,
    message: 'Saque de lucros solicitado com sucesso',
    data: {
      withdrawal_id: withdrawal.id,
      amount: withdrawal.amount,
      currency: withdrawal.currency,
      net_amount: withdrawal.net_amount,
      status: withdrawal.status,
      available_profits_remaining: availableProfits - amount
    }
  });
});

/**
 * ADMIN: Obter lucros disponíveis
 */
export const getAvailableProfits = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { currency = 'BRL' } = req.query;

  const availableProfits = await WithdrawalService.calculateAvailableProfits(currency);

  // Calcular breakdown detalhado
  const [
    totalRevenue,
    totalCommissions,
    totalUserWithdrawals,
    totalAdminWithdrawals,
    pendingWithdrawals
  ] = await Promise.all([
    db('payments')
      .where({ status: 'succeeded', currency })
      .whereIn('type', ['subscription', 'prepaid'])
      .sum('amount as total')
      .first(),

    db('affiliate_commissions')
      .where({ status: 'paid', currency: currency.toLowerCase() })
      .sum('commission_amount as total')
      .first(),

    db('withdrawal_requests')
      .where({ status: 'completed', currency, withdrawal_type: 'user_prepaid' })
      .sum('net_amount as total')
      .first(),

    db('withdrawal_requests')
      .where({ status: 'completed', currency, withdrawal_type: 'admin_profit' })
      .sum('net_amount as total')
      .first(),

    db('withdrawal_requests')
      .where({ currency, withdrawal_type: 'admin_profit' })
      .whereIn('status', ['pending', 'processing'])
      .sum('amount as total')
      .first()
  ]);

  res.json({
    success: true,
    data: {
      currency,
      available_profits: availableProfits,
      breakdown: {
        total_revenue: parseFloat(totalRevenue.total || 0),
        total_commissions: parseFloat(totalCommissions.total || 0),
        total_user_withdrawals: parseFloat(totalUserWithdrawals.total || 0),
        total_admin_withdrawals: parseFloat(totalAdminWithdrawals.total || 0)
      },
      pending_admin_withdrawals: parseFloat(pendingWithdrawals.total || 0)
    }
  });
});

/**
 * ADMIN: Listar todos os saques
 */
export const getAllWithdrawals = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { 
    page = 1, 
    limit = 50, 
    status, 
    withdrawal_type,
    currency,
    user_id 
  } = req.query;

  const offset = (page - 1) * limit;

  let query = db('withdrawal_requests')
    .join('users', 'withdrawal_requests.user_id', 'users.id')
    .select(
      'withdrawal_requests.*',
      'users.name as user_name',
      'users.email as user_email'
    )
    .orderBy('withdrawal_requests.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  let countQuery = db('withdrawal_requests').count('* as total');

  // Filtros
  if (status) {
    query = query.where('withdrawal_requests.status', status);
    countQuery = countQuery.where('status', status);
  }

  if (withdrawal_type) {
    query = query.where('withdrawal_requests.withdrawal_type', withdrawal_type);
    countQuery = countQuery.where('withdrawal_type', withdrawal_type);
  }

  if (currency) {
    query = query.where('withdrawal_requests.currency', currency);
    countQuery = countQuery.where('currency', currency);
  }

  if (user_id) {
    query = query.where('withdrawal_requests.user_id', user_id);
    countQuery = countQuery.where('user_id', user_id);
  }

  const [withdrawals, totalResult] = await Promise.all([
    query,
    countQuery.first()
  ]);

  res.json({
    success: true,
    data: withdrawals,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(totalResult.total),
      pages: Math.ceil(totalResult.total / limit)
    }
  });
});

/**
 * ADMIN: Processar saque manualmente
 */
export const processWithdrawalManually = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { withdrawalId } = req.params;
  const { action, notes } = req.body; // action: 'approve' | 'reject'

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Ação deve ser approve ou reject' });
  }

  const withdrawal = await db('withdrawal_requests')
    .where({ id: withdrawalId })
    .first();

  if (!withdrawal) {
    return res.status(404).json({ error: 'Saque não encontrado' });
  }

  if (withdrawal.status !== 'pending') {
    return res.status(400).json({ error: 'Saque não está pendente' });
  }

  if (action === 'approve') {
    await WithdrawalService.processWithdrawalAutomatically(withdrawalId);
    
    await db('withdrawal_requests')
      .where({ id: withdrawalId })
      .update({
        processed_by: req.user.id,
        processing_notes: notes || 'Aprovado manualmente pelo admin'
      });

  } else {
    // Rejeitar saque
    await db('withdrawal_requests')
      .where({ id: withdrawalId })
      .update({
        status: 'failed',
        processed_by: req.user.id,
        processed_at: new Date(),
        processing_notes: notes || 'Rejeitado pelo admin'
      });

    // Reverter saldo
    const PaymentService = await import('../services/paymentService.js');
    await PaymentService.PaymentService.creditPrepaidBalance(
      withdrawal.user_id,
      withdrawal.amount,
      withdrawal.currency,
      null,
      `Reversão de saque rejeitado - ID: ${withdrawalId}`
    );
  }

  // Log de auditoria
  await db('audit_logs').insert({
    user_id: req.user.id,
    action: `withdrawal_${action}d`,
    resource_type: 'withdrawal_request',
    resource_id: withdrawalId,
    details: {
      withdrawal_amount: withdrawal.amount,
      withdrawal_currency: withdrawal.currency,
      target_user_id: withdrawal.user_id,
      notes
    }
  });

  res.json({
    success: true,
    message: `Saque ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso`
  });
});

/**
 * Obter estatísticas de saques
 */
export const getWithdrawalStats = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { period = '30d', currency = 'BRL' } = req.query;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const [
    totalWithdrawals,
    completedWithdrawals,
    pendingWithdrawals,
    totalVolume,
    totalFees,
    userWithdrawals,
    adminWithdrawals
  ] = await Promise.all([
    db('withdrawal_requests')
      .where('currency', currency)
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .count('* as count')
      .first(),

    db('withdrawal_requests')
      .where('currency', currency)
      .where('status', 'completed')
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .count('* as count')
      .first(),

    db('withdrawal_requests')
      .where('currency', currency)
      .whereIn('status', ['pending', 'processing'])
      .count('* as count')
      .first(),

    db('withdrawal_requests')
      .where('currency', currency)
      .where('status', 'completed')
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .sum('net_amount as total')
      .first(),

    db('withdrawal_requests')
      .where('currency', currency)
      .where('status', 'completed')
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .sum('fee_amount as total')
      .first(),

    db('withdrawal_requests')
      .where('currency', currency)
      .where('withdrawal_type', 'user_prepaid')
      .where('status', 'completed')
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .sum('net_amount as total')
      .first(),

    db('withdrawal_requests')
      .where('currency', currency)
      .where('withdrawal_type', 'admin_profit')
      .where('status', 'completed')
      .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
      .sum('net_amount as total')
      .first()
  ]);

  const completionRate = totalWithdrawals.count > 0 ? 
    (completedWithdrawals.count / totalWithdrawals.count * 100).toFixed(2) : 0;

  res.json({
    success: true,
    data: {
      period: `${days}d`,
      currency,
      total_withdrawals: parseInt(totalWithdrawals.count),
      completed_withdrawals: parseInt(completedWithdrawals.count),
      pending_withdrawals: parseInt(pendingWithdrawals.count),
      completion_rate: parseFloat(completionRate),
      total_volume: parseFloat(totalVolume.total || 0),
      total_fees: parseFloat(totalFees.total || 0),
      user_withdrawals: parseFloat(userWithdrawals.total || 0),
      admin_withdrawals: parseFloat(adminWithdrawals.total || 0)
    }
  });
});

// Rotas
router.post('/request', requestWithdrawal);
router.get('/my-withdrawals', getUserWithdrawals);
router.post('/cancel/:withdrawalId', cancelWithdrawal);
router.get('/details/:withdrawalId', getWithdrawalDetails);

// Rotas admin
router.post('/admin/request', requestAdminWithdrawal);
router.get('/admin/profits', getAvailableProfits);
router.get('/admin/all', getAllWithdrawals);
router.post('/admin/process/:withdrawalId', processWithdrawalManually);
router.get('/admin/stats', getWithdrawalStats);

export default router;
