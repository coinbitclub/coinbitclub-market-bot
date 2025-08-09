const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 9999; // Porta menos comum

// Middleware
app.use(cors());
app.use(express.json());

// Configuração PostgreSQL Railway
const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: { rejectUnauthorized: false }
});

// ===== ROTAS DE TESTE INTEGRADAS =====

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({
      status: 'healthy',
      database: 'connected',
      server_time: result.rows[0].current_time,
      message: 'API Gateway integrado ao Railway funcionando!'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Logs do sistema (Railway integrado)
app.get('/api/admin/railway/logs/railway', async (req, res) => {
  try {
    const { limit = 50, level = 'all', search = '' } = req.query;
    
    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    if (level !== 'all') {
      paramCount++;
      whereConditions.push(`level = $${paramCount}`);
      params.push(level.toUpperCase());
    }

    if (search) {
      paramCount++;
      whereConditions.push(`message ILIKE $${paramCount}`);
      params.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    paramCount++;
    params.push(limit);

    const query = `
      SELECT 
        id,
        level,
        message,
        context,
        created_at,
        COALESCE(context->>'service', 'System') as service,
        COALESCE(context->>'endpoint', '') as endpoint,
        COALESCE(context->>'method', '') as method,
        COALESCE(context->>'user_id', '') as user_id,
        COALESCE(context->>'response_time_ms', '') as response_time,
        COALESCE(context->>'ip', '') as ip
      FROM system_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount}
    `;

    const result = await pool.query(query, params);

    // Transformar para formato esperado pelo frontend
    const logs = result.rows.map(log => ({
      id: log.id.toString(),
      timestamp: new Date(log.created_at).toLocaleString('pt-BR'),
      level: log.level,
      service: log.service,
      message: log.message,
      details: log.context ? JSON.stringify(log.context, null, 2) : null,
      endpoint: log.endpoint,
      method: log.method,
      userId: log.user_id,
      responseTime: log.response_time ? parseInt(log.response_time) : null,
      ip: log.ip,
      statusCode: log.context?.status_code || null,
      userAgent: log.context?.user_agent || null
    }));

    res.json({ logs });

  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Status do sistema (Railway integrado)
app.get('/api/admin/railway/system/health-railway', async (req, res) => {
  try {
    // Verificar configurações críticas
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
      last_check: new Date()
    };

    res.json(healthStatus);

  } catch (error) {
    console.error('Erro ao verificar health:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      database: 'ERROR',
      api_gateway: 'ERROR'
    });
  }
});

// Parada de emergência (Railway integrado)
app.post('/api/admin/railway/emergency/stop-railway', async (req, res) => {
  try {
    const { reason = 'Emergency stop triggered by admin' } = req.body;
    const adminEmail = 'admin@coinbitclub.com'; // Mock admin

    // Atualizar configuração
    await pool.query(`
      INSERT INTO system_configurations (category, key, value, description)
      VALUES ('trading', 'emergency_stop_enabled', 'true', $1)
      ON CONFLICT (category, key) DO UPDATE SET
        value = 'true',
        description = $1,
        updated_at = NOW()
    `, [reason]);

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
      JSON.stringify({ stopped_by: adminEmail, timestamp: new Date() })
    ]);

    // Log da ação
    await pool.query(`
      INSERT INTO system_logs (level, message, context)
      VALUES ('ERROR', $1, $2)
    `, [
      'EMERGENCY STOP ACTIVATED',
      JSON.stringify({
        admin_email: adminEmail,
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
});

// Reiniciar trading (Railway integrado)
app.post('/api/admin/railway/emergency/restart-trading-railway', async (req, res) => {
  try {
    const adminEmail = 'admin@coinbitclub.com'; // Mock admin

    // Desativar parada de emergência
    await pool.query(`
      UPDATE system_configurations 
      SET value = 'false', updated_at = NOW()
      WHERE category = 'trading' AND key = 'emergency_stop_enabled'
    `);

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
    `, [JSON.stringify({ restarted_by: adminEmail, timestamp: new Date() })]);

    // Log da ação
    await pool.query(`
      INSERT INTO system_logs (level, message, context)
      VALUES ('INFO', $1, $2)
    `, [
      'TRADING SYSTEM RESTARTED',
      JSON.stringify({
        admin_email: adminEmail,
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
});

// Usuários (Railway integrado)
app.get('/api/admin/railway/users/railway', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereConditions.push(`(u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`);
      params.push(`%${search}%`);
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
        uf.balance as financial_balance,
        ub.available_balance,
        ub.total_deposits,
        (SELECT COUNT(*) FROM operations o WHERE o.user_id = u.id) as total_operations
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      LEFT JOIN user_financial uf ON uf.user_id = u.id
      LEFT JOIN user_balances ub ON ub.user_id = u.id AND ub.currency = 'BRL'
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const result = await pool.query(query, params);

    res.json({
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      }
    });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Alertas (Railway integrado)
app.get('/api/admin/railway/alerts/railway', async (req, res) => {
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
        created_at
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
    res.json({ alerts: result.rows });

  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
🚀 Servidor de Teste Railway API Gateway rodando!

📡 URL: http://localhost:${PORT}
🔗 Database: PostgreSQL Railway
📊 Endpoints disponíveis:

   ✅ GET  /api/health
   📋 GET  /api/admin/railway/logs/railway
   👥 GET  /api/admin/railway/users/railway  
   ⚠️ GET  /api/admin/railway/alerts/railway
   🔍 GET  /api/admin/railway/system/health-railway
   🛑 POST /api/admin/railway/emergency/stop-railway
   ▶️ POST /api/admin/railway/emergency/restart-trading-railway

🎯 Pronto para integração com frontend!
  `);
});
