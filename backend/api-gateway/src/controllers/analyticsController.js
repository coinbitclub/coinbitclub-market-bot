import express from 'express';
import { db } from '../../../common/db.js';
import { handleAsyncError } from '../../../common/utils.js';
import logger from '../../../common/logger.js';

const router = express.Router();

// Get analytics for specific user operations
export const getUserAnalytics = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  const { period = '30d', exchange = 'all' } = req.query;

  // Calculate date range
  const dateRanges = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  };

  const days = dateRanges[period] || 30;
  
  // Base query for operations
  let operationsQuery = db('cointars')
    .where({ user_id: userId })
    .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`));

  if (exchange !== 'all') {
    operationsQuery = operationsQuery.where('exchange', exchange);
  }

  // Performance metrics
  const performanceData = await operationsQuery
    .clone()
    .where('status', 'completed')
    .select(
      db.raw('COUNT(*) as total_operations'),
      db.raw('SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as profitable_operations'),
      db.raw('SUM(profit_loss) as total_profit'),
      db.raw('AVG(profit_loss) as avg_profit'),
      db.raw('MAX(profit_loss) as max_profit'),
      db.raw('MIN(profit_loss) as min_loss')
    )
    .first();

  // Daily performance chart
  const dailyPerformance = await operationsQuery
    .clone()
    .where('status', 'completed')
    .select(
      db.raw('DATE(created_at) as date'),
      db.raw('SUM(profit_loss) as daily_profit'),
      db.raw('COUNT(*) as operations_count'),
      db.raw('SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as successful_ops')
    )
    .groupBy(db.raw('DATE(created_at)'))
    .orderBy('date', 'desc');

  // Asset performance
  const assetPerformance = await operationsQuery
    .clone()
    .where('status', 'completed')
    .select(
      'symbol',
      db.raw('COUNT(*) as operations'),
      db.raw('SUM(profit_loss) as total_profit'),
      db.raw('AVG(profit_loss) as avg_profit'),
      db.raw('SUM(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) as successful_ops')
    )
    .groupBy('symbol')
    .orderBy('total_profit', 'desc')
    .limit(10);

  // Risk metrics
  const riskMetrics = await operationsQuery
    .clone()
    .where('status', 'completed')
    .select(
      db.raw('STDDEV(profit_loss) as volatility'),
      db.raw('MAX(profit_loss) as max_gain'),
      db.raw('MIN(profit_loss) as max_drawdown'),
      db.raw('PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY profit_loss) as var_5percent')
    )
    .first();

  // Calculate win rate
  const winRate = performanceData.total_operations > 0 
    ? (performanceData.profitable_operations / performanceData.total_operations) * 100 
    : 0;

  // Calculate Sharpe ratio (simplified)
  const returns = dailyPerformance.map(d => parseFloat(d.daily_profit || 0));
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const returnStdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  );
  const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;

  res.json({
    period,
    performance: {
      totalOperations: parseInt(performanceData.total_operations || 0),
      profitableOperations: parseInt(performanceData.profitable_operations || 0),
      winRate: winRate.toFixed(2),
      totalProfit: parseFloat(performanceData.total_profit || 0),
      avgProfit: parseFloat(performanceData.avg_profit || 0),
      maxProfit: parseFloat(performanceData.max_profit || 0),
      maxLoss: parseFloat(performanceData.min_loss || 0)
    },
    riskMetrics: {
      volatility: parseFloat(riskMetrics.volatility || 0),
      maxDrawdown: parseFloat(riskMetrics.max_drawdown || 0),
      valueAtRisk: parseFloat(riskMetrics.var_5percent || 0),
      sharpeRatio: sharpeRatio.toFixed(4)
    },
    charts: {
      dailyPerformance: dailyPerformance.map(d => ({
        date: d.date,
        profit: parseFloat(d.daily_profit || 0),
        operations: parseInt(d.operations_count || 0),
        successRate: d.operations_count > 0 
          ? ((d.successful_ops / d.operations_count) * 100).toFixed(1)
          : 0
      })),
      assetPerformance: assetPerformance.map(a => ({
        symbol: a.symbol,
        operations: parseInt(a.operations || 0),
        totalProfit: parseFloat(a.total_profit || 0),
        avgProfit: parseFloat(a.avg_profit || 0),
        successRate: a.operations > 0 
          ? ((a.successful_ops / a.operations) * 100).toFixed(1)
          : 0
      }))
    }
  });
});

// Get system-wide analytics (admin only)
export const getSystemAnalytics = handleAsyncError(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { period = '30d' } = req.query;
  const days = period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;

  // User growth metrics
  const userGrowth = await db.raw(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as new_users,
      SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as cumulative_users
    FROM users 
    WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `);

  // Revenue metrics
  const revenueData = await db('subscriptions')
    .join('plans', 'subscriptions.plan_id', 'plans.id')
    .where('subscriptions.created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
    .select(
      db.raw('DATE(subscriptions.created_at) as date'),
      db.raw('SUM(plans.price) as daily_revenue'),
      db.raw('COUNT(*) as new_subscriptions')
    )
    .groupBy(db.raw('DATE(subscriptions.created_at)'))
    .orderBy('date', 'desc');

  // Operation statistics
  const operationStats = await db('cointars')
    .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
    .select(
      db.raw('COUNT(*) as total_operations'),
      db.raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_operations'),
      db.raw('SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending_operations'),
      db.raw('SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed_operations'),
      db.raw('AVG(CASE WHEN profit_loss IS NOT NULL THEN profit_loss END) as avg_profit')
    )
    .first();

  // Most active users
  const activeUsers = await db('cointars')
    .join('users', 'cointars.user_id', 'users.id')
    .where('cointars.created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
    .select(
      'users.name',
      'users.email',
      db.raw('COUNT(*) as operations_count'),
      db.raw('SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as total_profit')
    )
    .groupBy('users.id', 'users.name', 'users.email')
    .orderBy('operations_count', 'desc')
    .limit(10);

  // Exchange distribution
  const exchangeStats = await db('cointars')
    .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
    .select(
      'exchange',
      db.raw('COUNT(*) as operations'),
      db.raw('SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as total_profit')
    )
    .groupBy('exchange')
    .orderBy('operations', 'desc');

  // Platform health metrics
  const healthMetrics = await db('audit_logs')
    .where('created_at', '>=', db.raw(`CURRENT_DATE - INTERVAL '${days} days'`))
    .select(
      db.raw('COUNT(CASE WHEN action LIKE "%error%" THEN 1 END) as errors'),
      db.raw('COUNT(CASE WHEN action LIKE "%login%" THEN 1 END) as logins'),
      db.raw('COUNT(CASE WHEN action LIKE "%operation%" THEN 1 END) as operations')
    )
    .first();

  res.json({
    period,
    userGrowth: userGrowth.rows.map(row => ({
      date: row.date,
      newUsers: parseInt(row.new_users),
      cumulativeUsers: parseInt(row.cumulative_users)
    })),
    revenue: {
      daily: revenueData.map(row => ({
        date: row.date,
        revenue: parseFloat(row.daily_revenue || 0),
        subscriptions: parseInt(row.new_subscriptions || 0)
      })),
      total: revenueData.reduce((sum, row) => sum + parseFloat(row.daily_revenue || 0), 0)
    },
    operations: {
      total: parseInt(operationStats.total_operations || 0),
      completed: parseInt(operationStats.completed_operations || 0),
      pending: parseInt(operationStats.pending_operations || 0),
      failed: parseInt(operationStats.failed_operations || 0),
      avgProfit: parseFloat(operationStats.avg_profit || 0)
    },
    topUsers: activeUsers.map(user => ({
      name: user.name,
      email: user.email,
      operations: parseInt(user.operations_count),
      profit: parseFloat(user.total_profit || 0)
    })),
    exchanges: exchangeStats.map(ex => ({
      name: ex.exchange || 'Unknown',
      operations: parseInt(ex.operations),
      profit: parseFloat(ex.total_profit || 0)
    })),
    health: {
      errors: parseInt(healthMetrics.errors || 0),
      logins: parseInt(healthMetrics.logins || 0),
      operations: parseInt(healthMetrics.operations || 0),
      uptime: process.uptime()
    }
  });
});

// Get real-time metrics
export const getRealTimeMetrics = handleAsyncError(async (req, res) => {
  // Current active operations
  const activeOperations = await db('cointars')
    .where('status', 'pending')
    .count('* as count')
    .first();

  // Operations in last hour
  const recentOperations = await db('cointars')
    .where('created_at', '>=', db.raw('CURRENT_TIMESTAMP - INTERVAL \'1 hour\''))
    .count('* as count')
    .first();

  // Current online users (approximate)
  const activeUsers = await db('users')
    .where('last_login', '>=', db.raw('CURRENT_TIMESTAMP - INTERVAL \'15 minutes\''))
    .count('* as count')
    .first();

  // System performance
  const systemMetrics = {
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    uptime: process.uptime()
  };

  // Database performance
  const dbMetrics = await db.raw(`
    SELECT 
      COUNT(*) as active_connections,
      SUM(CASE WHEN state = 'active' THEN 1 ELSE 0 END) as active_queries
    FROM pg_stat_activity
  `);

  res.json({
    timestamp: new Date(),
    operations: {
      active: parseInt(activeOperations.count),
      lastHour: parseInt(recentOperations.count)
    },
    users: {
      online: parseInt(activeUsers.count)
    },
    system: {
      memory: {
        used: systemMetrics.memoryUsage.heapUsed,
        total: systemMetrics.memoryUsage.heapTotal,
        external: systemMetrics.memoryUsage.external
      },
      uptime: systemMetrics.uptime,
      database: {
        connections: parseInt(dbMetrics.rows[0]?.active_connections || 0),
        activeQueries: parseInt(dbMetrics.rows[0]?.active_queries || 0)
      }
    }
  });
});

// Routes
router.get('/user', getUserAnalytics);
router.get('/system', getSystemAnalytics);
router.get('/realtime', getRealTimeMetrics);

export default router;
