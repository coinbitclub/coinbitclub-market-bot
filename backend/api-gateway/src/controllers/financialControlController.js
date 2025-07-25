import express from 'express';
import { FinancialControlService } from '../services/financialControlService.js';
import { db } from '../../../common/db.js';
import { handleAsyncError } from '../../../common/utils.js';
import Joi from 'joi';
import logger from '../../../common/logger.js';

const router = express.Router();

// Schemas de validação
const dateRangeSchema = Joi.object({
  start_date: Joi.date().required(),
  end_date: Joi.date().min(Joi.ref('start_date')).required()
});

const monthlyReportSchema = Joi.object({
  year: Joi.number().integer().min(2020).max(2030).required(),
  month: Joi.number().integer().min(1).max(12).required()
});

/**
 * ADMIN: Obter saldo atual da Stripe
 */
export const getStripeBalance = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const balance = await FinancialControlService.getStripeBalance();

  res.json({
    success: true,
    data: {
      stripe_balance: balance,
      last_updated: new Date(),
      note: 'Saldo disponível e pendente na conta Stripe'
    }
  });
});

/**
 * ADMIN: Obter vendas diárias
 */
export const getDailySales = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { date } = req.query;
  const targetDate = date ? new Date(date) : new Date();

  const salesData = await FinancialControlService.getDailySales(targetDate);

  res.json({
    success: true,
    data: salesData
  });
});

/**
 * ADMIN: Relatório financeiro mensal completo
 */
export const getMonthlyReport = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { error, value } = monthlyReportSchema.validate(req.query);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { year, month } = value;

  const report = await FinancialControlService.getMonthlyFinancialReport(year, month);

  res.json({
    success: true,
    data: report
  });
});

/**
 * ADMIN: Análise de fluxo de caixa
 */
export const getCashFlowAnalysis = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { days = 30 } = req.query;
  const daysInt = parseInt(days);

  if (daysInt < 1 || daysInt > 365) {
    return res.status(400).json({ 
      error: 'Período deve estar entre 1 e 365 dias' 
    });
  }

  const cashFlow = await FinancialControlService.getCashFlowAnalysis(daysInt);

  res.json({
    success: true,
    data: cashFlow
  });
});

/**
 * ADMIN: Detectar anomalias financeiras
 */
export const getFinancialAnomalies = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const anomalies = await FinancialControlService.detectFinancialAnomalies();

  res.json({
    success: true,
    data: anomalies
  });
});

/**
 * ADMIN: Sincronizar com Stripe
 */
export const syncWithStripe = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { error, value } = dateRangeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { start_date, end_date } = value;

  const syncReport = await FinancialControlService.syncWithStripe(
    new Date(start_date),
    new Date(end_date)
  );

  res.json({
    success: true,
    message: 'Sincronização com Stripe concluída',
    data: syncReport
  });
});

/**
 * ADMIN: Dashboard financeiro geral
 */
export const getFinancialDashboard = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const [
    stripeBalance,
    todaySales,
    monthlyReport,
    cashFlow7Days,
    anomalies,
    recentTransactions
  ] = await Promise.all([
    FinancialControlService.getStripeBalance(),
    FinancialControlService.getDailySales(today),
    FinancialControlService.getMonthlyFinancialReport(today.getFullYear(), today.getMonth() + 1),
    FinancialControlService.getCashFlowAnalysis(7),
    FinancialControlService.detectFinancialAnomalies(),
    getRecentFinancialActivity()
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        stripe_balance: stripeBalance,
        today_sales: todaySales.local_data,
        monthly_summary: {
          gross_revenue: monthlyReport.revenue.gross_revenue,
          net_profit: monthlyReport.profit.net_profit,
          profit_margin: monthlyReport.profit.profit_margin,
          total_transactions: monthlyReport.transactions.total_payments
        }
      },
      trends: {
        cash_flow_7days: cashFlow7Days,
        anomalies_summary: {
          total_anomalies: anomalies.anomalies_detected,
          high_severity: anomalies.anomalies.filter(a => a.severity === 'high').length
        }
      },
      recent_activity: recentTransactions,
      last_updated: new Date()
    }
  });
});

/**
 * ADMIN: Exportar dados financeiros
 */
export const exportFinancialData = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { error, value } = dateRangeSchema.validate(req.query);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { start_date, end_date } = value;
  const { format = 'json' } = req.query;

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  // Buscar todos os dados do período
  const [payments, withdrawals, commissions, operations] = await Promise.all([
    db('payments')
      .whereBetween('created_at', [startDate, endDate])
      .orderBy('created_at', 'desc'),
    
    db('withdrawal_requests')
      .whereBetween('created_at', [startDate, endDate])
      .orderBy('created_at', 'desc'),
    
    db('affiliate_commissions')
      .whereBetween('created_at', [startDate, endDate])
      .orderBy('created_at', 'desc'),
    
    db('operation_logs')
      .whereBetween('created_at', [startDate, endDate])
      .orderBy('created_at', 'desc')
      .limit(1000) // Limitar logs de operação
  ]);

  const exportData = {
    export_info: {
      period: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      },
      generated_at: new Date(),
      generated_by: req.user.id,
      format: format
    },
    summary: {
      total_payments: payments.length,
      total_withdrawals: withdrawals.length,
      total_commissions: commissions.length,
      total_operations: operations.length
    },
    data: {
      payments: payments.map(p => ({
        ...p,
        amount: parseFloat(p.amount),
        fee_amount: parseFloat(p.fee_amount)
      })),
      withdrawals: withdrawals.map(w => ({
        ...w,
        amount: parseFloat(w.amount),
        fee_amount: parseFloat(w.fee_amount),
        net_amount: parseFloat(w.net_amount)
      })),
      commissions: commissions.map(c => ({
        ...c,
        commission_amount: parseFloat(c.commission_amount)
      })),
      operations: operations.map(o => ({
        ...o,
        balance_before: parseFloat(o.balance_before),
        balance_after: parseFloat(o.balance_after || 0),
        amount_used: parseFloat(o.amount_used || 0)
      }))
    }
  };

  if (format === 'csv') {
    // Implementar exportação CSV se necessário
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="financial_export_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv"`);
    
    // Por enquanto retornar JSON
    res.json(exportData);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="financial_export_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  }
});

/**
 * ADMIN: Relatórios financeiros salvos
 */
export const getSavedReports = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { page = 1, limit = 20, type } = req.query;
  const offset = (page - 1) * limit;

  let query = db('financial_reports')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  let countQuery = db('financial_reports').count('* as total');

  if (type) {
    query = query.where('type', type);
    countQuery = countQuery.where('type', type);
  }

  const [reports, totalResult] = await Promise.all([
    query,
    countQuery.first()
  ]);

  res.json({
    success: true,
    data: reports.map(report => ({
      ...report,
      data: typeof report.data === 'string' ? JSON.parse(report.data) : report.data
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
 * Função auxiliar para buscar atividade financeira recente
 */
async function getRecentFinancialActivity() {
  const [recentPayments, recentWithdrawals] = await Promise.all([
    db('payments')
      .join('users', 'payments.user_id', 'users.id')
      .select(
        'payments.*',
        'users.name as user_name',
        'users.email as user_email'
      )
      .orderBy('payments.created_at', 'desc')
      .limit(10),

    db('withdrawal_requests')
      .join('users', 'withdrawal_requests.user_id', 'users.id')
      .select(
        'withdrawal_requests.*',
        'users.name as user_name',
        'users.email as user_email'
      )
      .orderBy('withdrawal_requests.created_at', 'desc')
      .limit(10)
  ]);

  return {
    recent_payments: recentPayments.map(p => ({
      ...p,
      amount: parseFloat(p.amount)
    })),
    recent_withdrawals: recentWithdrawals.map(w => ({
      ...w,
      amount: parseFloat(w.amount),
      net_amount: parseFloat(w.net_amount)
    }))
  };
}

// Rotas
router.get('/stripe-balance', getStripeBalance);
router.get('/daily-sales', getDailySales);
router.get('/monthly-report', getMonthlyReport);
router.get('/cash-flow', getCashFlowAnalysis);
router.get('/anomalies', getFinancialAnomalies);
router.post('/sync-stripe', syncWithStripe);
router.get('/dashboard', getFinancialDashboard);
router.get('/export', exportFinancialData);
router.get('/reports', getSavedReports);

export default router;
