// ========================================
// MARKETBOT - REAL-TIME MONITORING CONTROLLER
// Endpoints para dashboard de monitoramento e alertas
// FASE 6 - Monitoramento crítico para produção
// ========================================

import { Request, Response } from 'express';
import RealTimeMonitoringService, { SystemHealth, SystemMetrics, Alert } from '../services/real-time-monitoring.service.js';
import { DatabaseService } from '../services/database.service.js';
import { logger } from '../utils/logger.js';

export class RealTimeMonitoringController {
  private monitoringService: RealTimeMonitoringService;

  constructor() {
    this.monitoringService = RealTimeMonitoringService.getInstance();
    logger.info('🔄 Real-Time Monitoring Controller inicializado');
  }

  // ========================================
  // MÉTRICAS DO SISTEMA
  // ========================================

  async getCurrentMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = this.monitoringService.getCurrentMetrics();
      
      if (!metrics) {
        res.status(503).json({
          error: 'Sistema de monitoramento ainda inicializando'
        });
        return;
      }

      res.json({
        success: true,
        data: metrics,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('❌ Erro ao obter métricas atuais:', error);
      res.status(500).json({
        error: 'Erro interno ao obter métricas',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.monitoringService.getSystemHealth();

      res.json({
        success: true,
        data: health,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('❌ Erro ao obter saúde do sistema:', error);
      res.status(500).json({
        error: 'Erro interno ao verificar saúde do sistema',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async getMetricsHistory(req: Request, res: Response): Promise<void> {
    try {
      const { hours = '1' } = req.query;
      const hoursNum = parseInt(hours as string, 10);

      if (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 168) { // Máximo 1 semana
        res.status(400).json({
          error: 'Parâmetro hours deve ser um número entre 1 e 168 (1 semana)'
        });
        return;
      }

      // Buscar histórico no banco
      const query = `
        SELECT 
          timestamp,
          server_data,
          database_data,
          trading_data,
          external_data
        FROM system_metrics 
        WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '${hoursNum} hours'
        ORDER BY timestamp DESC
        LIMIT 1000
      `;

      const result = await DatabaseService.getInstance().query(query);
      
      const metrics = result.rows.map((row: any) => ({
        timestamp: row.timestamp,
        server: JSON.parse(row.server_data),
        database: JSON.parse(row.database_data),
        trading: JSON.parse(row.trading_data),
        external: JSON.parse(row.external_data)
      }));

      res.json({
        success: true,
        data: {
          metrics,
          period: `${hoursNum} hours`,
          count: metrics.length
        },
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('❌ Erro ao obter histórico de métricas:', error);
      res.status(500).json({
        error: 'Erro interno ao obter histórico',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // ========================================
  // ALERTAS DO SISTEMA
  // ========================================

  async getActiveAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = this.monitoringService.getActiveAlerts();

      res.json({
        success: true,
        data: {
          alerts,
          count: alerts.length,
          categories: this.groupAlertsByCategory(alerts)
        },
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('❌ Erro ao obter alertas ativos:', error);
      res.status(500).json({
        error: 'Erro interno ao obter alertas',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async getAlertsHistory(req: Request, res: Response): Promise<void> {
    try {
      const { hours = '24', level, category } = req.query;
      const hoursNum = parseInt(hours as string, 10);

      if (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 720) { // Máximo 30 dias
        res.status(400).json({
          error: 'Parâmetro hours deve ser um número entre 1 e 720 (30 dias)'
        });
        return;
      }

      let query = `
        SELECT *
        FROM system_alerts 
        WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '${hoursNum} hours'
      `;
      
      const params: string[] = [];
      let paramIndex = 1;

      if (level) {
        query += ` AND level = $${paramIndex}`;
        params.push(level as string);
        paramIndex++;
      }

      if (category) {
        query += ` AND category = $${paramIndex}`;
        params.push(category as string);
        paramIndex++;
      }

      query += ' ORDER BY timestamp DESC LIMIT 1000';

      const result = await DatabaseService.getInstance().query(query, params);
      
      const alerts: Alert[] = result.rows.map((row: any) => ({
        id: row.id,
        level: row.level,
        category: row.category,
        message: row.message,
        details: JSON.parse(row.details || '{}'),
        timestamp: row.timestamp,
        resolved: row.resolved,
        acknowledgedBy: row.acknowledged_by
      }));

      res.json({
        success: true,
        data: {
          alerts,
          count: alerts.length,
          period: `${hoursNum} hours`,
          filters: { level, category },
          statistics: this.calculateAlertStatistics(alerts)
        },
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('❌ Erro ao obter histórico de alertas:', error);
      res.status(500).json({
        error: 'Erro interno ao obter histórico de alertas',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async resolveAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const { acknowledgedBy } = req.body;

      if (!alertId || !acknowledgedBy) {
        res.status(400).json({
          error: 'alertId e acknowledgedBy são obrigatórios'
        });
        return;
      }

      const success = await this.monitoringService.resolveAlert(alertId, acknowledgedBy);

      if (!success) {
        res.status(404).json({
          error: 'Alerta não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Alerta resolvido com sucesso',
        data: {
          alertId,
          acknowledgedBy,
          resolvedAt: new Date()
        }
      });

    } catch (error) {
      logger.error('❌ Erro ao resolver alerta:', error);
      res.status(500).json({
        error: 'Erro interno ao resolver alerta',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // ========================================
  // DASHBOARD OVERVIEW
  // ========================================

  async getDashboardOverview(req: Request, res: Response): Promise<void> {
    try {
      const [health, metrics, activeAlerts] = await Promise.all([
        this.monitoringService.getSystemHealth(),
        this.monitoringService.getCurrentMetrics(),
        this.monitoringService.getActiveAlerts()
      ]);

      // Estatísticas rápidas das últimas 24h
      const alertsStats = await this.getAlerts24hStats();

      res.json({
        success: true,
        data: {
          health,
          currentMetrics: metrics,
          alerts: {
            active: activeAlerts,
            activeCount: activeAlerts.length,
            last24h: alertsStats
          },
          summary: {
            overallStatus: health.overall,
            criticalAlerts: activeAlerts.filter(a => a.level === 'critical' || a.level === 'emergency').length,
            systemUptime: metrics?.server.uptime || 0,
            totalUsers: metrics?.trading.totalUsers || 0,
            activePositions: metrics?.trading.activePositions || 0
          }
        },
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('❌ Erro ao obter overview do dashboard:', error);
      res.status(500).json({
        error: 'Erro interno ao obter overview',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // ========================================
  // CONFIGURAÇÕES DE MONITORAMENTO
  // ========================================

  async getMonitoringConfig(req: Request, res: Response): Promise<void> {
    try {
      // Retornar configurações atuais do monitoramento
      const config = {
        metricsInterval: 15000, // 15 segundos
        healthCheckInterval: 30000, // 30 segundos
        alertRetention: 1000, // máximo de alertas em memória
        thresholds: {
          memory: 90, // %
          cpu: 80, // %
          dbLatency: 1000, // ms
          apiLatency: 5000, // ms
          minUptime: 3600000 // 1 hora em ms
        },
        websocketPort: 3001,
        connectedClients: this.monitoringService['wss']?.clients.size || 0
      };

      res.json({
        success: true,
        data: config,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('❌ Erro ao obter configurações:', error);
      res.status(500).json({
        error: 'Erro interno ao obter configurações',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // ========================================
  // ENDPOINTS DE DESENVOLVIMENTO
  // ========================================

  async triggerTestAlert(req: Request, res: Response): Promise<void> {
    try {
      const { level = 'info', category = 'system', message = 'Alerta de teste' } = req.body;

      // Criar alerta de teste
      await this.monitoringService['createAlert'](level, category, message, { 
        test: true, 
        triggeredBy: (req as any).user?.id || 'unknown',
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: 'Alerta de teste criado com sucesso',
        data: { level, category, message }
      });

    } catch (error) {
      logger.error('❌ Erro ao criar alerta de teste:', error);
      res.status(500).json({
        error: 'Erro interno ao criar alerta de teste',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // ========================================
  // MÉTODOS AUXILIARES
  // ========================================

  private groupAlertsByCategory(alerts: Alert[]): Record<string, number> {
    return alerts.reduce((acc, alert) => {
      acc[alert.category] = (acc[alert.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateAlertStatistics(alerts: Alert[]): {
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
    resolved: number;
    unresolved: number;
  } {
    const byLevel = alerts.reduce((acc, alert) => {
      acc[alert.level] = (acc[alert.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = this.groupAlertsByCategory(alerts);
    const resolved = alerts.filter(a => a.resolved).length;
    const unresolved = alerts.length - resolved;

    return {
      total: alerts.length,
      byLevel,
      byCategory,
      resolved,
      unresolved
    };
  }

  private async getAlerts24hStats(): Promise<any> {
    try {
      const query = `
        SELECT 
          level,
          category,
          COUNT(*) as count,
          COUNT(CASE WHEN resolved THEN 1 END) as resolved_count
        FROM system_alerts 
        WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours'
        GROUP BY level, category
        ORDER BY count DESC
      `;

      const result = await DatabaseService.getInstance().query(query);
      return result.rows;
    } catch (error) {
      logger.error('❌ Erro ao obter estatísticas de alertas 24h:', error);
      return [];
    }
  }
}

export default RealTimeMonitoringController;
