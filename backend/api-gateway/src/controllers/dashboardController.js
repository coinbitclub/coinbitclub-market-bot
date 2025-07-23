import express from 'express';
import { db } from '../../../common/db.js';
import { handleAsyncError } from '../../../common/utils.js';
import logger from '../../../common/logger.js';

const router = express.Router();

// Get user dashboard data
export const getUserDashboard = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  
  // Get user's subscription and plan
  const userSubscription = await db('subscriptions')
    .join('plans', 'subscriptions.plan_id', 'plans.id')
    .where({ 
      'subscriptions.user_id': userId,
      'subscriptions.status': 'active'
    })
    .select(
      'subscriptions.*',
      'plans.name as plan_name',
      'plans.features'
    )
    .first();

  // Get user's trading accounts
  const tradingAccounts = await db('user_credentials')
    .where({ user_id: userId, is_active: true })
    .select('exchange', 'balance_usdt', 'last_sync', 'is_testnet');

  // Calculate total balance
  const totalBalance = tradingAccounts.reduce((sum, account) => 
    sum + parseFloat(account.balance_usdt || 0), 0);

  // Get recent operations
  const recentOperations = await db('cointars')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .limit(10)
    .select('*');

  // Get today's operations
  const todayOperations = await db('cointars')
    .where({ user_id: userId })
    .whereRaw('DATE(created_at) = CURRENT_DATE')
    .select('*');

  // Calculate daily performance
  const dailyPerformance = todayOperations.reduce((stats, op) => {
    if (op.status === 'completed') {
      stats.completedOps++;
      stats.totalProfit += parseFloat(op.profit_loss || 0);
    }
    if (op.status === 'pending') stats.pendingOps++;
    return stats;
  }, { completedOps: 0, pendingOps: 0, totalProfit: 0 });

  // Calculate daily return percentage
  const dailyReturn = totalBalance > 0 ? (dailyPerformance.totalProfit / totalBalance) * 100 : 0;

  // Get accumulated profitability (last 30 days)
  const monthlyOperations = await db('cointars')
    .where({ user_id: userId })
    .where('created_at', '>=', db.raw('CURRENT_DATE - INTERVAL \'30 days\''))
    .where('status', 'completed')
    .select('profit_loss');

  const accumulatedProfit = monthlyOperations.reduce((sum, op) => 
    sum + parseFloat(op.profit_loss || 0), 0);
  
  const accumulatedReturn = totalBalance > 0 ? (accumulatedProfit / totalBalance) * 100 : 0;

  // Get operation history for chart
  const operationHistory = await db.raw(`
    SELECT 
      DATE(created_at) as date,
      SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as profit,
      SUM(CASE WHEN profit_loss < 0 THEN ABS(profit_loss) ELSE 0 END) as loss,
      COUNT(*) as operations
    FROM cointars 
    WHERE user_id = ? AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `, [userId]);

  // Get AI insights (mock data for now)
  const aiInsights = {
    marketSentiment: "lateral",
    recommendation: "proteção de capital",
    confidence: 78,
    nextSignals: 3,
    riskLevel: "médio"
  };

  res.json({
    user: {
      name: req.user.name,
      plan: userSubscription?.plan_name || 'Free Trial',
      planFeatures: userSubscription?.features || []
    },
    balances: {
      total: totalBalance,
      bybit: tradingAccounts.find(acc => acc.exchange === 'bybit')?.balance_usdt || 0,
      binance: tradingAccounts.find(acc => acc.exchange === 'binance')?.balance_usdt || 0
    },
    performance: {
      dailyReturn: dailyReturn.toFixed(2),
      accumulatedReturn: accumulatedReturn.toFixed(2),
      todayProfit: dailyPerformance.totalProfit.toFixed(2),
      monthlyProfit: accumulatedProfit.toFixed(2)
    },
    operations: {
      pending: dailyPerformance.pendingOps,
      completed: recentOperations.filter(op => op.status === 'completed').length,
      total: recentOperations.length,
      recent: recentOperations.slice(0, 5)
    },
    charts: {
      operationHistory: operationHistory.rows,
      performanceChart: operationHistory.rows.map(row => ({
        date: row.date,
        value: parseFloat(row.profit) - parseFloat(row.loss)
      }))
    },
    aiInsights,
    alerts: [], // Will be populated by notification system
    availableBalance: totalBalance * 0.1 // 10% available for new operations
  });
});

// Get admin dashboard (operational dashboard)
export const getAdminDashboard = handleAsyncError(async (req, res) => {
  // Verify admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Get current operations
  const [
    pendingOperations,
    completedTodayOperations,
    activeUsers,
    activeSubscriptions,
    totalUsers
  ] = await Promise.all([
    // Pending operations
    db('cointars')
      .where('status', 'pending')
      .count('* as count')
      .first(),
    
    // Completed operations today
    db('cointars')
      .where('status', 'completed')
      .whereRaw('DATE(created_at) = CURRENT_DATE')
      .count('* as count')
      .first(),
    
    // Active users (logged in last 7 days)
    db('users')
      .where('last_login', '>=', db.raw('CURRENT_DATE - INTERVAL \'7 days\''))
      .count('* as count')
      .first(),
    
    // Active subscriptions
    db('subscriptions')
      .where('status', 'active')
      .count('* as count')
      .first(),
    
    // Total users
    db('users')
      .where('is_active', true)
      .count('* as count')
      .first()
  ]);

  // Calculate assertiveness (success rate)
  const todayOperationsDetail = await db('cointars')
    .whereRaw('DATE(created_at) = CURRENT_DATE')
    .where('status', 'completed')
    .select('profit_loss');

  const successfulOps = todayOperationsDetail.filter(op => 
    parseFloat(op.profit_loss || 0) > 0).length;
  
  const todayAssertiveness = todayOperationsDetail.length > 0 
    ? (successfulOps / todayOperationsDetail.length) * 100 
    : 0;

  // Historical assertiveness (last 30 days)
  const monthlyOperations = await db('cointars')
    .where('created_at', '>=', db.raw('CURRENT_DATE - INTERVAL \'30 days\''))
    .where('status', 'completed')
    .select('profit_loss');

  const monthlySuccessfulOps = monthlyOperations.filter(op => 
    parseFloat(op.profit_loss || 0) > 0).length;
  
  const historicalAssertiveness = monthlyOperations.length > 0 
    ? (monthlySuccessfulOps / monthlyOperations.length) * 100 
    : 0;

  // Get detailed operations for table
  const detailedOperations = await db('cointars')
    .join('users', 'cointars.user_id', 'users.id')
    .orderBy('cointars.created_at', 'desc')
    .limit(20)
    .select(
      'cointars.*',
      'users.name as user_name'
    );

  // Get recent alerts
  const recentAlerts = await db('notifications')
    .where('type', 'alert')
    .orderBy('created_at', 'desc')
    .limit(10)
    .select('*');

  // Mock TradingView signals (replace with actual integration)
  const tradingViewSignals = [
    {
      symbol: 'BTCUSDT',
      type: 'Cruzamento',
      direction: 'LONG',
      dateTime: new Date(),
      exchange: 'Bybit'
    },
    {
      symbol: 'ETHUSDT',
      type: 'Canal',
      direction: 'SHORT',
      dateTime: new Date(Date.now() - 30 * 60 * 1000),
      exchange: 'Binance'
    }
  ];

  // Mock CoinStats data (replace with actual integration)
  const coinStatsData = {
    global: {
      dominance: 52.8,
      trend: 48.9
    },
    altcoins: {
      dominance: 21.6,
      trend: 32
    }
  };

  // Mock AI market reading
  const aiMarketReading = {
    sentiment: "SHORT",
    reason: "possível tendência de baixa após rejeição em nível de resistência",
    confidence: 85
  };

  res.json({
    metrics: {
      pendingOperations: parseInt(pendingOperations.count),
      completedToday: parseInt(completedTodayOperations.count),
      todayAssertiveness: todayAssertiveness.toFixed(1),
      historicalAssertiveness: historicalAssertiveness.toFixed(1),
      activeUsers: parseInt(activeUsers.count),
      totalUsers: parseInt(totalUsers.count),
      activeSubscriptions: parseInt(activeSubscriptions.count)
    },
    operations: detailedOperations.map(op => ({
      id: op.id,
      user: op.user_name,
      exchange: op.exchange || 'Bybit',
      pair: op.symbol,
      type: op.side,
      value: parseFloat(op.quantity || 0),
      direction: op.side === 'BUY' ? 'LONG' : 'SHORT',
      status: op.status,
      result: parseFloat(op.profit_loss || 0)
    })),
    aiMarketReading,
    tradingViewSignals,
    coinStatsData,
    recentAlerts: recentAlerts.map(alert => ({
      id: alert.id,
      type: alert.title,
      message: alert.message,
      time: alert.created_at,
      level: alert.metadata?.level || 'info'
    }))
  });
});

// Get affiliate dashboard
export const getAffiliateDashboard = handleAsyncError(async (req, res) => {
  const affiliateId = req.user.id;
  
  // Get affiliate stats
  const [
    totalReferrals,
    activeReferrals,
    totalCommissions,
    pendingCommissions,
    approvedCommissions
  ] = await Promise.all([
    // Total referrals
    db('users')
      .where({ affiliate_id: affiliateId })
      .count('* as count')
      .first(),
      
    // Active referrals (with active subscriptions)
    db('users')
      .join('subscriptions', 'users.id', 'subscriptions.user_id')
      .where({ 
        'users.affiliate_id': affiliateId,
        'subscriptions.status': 'active'
      })
      .count('* as count')
      .first(),
      
    // Total commissions
    db('affiliate_commissions')
      .where({ affiliate_id: affiliateId })
      .sum('commission_amount as total')
      .first(),
      
    // Pending commissions
    db('affiliate_commissions')
      .where({ 
        affiliate_id: affiliateId,
        status: 'pending'
      })
      .sum('commission_amount as total')
      .first(),
      
    // Approved commissions
    db('affiliate_commissions')
      .where({ 
        affiliate_id: affiliateId,
        status: 'approved'
      })
      .sum('commission_amount as total')
      .first()
  ]);

  // Calculate conversion rate
  const conversionRate = parseInt(totalReferrals.count) > 0 
    ? (parseInt(activeReferrals.count) / parseInt(totalReferrals.count)) * 100 
    : 0;

  // Get recent referrals
  const recentReferrals = await db('users')
    .where({ affiliate_id: affiliateId })
    .orderBy('created_at', 'desc')
    .limit(10)
    .select('id', 'name', 'email', 'created_at');

  // Get commission history
  const commissionHistory = await db('affiliate_commissions')
    .join('users', 'affiliate_commissions.user_id', 'users.id')
    .where({ 'affiliate_commissions.affiliate_id': affiliateId })
    .orderBy('affiliate_commissions.created_at', 'desc')
    .limit(10)
    .select(
      'affiliate_commissions.*',
      'users.name as user_name'
    );

  // Get monthly trend
  const monthlyTrend = await db.raw(`
    SELECT 
      DATE_TRUNC('month', created_at) as month,
      SUM(commission_amount) as total,
      COUNT(*) as count
    FROM affiliate_commissions 
    WHERE affiliate_id = ? AND created_at >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month DESC
  `, [affiliateId]);

  // Get or create affiliate code
  let user = await db('users').where({ id: affiliateId }).first();
  if (!user.affiliate_code) {
    const affiliateCode = `AF${affiliateId.toString().padStart(6, '0')}`;
    await db('users')
      .where({ id: affiliateId })
      .update({ affiliate_code: affiliateCode });
    user.affiliate_code = affiliateCode;
  }

  const baseUrl = process.env.FRONTEND_URL || 'https://coinbitclub.com';
  const affiliateLink = `${baseUrl}/register?ref=${user.affiliate_code}`;

  res.json({
    stats: {
      totalReferrals: parseInt(totalReferrals.count),
      activeReferrals: parseInt(activeReferrals.count),
      conversionRate: conversionRate.toFixed(1),
      totalCommissions: parseFloat(totalCommissions.total || 0),
      pendingCommissions: parseFloat(pendingCommissions.total || 0),
      approvedCommissions: parseFloat(approvedCommissions.total || 0)
    },
    affiliate: {
      code: user.affiliate_code,
      link: affiliateLink,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(affiliateLink)}`
    },
    recentReferrals: recentReferrals.map(ref => ({
      id: ref.id,
      name: ref.name,
      email: ref.email,
      registeredAt: ref.created_at
    })),
    commissionHistory: commissionHistory.map(comm => ({
      id: comm.id,
      amount: parseFloat(comm.commission_amount),
      user: comm.user_name,
      status: comm.status,
      date: comm.created_at
    })),
    monthlyTrend: monthlyTrend.rows,
    performanceMetrics: {
      averageCommission: commissionHistory.length > 0 
        ? commissionHistory.reduce((sum, c) => sum + parseFloat(c.commission_amount), 0) / commissionHistory.length
        : 0,
      topReferralMonth: monthlyTrend.rows[0]?.month || null
    }
  });
});

// Get system health and metrics for monitoring
export const getSystemHealth = handleAsyncError(async (req, res) => {
  try {
    // Database health
    const dbHealth = await db.raw('SELECT 1 as healthy');
    
    // Recent errors
    const recentErrors = await db('audit_logs')
      .where('action', 'like', '%error%')
      .where('created_at', '>=', db.raw('CURRENT_TIMESTAMP - INTERVAL \'1 hour\''))
      .count('* as count')
      .first();

    // Active connections
    const activeConnections = await db.raw(`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE state = 'active'
    `);

    res.json({
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: {
          status: dbHealth.rows.length > 0 ? 'healthy' : 'unhealthy',
          connections: parseInt(activeConnections.rows[0]?.count || 0)
        },
        api: {
          status: 'healthy',
          uptime: process.uptime()
        }
      },
      metrics: {
        recentErrors: parseInt(recentErrors.count),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    });
  } catch (error) {
    logger.error({ error }, 'Health check failed');
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    });
  }
});

// === ADMIN DASHBOARD FUNCTIONS ===

// Leitura do mercado pela IA
export const getMarketReading = handleAsyncError(async (req, res) => {
  try {
    // Buscar última leitura do mercado
    const marketReading = await db('market_readings')
      .orderBy('created_at', 'desc')
      .first();

    const defaultReading = {
      direction: 'NEUTRO',
      confidence: 0,
      lastUpdate: new Date().toISOString(),
      aiJustification: 'Sistema inicializando análise do mercado...',
      dayTracking: 'Monitoramento contínuo ativo'
    };

    res.json(marketReading || defaultReading);
  } catch (error) {
    logger.error('Erro ao buscar leitura do mercado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Sinais do TradingView
export const getTradingViewSignals = handleAsyncError(async (req, res) => {
  try {
    const signals = await db('signals')
      .where('source', 'TRADINGVIEW')
      .where('created_at', '>=', db.raw("NOW() - INTERVAL '24 hours'"))
      .orderBy('created_at', 'desc')
      .limit(10)
      .select('*');

    res.json({ signals });
  } catch (error) {
    logger.error('Erro ao buscar sinais TradingView:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Sinais do Cointars
export const getCointarsSignals = handleAsyncError(async (req, res) => {
  try {
    const signals = await db('cointars')
      .where('created_at', '>=', db.raw("NOW() - INTERVAL '24 hours'"))
      .orderBy('created_at', 'desc')
      .limit(10)
      .select('*');

    res.json({ signals });
  } catch (error) {
    logger.error('Erro ao buscar sinais Cointars:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Logs do sistema
export const getSystemLogs = handleAsyncError(async (req, res) => {
  try {
    const logs = await db('system_logs')
      .where('created_at', '>=', db.raw("NOW() - INTERVAL '1 hour'"))
      .orderBy('created_at', 'desc')
      .limit(20)
      .select('*');

    res.json({ logs });
  } catch (error) {
    logger.error('Erro ao buscar logs do sistema:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estratégias dos ingestores
export const getIngestorStrategies = handleAsyncError(async (req, res) => {
  try {
    // Retornar dados mockados por enquanto até criar as tabelas necessárias
    const mockStrategies = [
      {
        name: 'TradingView RSI',
        isActive: true,
        lastSignal: '2 min atrás',
        signalsToday: 15,
        accuracy: 78.5
      },
      {
        name: 'Cointars MACD',
        isActive: true,
        lastSignal: '5 min atrás',
        signalsToday: 12,
        accuracy: 82.1
      },
      {
        name: 'Volume Analysis',
        isActive: false,
        lastSignal: '1 hora atrás',
        signalsToday: 8,
        accuracy: 65.3
      }
    ];

    res.json({ strategies: mockStrategies });
  } catch (error) {
    logger.error('Erro ao buscar estratégias dos ingestores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Métricas de acertividade e retorno
export const getMetrics = handleAsyncError(async (req, res) => {
  try {
    // Dados mockados por enquanto
    const accuracy = {
      day: {
        accuracy: 75.2,
        totalSignals: 24,
        correctSignals: 18
      },
      historical: {
        accuracy: 78.9,
        totalSignals: 342,
        correctSignals: 270,
        period: '30 dias'
      }
    };

    const returns = {
      day: {
        return: 1250.50,
        percentage: 2.8
      },
      historical: {
        return: 15780.25,
        percentage: 12.4,
        period: '30 dias'
      }
    };

    res.json({ accuracy, returns });
  } catch (error) {
    logger.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Operações em andamento
export const getOperations = handleAsyncError(async (req, res) => {
  try {
    // Dados mockados por enquanto
    const mockOperations = [
      {
        id: '1',
        symbol: 'BTCUSDT',
        side: 'LONG',
        size: 0.1,
        entryPrice: 43250.00,
        currentPrice: 43680.00,
        pnl: 43.00,
        pnlPercent: 0.99,
        status: 'ACTIVE',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        symbol: 'ETHUSDT',
        side: 'SHORT',
        size: 2.5,
        entryPrice: 2680.00,
        currentPrice: 2650.00,
        pnl: 75.00,
        pnlPercent: 1.12,
        status: 'ACTIVE',
        timestamp: new Date().toISOString()
      }
    ];

    res.json({ operations: mockOperations });
  } catch (error) {
    logger.error('Erro ao buscar operações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// === END ADMIN DASHBOARD FUNCTIONS ===

router.get('/health', getSystemHealth);

// Legacy routes for compatibility
router.get('/balance/:userId', async (req, res) => {
  const row = await db('user_financial').where('user_id', req.params.userId).first();
  res.json(row || {});
});

router.get('/performance/:userId', async (req, res) => {
  const records = await db('user_financial').where('user_id', req.params.userId);
  res.json(records);
});

// New dashboard routes
router.get('/user', getUserDashboard);
router.get('/admin', getAdminDashboard);
router.get('/affiliate', getAffiliateDashboard);

// Admin Dashboard Routes
router.get('/market-reading', getMarketReading);
router.get('/tradingview-signals', getTradingViewSignals);
router.get('/cointars-signals', getCointarsSignals);
router.get('/system-logs', getSystemLogs);
router.get('/ingestor-strategies', getIngestorStrategies);
router.get('/metrics', getMetrics);
router.get('/operations', getOperations);

export default router;
