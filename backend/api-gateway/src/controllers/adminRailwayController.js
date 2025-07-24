const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

/**
 * Admin Controller Integrado ao PostgreSQL Railway
 * Sistema CoinBitClub - Integração completa em tempo real
 * 
 * Este arquivo implementa a integração direta com o banco PostgreSQL Railway
 * criado anteriormente com todas as tabelas necessárias.
 */

// Configuração da conexão com PostgreSQL Railway
const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

// Teste de conexão
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erro ao conectar ao PostgreSQL Railway:', err);
  } else {
    console.log('✅ Admin Railway Controller conectado ao PostgreSQL');
    release();
  }
});

// Middleware de autenticação admin
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Verificar se o usuário é admin
    const result = await pool.query(
      'SELECT id, email, role, name FROM users WHERE id = $1 AND role = $2',
      [decoded.userId, 'admin']
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Acesso negado - privilégios de admin requeridos' });
    }

    req.admin = result.rows[0];
    next();
  } catch (error) {
    console.error('Erro na autenticação admin:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};

// ===== LOGS DO SISTEMA INTEGRADOS =====

// Obter logs do sistema com filtros avançados
const getSystemLogsRailway = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      level = 'all',
      service = 'all',
      start_date,
      end_date,
      search = ''
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    if (level !== 'all') {
      paramCount++;
      whereConditions.push(`level = $${paramCount}`);
      params.push(level.toUpperCase());
    }

    if (start_date) {
      paramCount++;
      whereConditions.push(`created_at >= $${paramCount}`);
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      whereConditions.push(`created_at <= $${paramCount}`);
      params.push(end_date);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`message ILIKE $${paramCount}`);
      params.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    paramCount++;
    params.push(limit);
    paramCount++;
    params.push(offset);

    const query = `
      SELECT 
        id,
        level,
        message,
        context,
        created_at,
        -- Extrair informações específicas do contexto JSON
        COALESCE(context->>'service', 'system') as service,
        COALESCE(context->>'endpoint', '') as endpoint,
        COALESCE(context->>'method', '') as method,
        COALESCE(context->>'user_id', '') as user_id,
        COALESCE(context->>'response_time_ms', '') as response_time,
        COALESCE(context->>'ip', '') as ip
      FROM system_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const result = await pool.query(query, params);

    // Estatísticas por nível para os últimos logs
    const statsQuery = `
      SELECT 
        level,
        COUNT(*) as count
      FROM system_logs
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY level
    `;

    const statsResult = await pool.query(statsQuery);

    // Transformar logs para formato esperado pelo frontend
    const transformedLogs = result.rows.map(log => ({
      id: log.id,
      timestamp: new Date(log.created_at).toLocaleString('pt-BR'),
      level: log.level,
      service: log.service || 'System',
      message: log.message,
      details: log.context ? JSON.stringify(log.context, null, 2) : null,
      endpoint: log.endpoint,
      method: log.method,
      userId: log.user_id,
      responseTime: log.response_time ? parseInt(log.response_time) : null,
      ip: log.ip,
      userAgent: log.context?.user_agent || null,
      statusCode: log.context?.status_code || null
    }));

    res.json({
      logs: transformedLogs,
      statistics: statsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: transformedLogs.length
      }
    });

  } catch (error) {
    console.error('Erro ao buscar logs do Railway:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ===== USUÁRIOS INTEGRADOS =====

// Obter todos os usuários do banco Railway
const getUsersRailway = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereConditions.push(`(u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    if (role) {
      paramCount++;
      whereConditions.push(`u.role = $${paramCount}`);
      params.push(role);
    }

    if (status) {
      paramCount++;
      whereConditions.push(`u.status = $${paramCount}`);
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    paramCount++;
    params.push(limit);
    paramCount++;
    params.push(offset);

    const query = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.status,
        u.created_at,
        u.last_login_at,
        u.is_affiliate,
        up.first_name,
        up.last_name,
        up.phone,
        up.country,
        up.last_activity_at,
        uf.balance as financial_balance,
        uf.profit as financial_profit,
        uf.locked as financial_locked,
        ub.available_balance,
        ub.locked_balance,
        ub.total_deposits,
        ub.total_withdrawals,
        s.status as subscription_status,
        p.name as plan_name,
        -- Contagem de operações
        (SELECT COUNT(*) FROM operations o WHERE o.user_id = u.id) as total_operations,
        -- Lucro total
        (SELECT COALESCE(SUM(profit_usd), 0) FROM operations o WHERE o.user_id = u.id) as total_profit
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      LEFT JOIN user_financial uf ON uf.user_id = u.id
      LEFT JOIN user_balances ub ON ub.user_id = u.id AND ub.currency = 'BRL'
      LEFT JOIN subscriptions s ON s.user_id = u.id
      LEFT JOIN plans p ON p.id = s.plan_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const result = await pool.query(query, params);

    // Contagem total
    const countQuery = `SELECT COUNT(*) FROM users u ${whereClause}`;
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar usuários do Railway:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ===== ALERTAS DO SISTEMA =====

// Obter alertas ativos do sistema
const getSystemAlertsRailway = async (req, res) => {
  try {
    const { status = 'open', severity = 'all' } = req.query;

    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    if (status !== 'all') {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      params.push(status);
    }

    if (severity !== 'all') {
      paramCount++;
      whereConditions.push(`severity = $${paramCount}`);
      params.push(severity);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        id,
        title,
        message,
        severity,
        status,
        category,
        affected_service,
        metadata,
        acknowledged_by,
        acknowledged_at,
        resolved_by,
        resolved_at,
        created_at,
        updated_at
      FROM system_alerts
      ${whereClause}
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        created_at DESC
    `;

    const result = await pool.query(query, params);

    res.json({
      alerts: result.rows
    });

  } catch (error) {
    console.error('Erro ao buscar alertas do Railway:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ===== CONTROLES DE EMERGÊNCIA =====

// Parar todas as operações (Emergency Stop)
const emergencyStopOperationsRailway = async (req, res) => {
  try {
    const { reason = 'Emergency stop triggered by admin' } = req.body;

    // Atualizar configuração de parada de emergência
    await pool.query(`
      INSERT INTO system_configurations (category, key, value, description, last_modified_by)
      VALUES ('trading', 'emergency_stop_enabled', 'true', $1, $2)
      ON CONFLICT (category, key) DO UPDATE SET
        value = 'true',
        description = $1,
        last_modified_by = $2,
        updated_at = NOW()
    `, [reason, req.admin.id]);

    // Criar alerta crítico
    await pool.query(`
      INSERT INTO system_alerts (title, message, severity, category, affected_service, metadata)
      VALUES (
        'PARADA DE EMERGÊNCIA ATIVADA',
        $1,
        'critical',
        'trading',
        'order-executor',
        $2
      )
    `, [
      `Sistema de trading interrompido: ${reason}`,
      JSON.stringify({ stopped_by: req.admin.email, timestamp: new Date() })
    ]);

    // Log da ação
    await pool.query(`
      INSERT INTO system_logs (level, message, context)
      VALUES ('ERROR', $1, $2)
    `, [
      'EMERGENCY STOP ACTIVATED',
      JSON.stringify({
        admin_id: req.admin.id,
        admin_email: req.admin.email,
        reason,
        timestamp: new Date()
      })
    ]);

    res.json({ 
      message: 'Parada de emergência ativada com sucesso',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Erro na parada de emergência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Reiniciar sistema de trading
const restartTradingSystemRailway = async (req, res) => {
  try {
    // Desativar parada de emergência
    await pool.query(`
      UPDATE system_configurations 
      SET value = 'false', last_modified_by = $1, updated_at = NOW()
      WHERE category = 'trading' AND key = 'emergency_stop_enabled'
    `, [req.admin.id]);

    // Criar alerta informativo
    await pool.query(`
      INSERT INTO system_alerts (title, message, severity, category, affected_service, metadata)
      VALUES (
        'Sistema de Trading Reiniciado',
        'Trading foi reativado pelo administrador',
        'medium',
        'trading',
        'order-executor',
        $1
      )
    `, [JSON.stringify({ restarted_by: req.admin.email, timestamp: new Date() })]);

    // Log da ação
    await pool.query(`
      INSERT INTO system_logs (level, message, context)
      VALUES ('INFO', $1, $2)
    `, [
      'TRADING SYSTEM RESTARTED',
      JSON.stringify({
        admin_id: req.admin.id,
        admin_email: req.admin.email,
        timestamp: new Date()
      })
    ]);

    res.json({ 
      message: 'Sistema de trading reiniciado com sucesso',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Erro ao reiniciar trading:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ===== STATUS DO SISTEMA =====

// Obter status completo do sistema
const getSystemHealthRailway = async (req, res) => {
  try {
    // Verificar status de configurações críticas
    const configQuery = `
      SELECT key, value
      FROM system_configurations
      WHERE category = 'trading' AND key IN ('emergency_stop_enabled', 'max_leverage', 'min_position_size')
    `;

    const configResult = await pool.query(configQuery);
    
    // Verificar alertas críticos
    const alertsQuery = `
      SELECT COUNT(*) as critical_alerts
      FROM system_alerts
      WHERE severity = 'critical' AND status = 'open'
    `;

    const alertsResult = await pool.query(alertsQuery);

    // Verificar logs de erro recentes
    const errorLogsQuery = `
      SELECT COUNT(*) as recent_errors
      FROM system_logs
      WHERE level = 'ERROR' AND created_at >= NOW() - INTERVAL '1 hour'
    `;

    const errorLogsResult = await pool.query(errorLogsQuery);

    // Verificar conexão com banco
    const dbHealthQuery = `SELECT NOW() as db_time`;
    const dbHealthResult = await pool.query(dbHealthQuery);

    const configurations = {};
    configResult.rows.forEach(config => {
      configurations[config.key] = config.value;
    });

    const healthStatus = {
      database: 'ONLINE',
      api_gateway: 'ONLINE',
      trading_bot: configurations.emergency_stop_enabled === 'true' ? 'STOPPED' : 'ONLINE',
      critical_alerts: parseInt(alertsResult.rows[0].critical_alerts),
      recent_errors: parseInt(errorLogsResult.rows[0].recent_errors),
      emergency_stop: configurations.emergency_stop_enabled === 'true',
      max_leverage: configurations.max_leverage || 'NOT_SET',
      min_position_size: configurations.min_position_size || 'NOT_SET',
      db_connection_time: dbHealthResult.rows[0].db_time,
      last_check: new Date()
    };

    res.json(healthStatus);

  } catch (error) {
    console.error('Erro ao verificar status do sistema:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      database: 'ERROR',
      api_gateway: 'ERROR'
    });
  }
};

// ===== DASHBOARD FINANCEIRO =====

// Dashboard financeiro completo
const getFinancialDashboardRailway = async (req, res) => {
  try {
    const { period = '30' } = req.query;

    // Saldo da empresa
    const companyBalanceQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'entrada' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN type = 'pagamento_usuario' THEN amount ELSE 0 END), 0) as user_payments,
        COALESCE(SUM(CASE WHEN type = 'pagamento_afiliado' THEN amount ELSE 0 END), 0) as affiliate_payments,
        COALESCE(SUM(CASE WHEN type = 'reserva' THEN amount ELSE 0 END), 0) as reserved_amount,
        COALESCE(SUM(
          CASE WHEN type = 'entrada' THEN amount
               WHEN type IN ('pagamento_usuario', 'pagamento_afiliado', 'retirada_empresa', 'reserva') THEN -amount
               ELSE 0 END
        ), 0) as net_balance
      FROM company_financial
      WHERE created_at >= NOW() - INTERVAL '${period} days'
    `;

    // Operações do período
    const operationsQuery = `
      SELECT 
        COUNT(*) as total_operations,
        COALESCE(SUM(profit_usd), 0) as total_profit,
        COALESCE(AVG(profit_usd), 0) as avg_profit,
        COUNT(CASE WHEN profit_usd > 0 THEN 1 END) as profitable_operations,
        COUNT(CASE WHEN profit_usd < 0 THEN 1 END) as loss_operations
      FROM operations
      WHERE closed_at >= NOW() - INTERVAL '${period} days'
        AND status = 'closed'
    `;

    // Usuários ativos
    const activeUsersQuery = `
      SELECT 
        COUNT(DISTINCT user_id) as active_users
      FROM operations
      WHERE closed_at >= NOW() - INTERVAL '${period} days'
    `;

    // Comissões geradas
    const commissionsQuery = `
      SELECT 
        COALESCE(SUM(commission_usd), 0) as total_commissions,
        COALESCE(SUM(commission_converted), 0) as total_commissions_brl
      FROM commission_events
      WHERE created_at >= NOW() - INTERVAL '${period} days'
    `;

    const [companyBalance, operations, activeUsers, commissions] = await Promise.all([
      pool.query(companyBalanceQuery),
      pool.query(operationsQuery),
      pool.query(activeUsersQuery),
      pool.query(commissionsQuery)
    ]);

    res.json({
      period_days: parseInt(period),
      company_balance: companyBalance.rows[0],
      operations_stats: operations.rows[0],
      active_users: activeUsers.rows[0].active_users,
      commissions_stats: commissions.rows[0],
      generated_at: new Date()
    });

  } catch (error) {
    console.error('Erro ao gerar dashboard financeiro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ===== ROTAS INTEGRADAS =====

const router = express.Router();

// Aplicar middleware de autenticação (comentado para desenvolvimento)
// router.use(authenticateAdmin);

// Logs do sistema integrados
router.get('/logs/railway', getSystemLogsRailway);

// Usuários integrados
router.get('/users/railway', getUsersRailway);

// Alertas integrados
router.get('/alerts/railway', getSystemAlertsRailway);

// Controles de emergência integrados
router.post('/emergency/stop-railway', emergencyStopOperationsRailway);
router.post('/emergency/restart-trading-railway', restartTradingSystemRailway);

// Status do sistema integrado
router.get('/system/health-railway', getSystemHealthRailway);

// Dashboard financeiro integrado
router.get('/financial-dashboard-railway', getFinancialDashboardRailway);

// Endpoint de teste de conectividade
router.get('/test-railway-connection', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, COUNT(*) as user_count FROM users');
    res.json({
      status: 'connected',
      database_time: result.rows[0].current_time,
      total_users: result.rows[0].user_count,
      connection_string: 'postgresql://postgres:***@yamabiko.proxy.rlwy.net:32866/railway'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;
