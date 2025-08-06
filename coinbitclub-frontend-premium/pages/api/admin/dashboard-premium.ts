import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../src/lib/database';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token de acesso necessário' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    if (decoded.userType !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado - apenas administradores' });
    }

    console.log('📊 Fetching admin dashboard data...');

    // 1. LEITURA DO MERCADO (últimos indicadores)
    const marketReading = await query(`
      SELECT 
        direction,
        confidence,
        ai_justification,
        day_tracking,
        market_data,
        created_at
      FROM market_readings 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    // 2. SINAIS TRADINGVIEW (últimos 10)
    const signals = await query(`
      SELECT 
        ticker,
        timestamp_signal,
        close_price,
        rsi_4h,
        rsi_15,
        cruzou_acima_ema9,
        cruzou_abaixo_ema9,
        processed,
        created_at
      FROM tradingview_signals 
      ORDER BY timestamp_signal DESC 
      LIMIT 10
    `);

    // 3. RELATÓRIOS IA 4H (últimos)
    const aiReports = await query(`
      SELECT 
        id,
        analysis_type,
        decision,
        confidence_score,
        risk_level,
        reasoning,
        created_at
      FROM ai_analysis_real 
      WHERE created_at >= NOW() - INTERVAL '4 hours'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // 4. OPERAÇÕES EM ANDAMENTO
    const activeOperations = await query(`
      SELECT 
        o.id,
        o.symbol,
        o.side,
        o.entry_price,
        o.quantity,
        o.leverage,
        o.status,
        o.exchange,
        o.environment,
        o.opened_at,
        u.name as user_name,
        u.email as user_email
      FROM operations o
      JOIN users u ON u.id = o.user_id
      WHERE o.status IN ('OPEN', 'PENDING')
      ORDER BY o.opened_at DESC
      LIMIT 20
    `);

    // 5. ASSERTIVIDADE E RETORNO (hoje e histórico)
    const todayStats = await query(`
      SELECT 
        COUNT(*) as total_operations,
        COUNT(CASE WHEN profit > 0 THEN 1 END) as winning_operations,
        SUM(profit) as total_profit,
        AVG(profit) as avg_profit,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as completed_operations
      FROM operations 
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    const historicalStats = await query(`
      SELECT 
        COUNT(*) as total_operations,
        COUNT(CASE WHEN profit > 0 THEN 1 END) as winning_operations,
        SUM(profit) as total_profit,
        AVG(profit) as avg_profit
      FROM operations 
      WHERE status = 'closed'
    `);

    // 6. MÉTRICAS DE USUÁRIOS
    const userMetrics = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as new_users_today,
        COUNT(CASE WHEN user_type = 'user' AND status = 'trial_active' THEN 1 END) as trial_users,
        COUNT(CASE WHEN user_type = 'user' AND status IN ('active', 'premium_active') THEN 1 END) as production_users
      FROM users
    `);

    // 7. MÉTRICAS DE AFILIADOS
    const affiliateMetrics = await query(`
      SELECT 
        COUNT(DISTINCT a.user_id) as total_affiliates,
        COUNT(DISTINCT a.user_id) FILTER (WHERE a.is_active = true) as active_affiliates,
        COALESCE(SUM(ac.commission_usd), 0) as total_commissions,
        COALESCE(SUM(ac.commission_usd) FILTER (WHERE DATE(ac.created_at) = CURRENT_DATE), 0) as today_commissions
      FROM affiliates a
      LEFT JOIN affiliate_commissions ac ON ac.affiliate_id = a.user_id
    `);

    // 8. SISTEMA E MICROSERVIÇOS
    const systemStatus = await query(`
      SELECT 
        service_name,
        is_active,
        last_successful_request,
        error_count_today,
        service_type
      FROM api_configurations
      ORDER BY service_name
    `);

    // 9. ALERTAS CRÍTICOS
    const criticalAlerts = await query(`
      SELECT 
        title,
        message,
        severity,
        category,
        created_at,
        is_resolved
      FROM system_monitoring_alerts 
      WHERE severity IN ('CRITICAL', 'HIGH') 
        AND is_resolved = false
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // 10. EVOLUÇÃO DOS INDICADORES (últimos 7 dias)
    const evolutionData = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as operations_count,
        SUM(profit) as daily_profit,
        COUNT(CASE WHEN profit > 0 THEN 1 END) as winning_count
      FROM operations 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Montar resposta
    const dashboardData = {
      timestamp: new Date().toISOString(),
      
      // Leitura do mercado
      marketReading: marketReading.rows[0] || {
        direction: 'NEUTRO',
        confidence: 50,
        ai_justification: 'Aguardando dados de mercado',
        day_tracking: 'Monitoramento iniciado',
        market_data: {}
      },

      // Sinais e microserviços
      signals: {
        tradingview: signals.rows,
        constant_signals: signals.rows.filter(s => s.processed).length,
        ai_reports: aiReports.rows,
        microservices_status: {
          signal_ingestor: systemStatus.rows.find(s => s.service_name.includes('TRADINGVIEW'))?.is_active || false,
          signal_processor: true, // Assumindo ativo baseado nos dados
          decision_engine: aiReports.rows.length > 0,
          order_executor: activeOperations.rows.length > 0
        }
      },

      // Operações em tempo real
      operations: {
        active: activeOperations.rows,
        count: activeOperations.rows.length,
        by_status: {
          open: activeOperations.rows.filter(op => op.status === 'OPEN').length,
          pending: activeOperations.rows.filter(op => op.status === 'PENDING').length
        }
      },

      // Assertividade e performance
      performance: {
        today: {
          total_operations: parseInt(todayStats.rows[0]?.total_operations || '0'),
          winning_operations: parseInt(todayStats.rows[0]?.winning_operations || '0'),
          success_rate: todayStats.rows[0]?.total_operations > 0 
            ? ((todayStats.rows[0]?.winning_operations / todayStats.rows[0]?.total_operations) * 100).toFixed(2)
            : '0.00',
          total_profit: parseFloat(todayStats.rows[0]?.total_profit || '0'),
          avg_profit: parseFloat(todayStats.rows[0]?.avg_profit || '0')
        },
        historical: {
          total_operations: parseInt(historicalStats.rows[0]?.total_operations || '0'),
          winning_operations: parseInt(historicalStats.rows[0]?.winning_operations || '0'),
          success_rate: historicalStats.rows[0]?.total_operations > 0 
            ? ((historicalStats.rows[0]?.winning_operations / historicalStats.rows[0]?.total_operations) * 100).toFixed(2)
            : '0.00',
          total_profit: parseFloat(historicalStats.rows[0]?.total_profit || '0'),
          avg_profit: parseFloat(historicalStats.rows[0]?.avg_profit || '0')
        }
      },

      // Métricas de usuários
      users: {
        total: parseInt(userMetrics.rows[0]?.total_users || '0'),
        active: parseInt(userMetrics.rows[0]?.active_users || '0'),
        new_today: parseInt(userMetrics.rows[0]?.new_users_today || '0'),
        trial_active: parseInt(userMetrics.rows[0]?.trial_users || '0'),
        production_active: parseInt(userMetrics.rows[0]?.production_users || '0'),
        by_country: { brazil: 0, international: 0 }, // TODO: implementar
        by_plan: { trial: 0, basic: 0, premium: 0 } // TODO: implementar
      },

      // Métricas de afiliados
      affiliates: {
        total: parseInt(affiliateMetrics.rows[0]?.total_affiliates || '0'),
        active: parseInt(affiliateMetrics.rows[0]?.active_affiliates || '0'),
        total_commissions: parseFloat(affiliateMetrics.rows[0]?.total_commissions || '0'),
        today_commissions: parseFloat(affiliateMetrics.rows[0]?.today_commissions || '0')
      },

      // Sistema e alertas
      system: {
        status: systemStatus.rows,
        alerts: criticalAlerts.rows,
        uptime: '99.9%', // TODO: calcular real
        last_restart: null
      },

      // Evolução (gráficos)
      evolution: evolutionData.rows
    };

    console.log('✅ Admin dashboard data fetched successfully');
    res.status(200).json(dashboardData);

  } catch (error) {
    console.error('❌ Admin dashboard error:', error);
    res.status(500).json({ 
      message: 'Erro ao carregar dashboard administrativo',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
}
