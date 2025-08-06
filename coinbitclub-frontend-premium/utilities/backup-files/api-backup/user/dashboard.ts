import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateRequest } from '../../../src/lib/jwt';
import { query } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = authenticateRequest(req);

    if (req.method === 'GET') {
      await handleGetDashboard(req, res, user.userId);
    } else {
      return res.status(405).json({ message: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API do dashboard:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor' 
    });
  }
}

async function handleGetDashboard(req: NextApiRequest, res: NextApiResponse, userId: string) {
  // Buscar dados do usuário e plano
  const userResult = await query(`
    SELECT 
      u.id, u.name, u.email, u.country, u.plan_type,
      ub.prepaid_balance, ub.total_profit, ub.total_loss, 
      ub.pending_commission, ub.paid_commission,
      s.status as subscription_status, s.ends_at as subscription_ends_at
    FROM users u
    LEFT JOIN user_balances ub ON u.id = ub.user_id
    LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
    WHERE u.id = $1
  `, [userId]);

  if (userResult.rows.length === 0) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  const userData = userResult.rows[0];

  // Buscar último relatório da IA
  const latestReportResult = await query(`
    SELECT * FROM ai_reports 
    WHERE published_at IS NOT NULL
    ORDER BY created_at DESC 
    LIMIT 1
  `);

  // Buscar operações abertas
  const openOperationsResult = await query(`
    SELECT 
      to_id, exchange, symbol, type, entry_price, quantity,
      leverage, stop_loss, take_profit, opened_at,
      (quantity * entry_price) as invested_amount
    FROM trade_operations
    WHERE user_id = $1 AND status = 'open'
    ORDER BY opened_at DESC
  `, [userId]);

  // Buscar estatísticas do dia
  const todayStatsResult = await query(`
    SELECT 
      COUNT(*) as total_operations,
      COUNT(CASE WHEN result > 0 THEN 1 END) as successful_operations,
      COALESCE(SUM(CASE WHEN result > 0 THEN result ELSE 0 END), 0) as day_profit,
      COALESCE(SUM(CASE WHEN result < 0 THEN ABS(result) ELSE 0 END), 0) as day_loss,
      COALESCE(AVG(CASE WHEN result IS NOT NULL THEN 
        CASE WHEN result > 0 THEN 1 ELSE 0 END
      END) * 100, 0) as day_success_rate
    FROM trade_operations
    WHERE user_id = $1 
      AND status = 'closed'
      AND DATE(closed_at) = CURRENT_DATE
  `, [userId]);

  // Buscar estatísticas históricas
  const historicalStatsResult = await query(`
    SELECT 
      COUNT(*) as total_operations,
      COUNT(CASE WHEN result > 0 THEN 1 END) as successful_operations,
      COALESCE(SUM(result), 0) as net_result,
      COALESCE(AVG(CASE WHEN result IS NOT NULL THEN 
        CASE WHEN result > 0 THEN 1 ELSE 0 END
      END) * 100, 0) as overall_success_rate,
      MAX(result) as best_result,
      MIN(result) as worst_result
    FROM trade_operations
    WHERE user_id = $1 AND status = 'closed'
  `, [userId]);

  // Buscar estatísticas mensais (últimos 6 meses)
  const monthlyStatsResult = await query(`
    SELECT 
      DATE_TRUNC('month', closed_at) as month,
      COUNT(*) as operations,
      COALESCE(SUM(result), 0) as profit,
      COALESCE(AVG(CASE WHEN result IS NOT NULL THEN 
        CASE WHEN result > 0 THEN 1 ELSE 0 END
      END) * 100, 0) as success_rate
    FROM trade_operations
    WHERE user_id = $1 
      AND status = 'closed'
      AND closed_at >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', closed_at)
    ORDER BY month DESC
  `, [userId]);

  const todayStats = todayStatsResult.rows[0];
  const historicalStats = historicalStatsResult.rows[0];

  const dashboardData = {
    user: {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      country: userData.country,
      planType: userData.plan_type,
      subscriptionStatus: userData.subscription_status,
      subscriptionEndsAt: userData.subscription_ends_at
    },
    balance: {
      prepaidBalance: parseFloat(userData.prepaid_balance || 0),
      totalProfit: parseFloat(userData.total_profit || 0),
      totalLoss: parseFloat(userData.total_loss || 0),
      netResult: parseFloat(userData.total_profit || 0) - parseFloat(userData.total_loss || 0),
      pendingCommission: parseFloat(userData.pending_commission || 0),
      paidCommission: parseFloat(userData.paid_commission || 0)
    },
    latestReport: latestReportResult.rows[0] ? {
      id: latestReportResult.rows[0].id,
      title: latestReportResult.rows[0].title,
      content: latestReportResult.rows[0].content,
      marketScenario: latestReportResult.rows[0].market_scenario,
      createdAt: latestReportResult.rows[0].created_at
    } : null,
    openOperations: openOperationsResult.rows.map(op => ({
      id: op.to_id,
      exchange: op.exchange,
      symbol: op.symbol,
      type: op.type,
      entryPrice: parseFloat(op.entry_price),
      quantity: parseFloat(op.quantity),
      leverage: parseFloat(op.leverage),
      stopLoss: parseFloat(op.stop_loss),
      takeProfit: op.take_profit ? parseFloat(op.take_profit) : null,
      investedAmount: parseFloat(op.invested_amount),
      openedAt: op.opened_at
    })),
    todayStats: {
      totalOperations: parseInt(todayStats.total_operations),
      successfulOperations: parseInt(todayStats.successful_operations),
      dayProfit: parseFloat(todayStats.day_profit),
      dayLoss: parseFloat(todayStats.day_loss),
      daySuccessRate: parseFloat(todayStats.day_success_rate)
    },
    historicalStats: {
      totalOperations: parseInt(historicalStats.total_operations),
      successfulOperations: parseInt(historicalStats.successful_operations),
      netResult: parseFloat(historicalStats.net_result),
      overallSuccessRate: parseFloat(historicalStats.overall_success_rate),
      bestResult: parseFloat(historicalStats.best_result || 0),
      worstResult: parseFloat(historicalStats.worst_result || 0)
    },
    monthlyStats: monthlyStatsResult.rows.map(stat => ({
      month: stat.month,
      operations: parseInt(stat.operations),
      profit: parseFloat(stat.profit),
      successRate: parseFloat(stat.success_rate)
    }))
  };

  res.status(200).json(dashboardData);
}
