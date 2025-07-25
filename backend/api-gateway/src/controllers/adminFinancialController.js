import AdminFinancialService from '../services/adminFinancialService.js';
import logger from '../../../common/logger.js';

/**
 * Controller para Extrato Financeiro da Administração
 */
export class AdminFinancialController {

  /**
   * Obter dashboard financeiro completo
   * GET /api/admin/financial/dashboard
   */
  static async getDashboard(req, res) {
    try {
      // Verificar se é admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const {
        start_date,
        end_date,
        currency = 'all'
      } = req.query;

      // Validar datas
      let startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      let endDate = end_date ? new Date(end_date) : new Date();

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Datas inválidas'
        });
      }

      if (startDate > endDate) {
        return res.status(400).json({
          success: false,
          message: 'Data de início deve ser anterior à data de fim'
        });
      }

      const dashboard = await AdminFinancialService.getAdminDashboard({
        start_date: startDate,
        end_date: endDate,
        currency
      });

      logger.info('Dashboard admin gerado', {
        adminId: req.user.id,
        period: { start_date: startDate, end_date: endDate }
      });

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      logger.error('Erro ao obter dashboard admin:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Gerar relatório de reconciliação
   * GET /api/admin/financial/reconciliation
   */
  static async getReconciliationReport(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const {
        start_date,
        end_date
      } = req.query;

      let startDate = start_date ? new Date(start_date) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      let endDate = end_date ? new Date(end_date) : new Date();

      const report = await AdminFinancialService.generateReconciliationReport(startDate, endDate);

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      logger.error('Erro ao gerar relatório de reconciliação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Exportar dados financeiros
   * GET /api/admin/financial/export
   */
  static async exportFinancialData(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const {
        start_date,
        end_date,
        format = 'json'
      } = req.query;

      if (!['json', 'csv'].includes(format)) {
        return res.status(400).json({
          success: false,
          message: 'Formato inválido. Use json ou csv'
        });
      }

      let startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      let endDate = end_date ? new Date(end_date) : new Date();

      const exportData = await AdminFinancialService.exportFinancialData(startDate, endDate, format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="financial_report_${Date.now()}.csv"`);
      }

      logger.info('Dados financeiros exportados', {
        adminId: req.user.id,
        format,
        period: { start_date: startDate, end_date: endDate }
      });

      res.json({
        success: true,
        data: exportData,
        export_info: {
          format,
          period: { start_date: startDate, end_date: endDate },
          generated_at: new Date()
        }
      });

    } catch (error) {
      logger.error('Erro ao exportar dados financeiros:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obter métricas em tempo real
   * GET /api/admin/financial/realtime
   */
  static async getRealtimeMetrics(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      // Buscar métricas do dia atual
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const dashboard = await AdminFinancialService.getAdminDashboard({
        start_date: startOfDay,
        end_date: today
      });

      // Extrair apenas métricas essenciais para tempo real
      const realtimeData = {
        today: {
          revenue: dashboard.key_metrics.gross_revenue,
          withdrawals: dashboard.withdrawals.total,
          new_users: dashboard.users.new_users,
          active_users: dashboard.users.active_users,
          operations: dashboard.operations.total
        },
        stripe_balance: dashboard.stripe_balance,
        pending_withdrawals: dashboard.withdrawals.pending,
        system_alerts: dashboard.alerts.length,
        last_updated: new Date()
      };

      res.json({
        success: true,
        data: realtimeData
      });

    } catch (error) {
      logger.error('Erro ao obter métricas em tempo real:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obter estatísticas avançadas
   * GET /api/admin/financial/advanced-stats
   */
  static async getAdvancedStats(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const {
        period = '30d',
        compare_with_previous = 'true'
      } = req.query;

      // Calcular períodos
      const periods = this.calculatePeriods(period, compare_with_previous === 'true');

      const [currentPeriod, previousPeriod] = await Promise.all([
        AdminFinancialService.getAdminDashboard({
          start_date: periods.current.start,
          end_date: periods.current.end
        }),
        compare_with_previous === 'true' ? AdminFinancialService.getAdminDashboard({
          start_date: periods.previous.start,
          end_date: periods.previous.end
        }) : null
      ]);

      // Calcular comparações se há período anterior
      let comparisons = null;
      if (previousPeriod) {
        comparisons = this.calculatePeriodComparisons(currentPeriod, previousPeriod);
      }

      res.json({
        success: true,
        data: {
          current_period: currentPeriod,
          previous_period: previousPeriod,
          comparisons,
          period_info: periods
        }
      });

    } catch (error) {
      logger.error('Erro ao obter estatísticas avançadas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Calcular períodos para comparação
   */
  static calculatePeriods(period, compareWithPrevious) {
    const now = new Date();
    let currentStart, currentEnd, previousStart, previousEnd;

    switch (period) {
      case '7d':
        currentEnd = now;
        currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousEnd = new Date(currentStart.getTime() - 1);
        previousStart = new Date(previousEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        currentEnd = now;
        currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousEnd = new Date(currentStart.getTime() - 1);
        previousStart = new Date(previousEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        currentEnd = now;
        currentStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousEnd = new Date(currentStart.getTime() - 1);
        previousStart = new Date(previousEnd.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        currentEnd = now;
        currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousEnd = new Date(currentStart.getTime() - 1);
        previousStart = new Date(previousEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      current: { start: currentStart, end: currentEnd },
      previous: compareWithPrevious ? { start: previousStart, end: previousEnd } : null
    };
  }

  /**
   * Calcular comparações entre períodos
   */
  static calculatePeriodComparisons(current, previous) {
    const calculateChange = (currentValue, previousValue) => {
      if (previousValue === 0) return currentValue > 0 ? 100 : 0;
      return ((currentValue - previousValue) / previousValue * 100);
    };

    return {
      revenue_change: {
        BRL: calculateChange(
          current.key_metrics.gross_revenue.BRL,
          previous.key_metrics.gross_revenue.BRL
        ),
        USD: calculateChange(
          current.key_metrics.gross_revenue.USD,
          previous.key_metrics.gross_revenue.USD
        )
      },
      user_growth_change: calculateChange(
        current.users.new_users,
        previous.users.new_users
      ),
      operations_change: calculateChange(
        current.operations.total.operations,
        previous.operations.total.operations
      )
    };
  }

  /**
   * Resolver alerta do sistema
   * PUT /api/admin/financial/alerts/:id/resolve
   */
  static async resolveAlert(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const { id } = req.params;
      const { resolution_notes } = req.body;

      // Atualizar alerta
      const updated = await db('system_alerts')
        .where('id', id)
        .update({
          resolved: true,
          resolved_by: req.user.id,
          resolved_at: new Date(),
          resolution_notes
        });

      if (updated === 0) {
        return res.status(404).json({
          success: false,
          message: 'Alerta não encontrado'
        });
      }

      logger.info('Alerta resolvido', {
        alertId: id,
        resolvedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Alerta resolvido com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao resolver alerta:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default AdminFinancialController;
