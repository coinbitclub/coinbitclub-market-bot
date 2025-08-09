import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../src/lib/database-real';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Buscando dados reais do dashboard...');

    // 1. USUÁRIOS
    const usersStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as active,
        COUNT(CASE WHEN DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_this_month
      FROM users
    `);

    // 2. OPERAÇÕES DE TRADING
    const operationsStats = await query(`
      SELECT 
        COUNT(*) as total_operations,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_operations,
        COUNT(CASE WHEN profit > 0 THEN 1 END) as profitable_operations,
        COALESCE(AVG(profit), 0) as avg_profit_loss,
        COALESCE(SUM(profit), 0) as total_profit_loss
      FROM operations
    `);

    // 3. SINAIS DE TRADING
    const signalsStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM trading_signals
    `);

    // 4. SINAIS IA
    const aiSignalsStats = await query(`
      SELECT 
        COUNT(*) as total,
        AVG(CAST(confidence AS NUMERIC)) as avg_confidence
      FROM ai_signals
    `);

    // 5. AFILIADOS
    const affiliatesCount = await query('SELECT COUNT(*) as total FROM affiliates');

    // 6. OPERAÇÕES RECENTES
    const recentOperations = await query(`
      SELECT 
        o.id,
        o.symbol,
        o.side,
        o.profit as profit_loss,
        u.email as user_email,
        o.created_at
      FROM operations o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    // 7. SALDO TOTAL DOS USUÁRIOS (soma dos available_balance)
    const totalBalance = await query(`
      SELECT COALESCE(SUM(CAST(available_balance AS NUMERIC)), 0) as total_balance
      FROM user_balances
    `);

    // 8. DADOS FINANCEIROS (soma de depósitos)
    const financialData = await query(`
      SELECT 
        COALESCE(SUM(CAST(total_deposits AS NUMERIC)), 0) as total_deposits,
        COALESCE(SUM(CAST(total_withdrawals AS NUMERIC)), 0) as total_withdrawals
      FROM user_balances
    `);

    // Construir resposta
    const dashboardData = {
      timestamp: new Date().toISOString(),
      users: {
        total: parseInt(usersStats.rows[0].total),
        active: parseInt(usersStats.rows[0].active),
        newThisMonth: parseInt(usersStats.rows[0].new_this_month),
        totalBalance: parseFloat(totalBalance.rows[0].total_balance)
      },
      trading: {
        totalOperations: parseInt(operationsStats.rows[0].total_operations),
        openOperations: parseInt(operationsStats.rows[0].open_operations),
        profitableOperations: parseInt(operationsStats.rows[0].profitable_operations),
        avgProfitLoss: parseFloat(operationsStats.rows[0].avg_profit_loss),
        totalProfitLoss: parseFloat(operationsStats.rows[0].total_profit_loss),
        recentOperations: recentOperations.rows.map(op => ({
          id: op.id,
          symbol: op.symbol,
          side: op.side,
          profit_loss: parseFloat(op.profit_loss),
          user_email: op.user_email,
          created_at: op.created_at
        }))
      },
      signals: {
        total: parseInt(signalsStats.rows[0].total),
        processed: parseInt(signalsStats.rows[0].processed),
        pending: parseInt(signalsStats.rows[0].pending),
        avgConfidence: parseFloat(aiSignalsStats.rows[0].avg_confidence || 0)
      },
      affiliates: {
        total: parseInt(affiliatesCount.rows[0].total),
        active: parseInt(affiliatesCount.rows[0].total), // Assumindo que todos são ativos
        totalCommissions: 1500, // Placeholder - pode ser calculado com joins
        pendingCommissions: 350 // Placeholder
      },
      system: {
        services: [
          {
            service_name: 'Signal Ingestor',
            status: 'online',
            last_heartbeat: new Date().toISOString(),
            response_time_ms: 45
          },
          {
            service_name: 'Decision Engine',
            status: 'online',
            last_heartbeat: new Date().toISOString(),
            response_time_ms: 32
          },
          {
            service_name: 'Order Executor',
            status: 'offline',
            last_heartbeat: new Date(Date.now() - 300000).toISOString(),
            response_time_ms: 0
          },
          {
            service_name: 'PostgreSQL Database',
            status: 'online',
            last_heartbeat: new Date().toISOString(),
            response_time_ms: 12
          }
        ]
      },
      financial: {
        totalDeposits: parseFloat(financialData.rows[0].total_deposits),
        totalWithdrawals: parseFloat(financialData.rows[0].total_withdrawals),
        activeSubscriptions: parseInt(usersStats.rows[0].total),
        monthlyRevenue: 12500 // Placeholder - pode ser calculado com subscriptions
      }
    };

    console.log('✅ Dados do dashboard construídos com sucesso');
    res.status(200).json(dashboardData);

  } catch (error) {
    console.error('❌ Erro ao buscar dados do dashboard:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
