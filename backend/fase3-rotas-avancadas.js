// 🚀 FASE 3 - ROTAS AVANÇADAS SISTEMA CRÉDITO TESTE
// APIs administrativas avançadas com analytics, bulk operations e relatórios

const express = require('express');'
const { TestCreditSystemAdvanced } = require('./fase3-implementacao');'

// Função para criar as rotas avançadas da Fase 3
function createAdvancedTestCreditRoutes(pool, monitoring, authenticateAdmin) {
  const router = express.Router();
  const testCreditSystem = new TestCreditSystemAdvanced(pool, monitoring);

  // ===== ANALYTICS AVANÇADO =====

  // 📊 Analytics Dashboard - Métricas avançadas
  router.get('/analytics/:timeframe?', authenticateAdmin, async (req, res) => {'
    try {
      const { timeframe = '7d' } = req.params;'
      const validTimeframes = ['1d', '7d', '30d', '90d'];'
      
      if (!validTimeframes.includes(timeframe)) {
        return res.status(400).json({
          success: false,
          error: 'Timeframe deve ser: 1d, 7d, 30d ou 90d','
          valid_options: validTimeframes
        });
      }

      console.log(`📊 [FASE 3] Analytics dashboard - timeframe: ${timeframe}`);
      
      const analytics = await testCreditSystem.getAdvancedAnalytics(timeframe);
      
      monitoring.logAdminAction('analytics_view', req.user.id, { timeframe });'
      
      res.json({
        success: true,
        timeframe,
        analytics,
        generated_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro analytics avançado:', error);'
      monitoring.createAlert('ANALYTICS_ERROR', `Erro no analytics: ${error.message}`, { timeframe: req.params.timeframe });'
      res.status(500).json({
        success: false,
        error: 'Erro interno no analytics''
      });
    }
  });

  // 📈 Métricas em tempo real
  router.get('/metrics/realtime', authenticateAdmin, async (req, res) => {'
    try {
      console.log(`📈 [FASE 3] Métricas em tempo real`);

      const realTimeQuery = `
        WITH recent_activity AS (
          SELECT 
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as last_hour,'
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h,'
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7d'
          FROM test_credits
        ),
        active_users AS (
          SELECT COUNT(DISTINCT user_id) as count
          FROM test_credits 
          WHERE created_at >= NOW() - INTERVAL '24 hours''
        ),
        system_health AS (
          SELECT 
            COUNT(*) as total_users_with_balance
          FROM user_balances 
          WHERE test_credit_balance > 0
        )
        SELECT 
          ra.*,
          au.count as active_users_24h,
          sh.total_users_with_balance
        FROM recent_activity ra
        CROSS JOIN active_users au
        CROSS JOIN system_health sh
      `;

      const result = await pool.query(realTimeQuery);
      const metrics = result.rows[0];

      res.json({
        success: true,
        realtime_metrics: {
          credits_granted: {
            last_hour: parseInt(metrics.last_hour || 0),
            last_24h: parseInt(metrics.last_24h || 0),
            last_7d: parseInt(metrics.last_7d || 0)
          },
          active_users_24h: parseInt(metrics.active_users_24h || 0),
          users_with_balance: parseInt(metrics.total_users_with_balance || 0),
          system_status: 'operational','
          last_updated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Erro métricas tempo real:', error);'
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar métricas em tempo real''
      });
    }
  });

  // ===== BULK OPERATIONS =====

  // 🎯 Liberação em lote
  router.post('/bulk-grant', authenticateAdmin, async (req, res) => {'
    try {
      const { grants, dry_run = false } = req.body;

      if (!grants || !Array.isArray(grants) || grants.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Array de grants é obrigatório e não pode estar vazio''
        });
      }

      if (grants.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Máximo de 100 grants por lote''
        });
      }

      console.log(`🎯 [FASE 3] Bulk grant - ${grants.length} grants, dry_run: ${dry_run}`);

      // Validar estrutura de cada grant
      const errors = [];
      grants.forEach((grant, index) => {
        if (!grant.user_id) errors.push(`Grant ${index + 1}: user_id obrigatório`);
        if (!grant.amount || grant.amount <= 0) errors.push(`Grant ${index + 1}: amount inválido`);
        if (!grant.notes || grant.notes.length < 5) errors.push(`Grant ${index + 1}: notes muito curta`);
        if (grant.amount > 1000) errors.push(`Grant ${index + 1}: amount máximo R$ 1.000`);
      });

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Validação falhou','
          details: errors
        });
      }

      if (dry_run) {
        // Simular operação
        res.json({
          success: true,
          dry_run: true,
          summary: {
            total_grants: grants.length,
            total_amount: grants.reduce((sum, g) => sum + g.amount, 0),
            estimated_time: `${grants.length * 0.5}s`
          },
          message: 'Simulação concluída. Use dry_run=false para executar.''
        });
      } else {
        const result = await testCreditSystem.bulkGrantCredits(grants, req.user.id);
        
        monitoring.logAdminAction('bulk_grant', req.user.id, { '
          total: grants.length, 
          success_count: result.success_count 
        });

        res.json({
          success: result.success,
          bulk_operation: result
        });
      }

    } catch (error) {
      console.error('❌ Erro bulk grant:', error);'
      res.status(500).json({
        success: false,
        error: 'Erro interno na operação em lote''
      });
    }
  });

  // ===== RELATÓRIOS AVANÇADOS =====

  // 📋 Relatório personalizado
  router.post('/reports/custom', authenticateAdmin, async (req, res) => {'
    try {
      const filters = req.body;
      
      console.log(`📋 [FASE 3] Relatório personalizado:`, filters);

      const report = await testCreditSystem.generateAdvancedReport(filters);
      
      monitoring.logAdminAction('custom_report', req.user.id, { filters });'

      res.json({
        success: true,
        report
      });

    } catch (error) {
      console.error('❌ Erro relatório personalizado:', error);'
      res.status(500).json({
        success: false,
        error: 'Erro ao gerar relatório personalizado''
      });
    }
  });

  // 📄 Exportar relatório (CSV/Excel)
  router.get('/reports/export/:format', authenticateAdmin, async (req, res) => {'
    try {
      const { format } = req.params;
      const filters = req.query;

      if (!['csv', 'excel'].includes(format)) {'
        return res.status(400).json({
          success: false,
          error: 'Formato deve ser csv ou excel''
        });
      }

      console.log(`📄 [FASE 3] Exportar relatório - formato: ${format}`);

      const report = await testCreditSystem.generateAdvancedReport(filters);
      
      if (format === 'csv') {'
        const csv = convertToCSV(report.data);
        res.setHeader('Content-Type', 'text/csv');'
        res.setHeader('Content-Disposition', `attachment; filename="test-credits-${Date.now()}.csv"`);"
        res.send(csv);
      } else {
        // Para Excel, retornar dados estruturados que o frontend pode processar
        res.json({
          success: true,
          format: 'excel','
          data: report.data,
          filename: `test-credits-${Date.now()}.xlsx`,
          summary: report.summary
        });
      }

      monitoring.logAdminAction('export_report', req.user.id, { format, filters });'

    } catch (error) {
      console.error('❌ Erro exportar relatório:', error);'
      res.status(500).json({
        success: false,
        error: 'Erro ao exportar relatório''
      });
    }
  });

  // ===== VALIDAÇÃO E MANUTENÇÃO =====

  // 🔍 Validação integridade do sistema
  router.get('/system/integrity', authenticateAdmin, async (req, res) => {'
    try {
      console.log(`🔍 [FASE 3] Validação integridade do sistema`);

      const integrity = await testCreditSystem.validateSystemIntegrity();
      
      monitoring.logAdminAction('system_check', req.user.id, { status: integrity.overall_status });'

      if (integrity.overall_status !== 'HEALTHY') {'
        monitoring.createAlert('SYSTEM_INTEGRITY', 'Problemas de integridade detectados', integrity);'
      }

      res.json({
        success: true,
        integrity
      });

    } catch (error) {
      console.error('❌ Erro validação integridade:', error);'
      res.status(500).json({
        success: false,
        error: 'Erro ao validar integridade do sistema''
      });
    }
  });

  // 🛠️ Manutenção automática
  router.post('/system/maintenance', authenticateAdmin, async (req, res) => {'
    try {
      const { action, params = {} } = req.body;
      
      console.log(`🛠️ [FASE 3] Manutenção - ação: ${action}`);

      const validActions = ['cleanup_expired', 'recalculate_balances', 'optimize_indexes'];'
      
      if (!validActions.includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Ação inválida','
          valid_actions: validActions
        });
      }

      let result = {};

      switch (action) {
        case 'cleanup_expired':'
          result = await performCleanupExpired(pool, params);
          break;
        case 'recalculate_balances':'
          result = await recalculateBalances(pool, params);
          break;
        case 'optimize_indexes':'
          result = await optimizeIndexes(pool, params);
          break;
      }

      monitoring.logAdminAction('maintenance', req.user.id, { action, result });'

      res.json({
        success: true,
        action,
        result
      });

    } catch (error) {
      console.error('❌ Erro manutenção:', error);'
      res.status(500).json({
        success: false,
        error: 'Erro na operação de manutenção''
      });
    }
  });

  return router;
}

// ===== FUNÇÕES AUXILIARES =====

function convertToCSV(data) {
  if (!data || data.length === 0) return '';'
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];'
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;"
    });
    csvRows.push(values.join(','));'
  });
  
  return csvRows.join('\n');'
}

async function performCleanupExpired(pool, params) {
  const { days_threshold = 90 } = params;
  
  const result = await pool.query(`
    DELETE FROM test_credits 
    WHERE created_at < NOW() - INTERVAL '${days_threshold} days''
      AND id NOT IN (
        SELECT DISTINCT tc.id 
        FROM test_credits tc
        JOIN user_balances ub ON tc.user_id = ub.user_id
        WHERE ub.test_credit_balance > 0 OR ub.test_credit_used > 0
      )
  `);

  return {
    action: 'cleanup_expired','
    deleted_records: result.rowCount,
    threshold_days: days_threshold
  };
}

async function recalculateBalances(pool, params) {
  // Recalcular saldos baseado nos créditos concedidos e operações
  const result = await pool.query(`
    UPDATE user_balances 
    SET 
      test_credit_balance = COALESCE(granted.total, 0) - COALESCE(used.total, 0),
      test_credit_used = COALESCE(used.total, 0)
    FROM (
      SELECT user_id, SUM(amount) as total 
      FROM test_credits 
      GROUP BY user_id
    ) granted
    LEFT JOIN (
      SELECT user_id, SUM(test_credit_used) as total 
      FROM operations 
      WHERE is_test_credit_operation = true 
      GROUP BY user_id
    ) used ON granted.user_id = used.user_id
    WHERE user_balances.user_id = granted.user_id
  `);

  return {
    action: 'recalculate_balances','
    updated_records: result.rowCount
  };
}

async function optimizeIndexes(pool, params) {
  // Reindexar tabelas principais
  await pool.query('REINDEX TABLE test_credits');'
  await pool.query('REINDEX TABLE user_balances');'
  
  return {
    action: 'optimize_indexes','
    status: 'completed','
    tables: ['test_credits', 'user_balances']'
  };
}

module.exports = { createAdvancedTestCreditRoutes };
