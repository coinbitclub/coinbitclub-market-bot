import express from 'express';
import { db } from '../../../common/db.js';
import { handleAsyncError } from '../../../common/utils.js';
import logger from '../../../common/logger.js';

const router = express.Router();

// Get financial dashboard data
export const getFinancialDashboard = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { period = '7d' } = req.query;
  const days = period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;

  // Receita total
  const totalRevenue = await db('subscriptions')
    .join('plans', 'subscriptions.plan_id', 'plans.id')
    .where('subscriptions.status', 'active')
    .sum('plans.price as total')
    .first();

  // Receita do período
  const periodRevenue = await db('subscriptions')
    .join('plans', 'subscriptions.plan_id', 'plans.id')
    .where('subscriptions.created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
    .where('subscriptions.status', 'active')
    .sum('plans.price as total')
    .first();

  // Saldo pré-pago de usuários (total em contas)
  const userBalances = await db('user_credentials')
    .where('is_active', true)
    .sum('balance_usdt as total')
    .first();

  // Total a pagar afiliados (comissões pendentes)
  const pendingCommissions = await db('affiliate_commissions')
    .where('status', 'pending')
    .sum('commission_amount as total')
    .first();

  // Saldo do negócio (receita - comissões pagas)
  const paidCommissions = await db('affiliate_commissions')
    .where('status', 'paid')
    .sum('commission_amount as total')
    .first();

  const businessBalance = parseFloat(totalRevenue.total || 0) - parseFloat(paidCommissions.total || 0);

  // Últimas assinaturas
  const recentSubscriptions = await db('subscriptions')
    .join('users', 'subscriptions.user_id', 'users.id')
    .join('plans', 'subscriptions.plan_id', 'plans.id')
    .orderBy('subscriptions.created_at', 'desc')
    .limit(10)
    .select(
      'users.name as user_name',
      'plans.name as plan_name',
      'plans.price as value',
      'subscriptions.created_at as date',
      'subscriptions.status'
    );

  // Últimos afiliados
  const recentAffiliates = await db('affiliate_commissions')
    .join('users as affiliate', 'affiliate_commissions.affiliate_id', 'affiliate.id')
    .join('users as referred', 'affiliate_commissions.user_id', 'referred.id')
    .orderBy('affiliate_commissions.created_at', 'desc')
    .limit(10)
    .select(
      'affiliate.name as affiliate_name',
      'referred.name as referred_name',
      'affiliate_commissions.commission_amount as commission',
      'affiliate_commissions.status',
      'affiliate_commissions.created_at as date'
    );

  // Solicitações de saque (mock data - implementar quando tiver sistema de saque)
  const withdrawalRequests = await db('affiliate_commissions')
    .join('users', 'affiliate_commissions.affiliate_id', 'users.id')
    .where('affiliate_commissions.status', 'pending')
    .select(
      'users.name as user_name',
      'affiliate_commissions.commission_amount as value',
      'affiliate_commissions.created_at as date',
      'affiliate_commissions.status'
    )
    .limit(10);

  // Relatório de receita diária
  const dailyRevenue = await db.raw(`
    SELECT 
      DATE(s.created_at) as date,
      SUM(p.price) as revenue,
      COUNT(*) as subscriptions
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.created_at >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY DATE(s.created_at)
    ORDER BY date DESC
  `);

  res.json({
    summary: {
      totalRevenue: parseFloat(totalRevenue.total || 0),
      periodRevenue: parseFloat(periodRevenue.total || 0),
      userBalances: parseFloat(userBalances.total || 0),
      pendingCommissions: parseFloat(pendingCommissions.total || 0),
      businessBalance
    },
    recentSubscriptions: recentSubscriptions.map(sub => ({
      userName: sub.user_name,
      plan: sub.plan_name,
      value: parseFloat(sub.value),
      date: sub.date,
      status: sub.status
    })),
    recentAffiliates: recentAffiliates.map(aff => ({
      affiliateName: aff.affiliate_name,
      referredName: aff.referred_name,
      commission: parseFloat(aff.commission),
      status: aff.status,
      date: aff.date
    })),
    withdrawalRequests: withdrawalRequests.map(req => ({
      userName: req.user_name,
      value: parseFloat(req.value),
      date: req.date,
      status: req.status === 'pending' ? 'Pendente' : 'Processado'
    })),
    charts: {
      dailyRevenue: dailyRevenue.rows.map(row => ({
        date: row.date,
        revenue: parseFloat(row.revenue || 0),
        subscriptions: parseInt(row.subscriptions || 0)
      }))
    }
  });
});

// Get accounting dashboard data
export const getAccountingDashboard = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;

  // Receitas mensais por categoria
  const monthlyRevenue = await db.raw(`
    SELECT 
      p.name as category,
      SUM(p.price) as amount,
      COUNT(*) as transactions
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE EXTRACT(MONTH FROM s.created_at) = ? 
    AND EXTRACT(YEAR FROM s.created_at) = ?
    AND s.status = 'active'
    GROUP BY p.name
  `, [month, year]);

  // Despesas (comissões pagas)
  const monthlyExpenses = await db.raw(`
    SELECT 
      'Comissões de Afiliados' as category,
      SUM(commission_amount) as amount,
      COUNT(*) as transactions
    FROM affiliate_commissions
    WHERE EXTRACT(MONTH FROM created_at) = ? 
    AND EXTRACT(YEAR FROM created_at) = ?
    AND status = 'paid'
    GROUP BY 'Comissões de Afiliados'
  `, [month, year]);

  // Demonstrativo de resultado
  const totalRevenue = monthlyRevenue.rows.reduce((sum, row) => sum + parseFloat(row.amount || 0), 0);
  const totalExpenses = monthlyExpenses.rows.reduce((sum, row) => sum + parseFloat(row.amount || 0), 0);
  const grossProfit = totalRevenue - totalExpenses;
  const netProfit = grossProfit; // Simplificado

  // Fluxo de caixa mensal
  const cashFlow = await db.raw(`
    WITH revenue AS (
      SELECT 
        DATE(created_at) as date,
        SUM(p.price) as inflow
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE EXTRACT(MONTH FROM s.created_at) = ? 
      AND EXTRACT(YEAR FROM s.created_at) = ?
      GROUP BY DATE(created_at)
    ),
    expenses AS (
      SELECT 
        DATE(created_at) as date,
        SUM(commission_amount) as outflow
      FROM affiliate_commissions
      WHERE EXTRACT(MONTH FROM created_at) = ? 
      AND EXTRACT(YEAR FROM created_at) = ?
      AND status = 'paid'
      GROUP BY DATE(created_at)
    )
    SELECT 
      COALESCE(r.date, e.date) as date,
      COALESCE(r.inflow, 0) as inflow,
      COALESCE(e.outflow, 0) as outflow,
      COALESCE(r.inflow, 0) - COALESCE(e.outflow, 0) as net_flow
    FROM revenue r
    FULL OUTER JOIN expenses e ON r.date = e.date
    ORDER BY date
  `, [month, year, month, year]);

  // Análise de impostos (simplificado)
  const taxAnalysis = {
    grossRevenue: totalRevenue,
    deductibleExpenses: totalExpenses,
    taxableIncome: grossProfit,
    estimatedTax: grossProfit * 0.15, // 15% estimado
    netIncome: grossProfit * 0.85
  };

  // Conciliação bancária (mock)
  const bankReconciliation = {
    bankBalance: 125000.00,
    bookBalance: businessBalance,
    pendingDeposits: 2500.00,
    pendingWithdrawals: parseFloat(pendingCommissions.total || 0),
    adjustedBalance: 125000.00 + 2500.00 - parseFloat(pendingCommissions.total || 0)
  };

  res.json({
    period: { month, year },
    profitLoss: {
      revenue: {
        categories: monthlyRevenue.rows.map(row => ({
          category: row.category,
          amount: parseFloat(row.amount || 0),
          transactions: parseInt(row.transactions || 0)
        })),
        total: totalRevenue
      },
      expenses: {
        categories: monthlyExpenses.rows.map(row => ({
          category: row.category,
          amount: parseFloat(row.amount || 0),
          transactions: parseInt(row.transactions || 0)
        })),
        total: totalExpenses
      },
      grossProfit,
      netProfit
    },
    cashFlow: {
      daily: cashFlow.rows.map(row => ({
        date: row.date,
        inflow: parseFloat(row.inflow || 0),
        outflow: parseFloat(row.outflow || 0),
        netFlow: parseFloat(row.net_flow || 0)
      })),
      summary: {
        totalInflow: cashFlow.rows.reduce((sum, row) => sum + parseFloat(row.inflow || 0), 0),
        totalOutflow: cashFlow.rows.reduce((sum, row) => sum + parseFloat(row.outflow || 0), 0),
        netCashFlow: cashFlow.rows.reduce((sum, row) => sum + parseFloat(row.net_flow || 0), 0)
      }
    },
    taxAnalysis,
    bankReconciliation
  });
});

// Get AI reports (executes every 4 hours)
export const getAIReports = handleAsyncError(async (req, res) => {
  const userId = req.user.role === 'admin' ? null : req.user.id;
  
  // Get latest AI reports from the last 24 hours
  const reports = await db('ai_reports')
    .where('created_at', '>=', db.raw('CURRENT_TIMESTAMP - INTERVAL \'24 hours\''))
    .where(function() {
      if (userId) {
        this.where('user_id', userId).orWhereNull('user_id');
      }
    })
    .orderBy('created_at', 'desc')
    .select('*');

  // If no reports exist, create mock data
  if (reports.length === 0) {
    const mockReports = [
      {
        id: 1,
        type: 'market_analysis',
        title: 'Análise de Mercado 4h',
        content: {
          sentiment: 'bullish',
          confidence: 78,
          recommendations: [
            'BTC apresenta tendência de alta com suporte em $65,000',
            'ETH mostra força relativa acima da média móvel de 20 períodos',
            'Mercado altcoin em consolidação, aguardar confirmação'
          ],
          risk_level: 'moderate',
          next_analysis: new Date(Date.now() + 4 * 60 * 60 * 1000)
        },
        user_id: userId,
        created_at: new Date()
      },
      {
        id: 2,
        type: 'portfolio_performance',
        title: 'Performance da Carteira',
        content: {
          performance: '+2.3%',
          best_asset: 'BTC',
          worst_asset: 'ADA',
          recommendations: [
            'Rebalancear posição em ETH',
            'Considerar take profit parcial em BTC',
            'Manter posições defensivas'
          ],
          risk_score: 6.5
        },
        user_id: userId,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        id: 3,
        type: 'system_health',
        title: 'Saúde do Sistema',
        content: {
          uptime: '99.9%',
          active_operations: 45,
          success_rate: '87%',
          alerts: [
            'Latência da API Binance ligeiramente elevada',
            'Volume de operações acima da média'
          ],
          status: 'healthy'
        },
        user_id: null, // System-wide report
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000)
      }
    ];
    
    return res.json({
      reports: mockReports,
      nextUpdate: new Date(Date.now() + 4 * 60 * 60 * 1000),
      updateInterval: '4 hours'
    });
  }

  res.json({
    reports: reports.map(report => ({
      id: report.id,
      type: report.type,
      title: report.title,
      content: typeof report.content === 'string' ? JSON.parse(report.content) : report.content,
      createdAt: report.created_at,
      userId: report.user_id
    })),
    nextUpdate: new Date(Date.now() + 4 * 60 * 60 * 1000),
    updateInterval: '4 hours'
  });
});

// Generate AI report manually (admin only)
export const generateAIReport = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { type, targetUserId } = req.body;

  // Mock AI report generation
  const reportContent = {
    market_analysis: {
      sentiment: Math.random() > 0.5 ? 'bullish' : 'bearish',
      confidence: Math.floor(Math.random() * 40) + 60,
      recommendations: [
        'Análise técnica sugere consolidação no curto prazo',
        'Volume de negociação abaixo da média',
        'Aguardar confirmação de breakout'
      ],
      risk_level: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)]
    },
    portfolio_performance: {
      performance: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 5).toFixed(1)}%`,
      recommendations: [
        'Revisar estratégia de stop loss',
        'Considerar diversificação adicional'
      ],
      risk_score: (Math.random() * 10).toFixed(1)
    },
    system_health: {
      uptime: '99.9%',
      active_operations: Math.floor(Math.random() * 100),
      success_rate: `${Math.floor(Math.random() * 20) + 80}%`,
      status: 'healthy'
    }
  };

  const newReport = {
    type,
    title: `Relatório ${type.replace('_', ' ')} - ${new Date().toLocaleString()}`,
    content: JSON.stringify(reportContent[type] || {}),
    user_id: targetUserId || null,
    created_at: new Date()
  };

  // In a real implementation, save to database
  // await db('ai_reports').insert(newReport);

  logger.info({ type, targetUserId }, 'AI report generated manually');

  res.json({
    success: true,
    message: 'Relatório gerado com sucesso',
    report: newReport
  });
});

// Routes
router.get('/dashboard', getFinancialDashboard);
router.get('/accounting', getAccountingDashboard);
router.get('/ai-reports', getAIReports);
router.post('/ai-reports/generate', generateAIReport);

export default router;
