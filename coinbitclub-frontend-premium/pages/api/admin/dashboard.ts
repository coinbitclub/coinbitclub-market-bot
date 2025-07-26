import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../src/lib/database-real';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Coletando dados reais do dashboard admin...');

    // 1. Status dos usuários
    const usersStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month,
        SUM(balance_total) as total_balance
      FROM users
    `);

    // 2. Operações trading em tempo real
    const tradingOperations = await query(`
      SELECT 
        COUNT(*) as total_operations,
        COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_operations,
        COUNT(CASE WHEN status = 'CLOSED' AND profit_loss > 0 THEN 1 END) as profitable_operations,
        AVG(profit_loss) as avg_profit_loss,
        SUM(profit_loss) as total_profit_loss
      FROM trade_operations 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);

    // 3. Últimas operações abertas
    const recentOperations = await query(`
      SELECT 
        o.id,
        o.symbol,
        o.side,
        o.quantity,
        o.entry_price,
        o.current_price,
        o.profit_loss,
        o.status,
        o.created_at,
        u.email as user_email,
        u.name as user_name
      FROM trade_operations o
      JOIN users u ON o.user_id = u.id
      WHERE o.status = 'OPEN'
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    // 4. Métricas de sinais (Decision Engine)
    const signalMetrics = await query(`
      SELECT 
        COUNT(*) as total_signals,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as processed_signals,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_signals,
        AVG(confidence) as avg_confidence
      FROM signal_processing_queue 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);

    // 5. Últimos sinais processados
    const recentSignals = await query(`
      SELECT 
        s.id,
        s.symbol,
        s.action,
        s.source,
        s.price,
        s.created_at,
        q.confidence,
        q.status as processing_status
      FROM trading_signals s
      LEFT JOIN signal_processing_queue q ON s.id = q.signal_id
      ORDER BY s.created_at DESC
      LIMIT 10
    `);

    // 6. Comissões de afiliados
    const affiliateMetrics = await query(`
      SELECT 
        COUNT(DISTINCT a.id) as total_affiliates,
        COUNT(DISTINCT a.user_id) as active_affiliates,
        SUM(c.amount) as total_commissions,
        SUM(CASE WHEN c.status = 'PENDING' THEN c.amount ELSE 0 END) as pending_commissions
      FROM affiliates a
      LEFT JOIN commissions c ON a.id = c.affiliate_id
      WHERE c.created_at >= NOW() - INTERVAL '30 days' OR c.created_at IS NULL
    `);

    // 7. Métricas de sistema (microserviços)
    const systemMetrics = await query(`
      SELECT 
        service_name,
        status,
        last_heartbeat,
        response_time_ms,
        error_count
      FROM system_health
      ORDER BY last_heartbeat DESC
    `);

    // 8. Market data recente
    const marketData = await query(`
      SELECT 
        symbol,
        price,
        change_24h,
        volume_24h,
        updated_at
      FROM market_data
      WHERE updated_at >= NOW() - INTERVAL '1 hour'
      ORDER BY volume_24h DESC
      LIMIT 10
    `);

    // 9. AI Reports recentes
    const aiReports = await query(`
      SELECT 
        id,
        report_type,
        summary,
        confidence_score,
        market_sentiment,
        recommendations,
        created_at
      FROM ai_reports
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // 10. Métricas financeiras
    const financialMetrics = await query(`
      SELECT 
        SUM(CASE WHEN type = 'DEPOSIT' THEN amount ELSE 0 END) as total_deposits,
        SUM(CASE WHEN type = 'WITHDRAWAL' THEN amount ELSE 0 END) as total_withdrawals,
        COUNT(CASE WHEN type = 'SUBSCRIPTION' AND status = 'completed' THEN 1 END) as active_subscriptions,
        SUM(CASE WHEN type = 'SUBSCRIPTION' AND created_at >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END) as monthly_revenue
      FROM payments
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    // Construir resposta consolidada
    const dashboardData = {
      timestamp: new Date().toISOString(),
      users: {
        total: parseInt(usersStats.rows[0].total_users) || 0,
        active: parseInt(usersStats.rows[0].active_users) || 0,
        newThisMonth: parseInt(usersStats.rows[0].new_users_month) || 0,
        totalBalance: parseFloat(usersStats.rows[0].total_balance) || 0
      },
      trading: {
        totalOperations: parseInt(tradingOperations.rows[0].total_operations) || 0,
        openOperations: parseInt(tradingOperations.rows[0].open_operations) || 0,
        profitableOperations: parseInt(tradingOperations.rows[0].profitable_operations) || 0,
        avgProfitLoss: parseFloat(tradingOperations.rows[0].avg_profit_loss) || 0,
        totalProfitLoss: parseFloat(tradingOperations.rows[0].total_profit_loss) || 0,
        recentOperations: recentOperations.rows || []
      },
      signals: {
        total: parseInt(signalMetrics.rows[0].total_signals) || 0,
        processed: parseInt(signalMetrics.rows[0].processed_signals) || 0,
        pending: parseInt(signalMetrics.rows[0].pending_signals) || 0,
        avgConfidence: parseFloat(signalMetrics.rows[0].avg_confidence) || 0,
        recentSignals: recentSignals.rows || []
      },
      affiliates: {
        total: parseInt(affiliateMetrics.rows[0].total_affiliates) || 0,
        active: parseInt(affiliateMetrics.rows[0].active_affiliates) || 0,
        totalCommissions: parseFloat(affiliateMetrics.rows[0].total_commissions) || 0,
        pendingCommissions: parseFloat(affiliateMetrics.rows[0].pending_commissions) || 0
      },
      system: {
        services: systemMetrics.rows || [],
        marketData: marketData.rows || []
      },
      ai: {
        reports: aiReports.rows || []
      },
      financial: {
        totalDeposits: parseFloat(financialMetrics.rows[0].total_deposits) || 0,
        totalWithdrawals: parseFloat(financialMetrics.rows[0].total_withdrawals) || 0,
        activeSubscriptions: parseInt(financialMetrics.rows[0].active_subscriptions) || 0,
        monthlyRevenue: parseFloat(financialMetrics.rows[0].monthly_revenue) || 0
      }
    };

    console.log('✅ Dashboard data coletado com sucesso');
    return res.status(200).json(dashboardData);

  } catch (error) {
    console.error('❌ Erro ao coletar dados do dashboard:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
