// 🚀 FASE 3 - IMPLEMENTAÇÃO COMPLETA SISTEMA CRÉDITO TESTE
// Sistema administrativo avançado com dashboard completo e APIs otimizadas

const express = require('express');
const { Pool } = require('pg');

class TestCreditSystemAdvanced {
  constructor(pool, monitoring) {
    this.pool = pool;
    this.monitoring = monitoring;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // ===== ANALYTICS AVANÇADO =====
  
  async getAdvancedAnalytics(timeframe = '7d') {
    const cacheKey = `analytics_${timeframe}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const periods = {
        '1d': '1 day',
        '7d': '7 days',
        '30d': '30 days',
        '90d': '90 days'
      };

      const period = periods[timeframe] || '7 days';

      // Query complexa para analytics avançado
      const analyticsQuery = `
        WITH period_stats AS (
          SELECT 
            DATE_TRUNC('day', created_at) as day,
            COUNT(*) as daily_grants,
            SUM(amount) as daily_amount,
            AVG(amount) as avg_amount,
            COUNT(DISTINCT user_id) as unique_users
          FROM test_credits 
          WHERE created_at >= NOW() - INTERVAL '${period}'
          GROUP BY DATE_TRUNC('day', created_at)
        ),
        usage_stats AS (
          SELECT 
            COUNT(CASE WHEN test_credit_used > 0 THEN 1 END) as total_users_used,
            AVG(test_credit_used) as avg_usage,
            SUM(test_credit_used) as total_used,
            SUM(test_credit_balance) as total_available
          FROM user_balances
          WHERE test_credit_balance > 0 OR test_credit_used > 0
        ),
        conversion_stats AS (
          SELECT 
            COUNT(DISTINCT o.user_id) as users_trading,
            COUNT(o.id) as total_operations,
            SUM(o.test_credit_used) as credit_traded,
            AVG(o.amount) as avg_operation
          FROM operations o
          WHERE o.is_test_credit_operation = true
            AND o.created_at >= NOW() - INTERVAL '${period}'
        )
        SELECT 
          ps.*,
          us.total_users_used,
          us.avg_usage,
          us.total_used,
          us.total_available,
          cs.users_trading,
          cs.total_operations,
          cs.credit_traded,
          cs.avg_operation
        FROM period_stats ps
        CROSS JOIN usage_stats us
        CROSS JOIN conversion_stats cs
        ORDER BY ps.day DESC
      `;

      const result = await this.pool.query(analyticsQuery);
      
      // Processar dados para gráficos
      const data = {
        timeframe,
        period_analysis: result.rows,
        summary: {
          total_grants: result.rows.reduce((sum, row) => sum + parseInt(row.daily_grants || 0), 0),
          total_amount: result.rows.reduce((sum, row) => sum + parseFloat(row.daily_amount || 0), 0),
          unique_users: new Set(result.rows.map(row => row.unique_users)).size,
          average_grant: result.rows.length > 0 ? 
            result.rows.reduce((sum, row) => sum + parseFloat(row.avg_amount || 0), 0) / result.rows.length : 0,
          conversion_rate: result.rows[0]?.users_trading && result.rows[0]?.total_users_used ?
            (result.rows[0].users_trading / result.rows[0].total_users_used * 100) : 0
        },
        usage_metrics: result.rows[0] ? {
          total_users_used: parseInt(result.rows[0].total_users_used || 0),
          avg_usage: parseFloat(result.rows[0].avg_usage || 0),
          total_used: parseFloat(result.rows[0].total_used || 0),
          total_available: parseFloat(result.rows[0].total_available || 0),
          utilization_rate: result.rows[0].total_used > 0 ? 
            (result.rows[0].total_used / (result.rows[0].total_used + result.rows[0].total_available) * 100) : 0
        } : null,
        trading_metrics: result.rows[0] ? {
          users_trading: parseInt(result.rows[0].users_trading || 0),
          total_operations: parseInt(result.rows[0].total_operations || 0),
          credit_traded: parseFloat(result.rows[0].credit_traded || 0),
          avg_operation: parseFloat(result.rows[0].avg_operation || 0)
        } : null
      };

      // Cache dos resultados
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('❌ Erro analytics avançado:', error);
      throw error;
    }
  }

  // ===== BULK OPERATIONS =====

  async bulkGrantCredits(grants, adminId) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const grant of grants) {
        try {
          const result = await client.query(
            'SELECT admin_grant_test_credit($1, $2, $3, $4, $5) as result',
            [grant.user_id, adminId, grant.amount, grant.currency, grant.notes]
          );
          
          results.push({
            user_id: grant.user_id,
            success: true,
            result: result.rows[0].result
          });
          successCount++;
        } catch (error) {
          results.push({
            user_id: grant.user_id,
            success: false,
            error: error.message
          });
          errorCount++;
        }
      }

      if (errorCount === 0) {
        await client.query('COMMIT');
      } else {
        await client.query('ROLLBACK');
      }

      return {
        success: errorCount === 0,
        total: grants.length,
        success_count: successCount,
        error_count: errorCount,
        results
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ===== RELATÓRIOS AVANÇADOS =====

  async generateAdvancedReport(filters = {}) {
    try {
      const {
        start_date,
        end_date,
        user_type = 'all',
        currency = 'all',
        include_usage = true,
        include_trading = true
      } = filters;

      let whereClause = '1=1';
      const params = [];

      if (start_date) {
        whereClause += ` AND tc.created_at >= $${params.length + 1}`;
        params.push(start_date);
      }

      if (end_date) {
        whereClause += ` AND tc.created_at <= $${params.length + 1}`;
        params.push(end_date);
      }

      if (currency !== 'all') {
        whereClause += ` AND tc.currency = $${params.length + 1}`;
        params.push(currency);
      }

      const reportQuery = `
        WITH credit_stats AS (
          SELECT 
            tc.*,
            u.name,
            u.email,
            u.country_code,
            u.created_at as user_registered_at,
            ub.test_credit_balance,
            ub.test_credit_used,
            CASE 
              WHEN ub.test_credit_used > 0 THEN 'used'
              WHEN ub.test_credit_balance > 0 THEN 'available'
              ELSE 'expired'
            END as credit_status
          FROM test_credits tc
          JOIN users u ON tc.user_id = u.id
          LEFT JOIN user_balances ub ON u.id = ub.user_id
          WHERE ${whereClause}
        )${include_trading ? `,
        trading_stats AS (
          SELECT 
            o.user_id,
            COUNT(*) as operations_count,
            SUM(o.test_credit_used) as total_credit_used_trading,
            AVG(o.amount) as avg_operation_amount,
            MAX(o.created_at) as last_operation
          FROM operations o
          WHERE o.is_test_credit_operation = true
          GROUP BY o.user_id
        )` : ''}
        SELECT 
          cs.*,
          ${include_trading ? `
          ts.operations_count,
          ts.total_credit_used_trading,
          ts.avg_operation_amount,
          ts.last_operation
          ` : 'NULL as operations_count, NULL as total_credit_used_trading'}
        FROM credit_stats cs
        ${include_trading ? 'LEFT JOIN trading_stats ts ON cs.user_id = ts.user_id' : ''}
        ORDER BY cs.created_at DESC
      `;

      const result = await this.pool.query(reportQuery, params);
      
      // Estatísticas do relatório
      const summary = {
        total_records: result.rows.length,
        total_amount: result.rows.reduce((sum, row) => sum + parseFloat(row.amount || 0), 0),
        by_currency: {},
        by_status: {},
        by_country: {},
        usage_stats: {
          users_with_usage: result.rows.filter(row => parseFloat(row.test_credit_used || 0) > 0).length,
          total_used: result.rows.reduce((sum, row) => sum + parseFloat(row.test_credit_used || 0), 0),
          avg_usage_rate: 0
        }
      };

      // Agrupar por moeda
      result.rows.forEach(row => {
        const currency = row.currency;
        if (!summary.by_currency[currency]) {
          summary.by_currency[currency] = { count: 0, amount: 0 };
        }
        summary.by_currency[currency].count++;
        summary.by_currency[currency].amount += parseFloat(row.amount);
      });

      // Agrupar por status
      result.rows.forEach(row => {
        const status = row.credit_status;
        if (!summary.by_status[status]) {
          summary.by_status[status] = 0;
        }
        summary.by_status[status]++;
      });

      // Agrupar por país
      result.rows.forEach(row => {
        const country = row.country_code || 'unknown';
        if (!summary.by_country[country]) {
          summary.by_country[country] = 0;
        }
        summary.by_country[country]++;
      });

      return {
        filters,
        summary,
        data: result.rows,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro relatório avançado:', error);
      throw error;
    }
  }

  // ===== VALIDAÇÕES AVANÇADAS =====

  async validateSystemIntegrity() {
    try {
      const checks = [];

      // 1. Verificar consistência de saldos
      const balanceCheck = await this.pool.query(`
        SELECT 
          COUNT(*) as inconsistent_balances
        FROM user_balances ub
        WHERE ub.test_credit_balance < 0 
           OR ub.test_credit_used < 0
           OR (ub.test_credit_balance + ub.test_credit_used) > 
              (SELECT COALESCE(SUM(tc.amount), 0) FROM test_credits tc WHERE tc.user_id = ub.user_id)
      `);

      checks.push({
        name: 'Balance Consistency',
        status: parseInt(balanceCheck.rows[0].inconsistent_balances) === 0 ? 'PASS' : 'FAIL',
        details: `${balanceCheck.rows[0].inconsistent_balances} inconsistent balances found`
      });

      // 2. Verificar integridade referencial
      const referenceCheck = await this.pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM test_credits tc WHERE tc.user_id NOT IN (SELECT id FROM users)) as orphaned_credits,
          (SELECT COUNT(*) FROM user_balances ub WHERE ub.user_id NOT IN (SELECT id FROM users)) as orphaned_balances
      `);

      checks.push({
        name: 'Referential Integrity',
        status: (parseInt(referenceCheck.rows[0].orphaned_credits) === 0 && 
                parseInt(referenceCheck.rows[0].orphaned_balances) === 0) ? 'PASS' : 'FAIL',
        details: `${referenceCheck.rows[0].orphaned_credits} orphaned credits, ${referenceCheck.rows[0].orphaned_balances} orphaned balances`
      });

      // 3. Verificar funções PostgreSQL
      try {
        await this.pool.query('SELECT admin_grant_test_credit($1, $2, $3, $4, $5)', 
          ['00000000-0000-0000-0000-000000000000', 'test', 0, 'BRL', 'test']);
        checks.push({
          name: 'PostgreSQL Functions',
          status: 'PASS',
          details: 'All functions available'
        });
      } catch (funcError) {
        checks.push({
          name: 'PostgreSQL Functions',
          status: 'FAIL',
          details: funcError.message
        });
      }

      return {
        overall_status: checks.every(check => check.status === 'PASS') ? 'HEALTHY' : 'ISSUES_FOUND',
        checks,
        checked_at: new Date().toISOString()
      };

    } catch (error) {
      return {
        overall_status: 'ERROR',
        error: error.message,
        checked_at: new Date().toISOString()
      };
    }
  }
}

module.exports = { TestCreditSystemAdvanced };
