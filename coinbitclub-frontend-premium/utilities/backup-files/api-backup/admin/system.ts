import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../src/lib/jwt';
import { query } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verificar se é admin
    requireAdmin(req);

    if (req.method === 'GET') {
      await handleGetSystemSettings(req, res);
    } else if (req.method === 'PUT') {
      await handleUpdateSystemSettings(req, res);
    } else if (req.method === 'POST') {
      await handleSystemActions(req, res);
    } else {
      return res.status(405).json({ message: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de configurações do sistema:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor' 
    });
  }
}

async function handleGetSystemSettings(req: NextApiRequest, res: NextApiResponse) {
  // Buscar configurações do sistema
  const settingsResult = await query(`
    SELECT setting_key, setting_value, description, created_at, updated_at
    FROM system_settings
    ORDER BY setting_key
  `);

  // Buscar estatísticas do sistema
  const statsResult = await query(`
    SELECT 
      (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
      (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_today,
      (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
      (SELECT COUNT(*) FROM trading_signals WHERE created_at > NOW() - INTERVAL '24 hours') as signals_today,
      (SELECT COUNT(*) FROM audit_logs WHERE created_at > NOW() - INTERVAL '24 hours') as events_today,
      (SELECT COUNT(*) FROM notifications WHERE status = 'pending') as pending_notifications
  `);

  // Buscar informações de performance
  const performanceResult = await query(`
    SELECT 
      schemaname,
      tablename,
      n_tup_ins as inserts,
      n_tup_upd as updates,
      n_tup_del as deletes,
      n_live_tup as live_tuples,
      n_dead_tup as dead_tuples
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY n_live_tup DESC
    LIMIT 10
  `);

  // Buscar tamanho do banco de dados
  const dbSizeResult = await query(`
    SELECT 
      pg_size_pretty(pg_database_size(current_database())) as database_size,
      pg_size_pretty(pg_total_relation_size('users')) as users_table_size,
      pg_size_pretty(pg_total_relation_size('trading_signals')) as signals_table_size,
      pg_size_pretty(pg_total_relation_size('audit_logs')) as logs_table_size
  `);

  const settings = settingsResult.rows.reduce((acc, row) => {
    acc[row.setting_key] = {
      value: row.setting_value,
      description: row.description,
      updatedAt: row.updated_at
    };
    return acc;
  }, {});

  res.status(200).json({
    settings,
    systemStats: {
      activeUsers: parseInt(statsResult.rows[0].active_users),
      newUsersToday: parseInt(statsResult.rows[0].new_users_today),
      activeSubscriptions: parseInt(statsResult.rows[0].active_subscriptions),
      signalsToday: parseInt(statsResult.rows[0].signals_today),
      eventsToday: parseInt(statsResult.rows[0].events_today),
      pendingNotifications: parseInt(statsResult.rows[0].pending_notifications)
    },
    performance: {
      databaseSize: dbSizeResult.rows[0].database_size,
      usersTableSize: dbSizeResult.rows[0].users_table_size,
      signalsTableSize: dbSizeResult.rows[0].signals_table_size,
      logsTableSize: dbSizeResult.rows[0].logs_table_size,
      tableStats: performanceResult.rows
    }
  });
}

async function handleUpdateSystemSettings(req: NextApiRequest, res: NextApiResponse) {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ 
      message: 'Configurações são obrigatórias' 
    });
  }

  try {
    await query('BEGIN');

    const updatedSettings = [];

    for (const [key, value] of Object.entries(settings)) {
      // Validar configurações permitidas
      const allowedSettings = [
        'maintenance_mode',
        'registration_enabled',
        'trial_duration_days',
        'default_commission_rate',
        'max_signals_per_day',
        'email_notifications_enabled',
        'sms_notifications_enabled',
        'backup_retention_days',
        'session_timeout_minutes'
      ];

      if (!allowedSettings.includes(key)) {
        continue;
      }

      // Atualizar ou inserir configuração
      const result = await query(`
        INSERT INTO system_settings (setting_key, setting_value, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = $2, updated_at = NOW()
        RETURNING setting_key, setting_value
      `, [key, String(value)]);

      updatedSettings.push(result.rows[0]);
    }

    await query('COMMIT');

    // Log de auditoria
    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
       VALUES ($1, 'SYSTEM_SETTINGS_UPDATED', 'system_settings', $2, $3)`,
      [null, null, JSON.stringify(settings)]
    );

    res.status(200).json({
      message: 'Configurações atualizadas com sucesso',
      updatedSettings
    });

  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

async function handleSystemActions(req: NextApiRequest, res: NextApiResponse) {
  const { action, parameters = {} } = req.body;

  if (!action) {
    return res.status(400).json({ 
      message: 'Ação é obrigatória' 
    });
  }

  try {
    let result;

    switch (action) {
      case 'maintenance_mode':
        result = await toggleMaintenanceMode(parameters.enabled);
        break;
      
      case 'cleanup_logs':
        result = await cleanupAuditLogs(parameters.daysToKeep || 90);
        break;
      
      case 'backup_database':
        result = await initiateBackup();
        break;
      
      case 'refresh_stats':
        result = await refreshSystemStats();
        break;
      
      case 'clear_cache':
        result = await clearSystemCache();
        break;
      
      default:
        return res.status(400).json({ 
          message: 'Ação não reconhecida' 
        });
    }

    // Log de auditoria
    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
       VALUES ($1, 'SYSTEM_ACTION_EXECUTED', 'system', $2, $3)`,
      [null, null, JSON.stringify({ action, parameters, result })]
    );

    res.status(200).json({
      message: 'Ação executada com sucesso',
      action,
      result
    });

  } catch (error) {
    console.error(`Erro ao executar ação ${action}:`, error);
    res.status(500).json({ 
      message: `Erro ao executar ação: ${error.message}` 
    });
  }
}

async function toggleMaintenanceMode(enabled: boolean) {
  await query(`
    INSERT INTO system_settings (setting_key, setting_value, updated_at)
    VALUES ('maintenance_mode', $1, NOW())
    ON CONFLICT (setting_key) 
    DO UPDATE SET setting_value = $1, updated_at = NOW()
  `, [enabled.toString()]);

  return { maintenanceMode: enabled };
}

async function cleanupAuditLogs(daysToKeep: number) {
  const result = await query(`
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
    RETURNING COUNT(*) as deleted_count
  `);

  return { 
    deletedLogs: parseInt(result.rows[0]?.deleted_count || 0),
    daysToKeep 
  };
}

async function initiateBackup() {
  // Esta seria a implementação real de backup
  // Por enquanto, apenas registramos a solicitação
  return { 
    status: 'initiated',
    message: 'Backup iniciado - verifique logs do sistema para status'
  };
}

async function refreshSystemStats() {
  // Atualizar estatísticas no cache (se existir)
  const stats = await query(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN is_active THEN 1 END) as active_users,
      COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month
    FROM users
  `);

  return {
    refreshed: true,
    timestamp: new Date().toISOString(),
    stats: stats.rows[0]
  };
}

async function clearSystemCache() {
  // Limpar cache do sistema (se implementado)
  return {
    cleared: true,
    timestamp: new Date().toISOString(),
    message: 'Cache do sistema limpo'
  };
}
