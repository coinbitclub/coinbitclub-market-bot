// ========================================
// MARKETBOT - REAL-TIME MONITORING SERVICE
// Sistema de monitoramento 24/7 com WebSockets
// FASE 6 - Monitoramento crítico para produção
// ========================================

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { DatabaseService } from './database.service.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export interface SystemMetrics {
  timestamp: Date;
  server: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuLoad: number;
    activeConnections: number;
  };
  database: {
    activeConnections: number;
    queryLatency: number;
    poolSize: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  trading: {
    activePositions: number;
    totalUsers: number;
    totalPnL24h: number;
    successRate: number;
    avgExecutionTime: number;
  };
  external: {
    binanceLatency: number;
    bybitLatency: number;
    openaiLatency: number;
    ngrokStatus: 'connected' | 'disconnected';
  };
}

export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'critical' | 'emergency';
  category: 'system' | 'trading' | 'database' | 'external' | 'security';
  message: string;
  details: any;
  timestamp: Date;
  resolved: boolean;
  acknowledgedBy?: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical' | 'down';
  components: {
    server: 'healthy' | 'warning' | 'critical';
    database: 'healthy' | 'warning' | 'critical';
    trading: 'healthy' | 'warning' | 'critical';
    external: 'healthy' | 'warning' | 'critical';
  };
  alerts: Alert[];
  lastCheck: Date;
}

export class RealTimeMonitoringService extends EventEmitter {
  private static instance: RealTimeMonitoringService;
  private wss: WebSocket.Server | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertsHistory: Alert[] = [];
  private currentMetrics: SystemMetrics | null = null;
  private healthThresholds = {
    memory: 90, // % máximo de uso de memória
    cpu: 80, // % máximo de CPU
    dbLatency: 1000, // ms máximo de latência
    apiLatency: 5000, // ms máximo para APIs externas
    minUptime: 3600000, // 1 hora mínima de uptime
  };

  constructor() {
    super();
    logger.info('🔄 Real-Time Monitoring Service inicializando...');
  }

  static getInstance(): RealTimeMonitoringService {
    if (!RealTimeMonitoringService.instance) {
      RealTimeMonitoringService.instance = new RealTimeMonitoringService();
    }
    return RealTimeMonitoringService.instance;
  }

  // ========================================
  // INICIALIZAÇÃO DO SISTEMA
  // ========================================

  async start(port: number = 3001): Promise<void> {
    try {
      // Inicializar WebSocket Server
      this.wss = new WebSocket.Server({ port });
      
      this.wss.on('connection', (ws, req) => {
        const clientIp = req.socket.remoteAddress;
        logger.info(`📱 Cliente conectado ao monitoramento: ${clientIp}`);
        
        // Enviar métricas atuais imediatamente
        if (this.currentMetrics) {
          ws.send(JSON.stringify({
            type: 'metrics',
            data: this.currentMetrics
          }));
        }

        // Enviar alertas ativos
        const activeAlerts = this.alertsHistory.filter(alert => !alert.resolved);
        if (activeAlerts.length > 0) {
          ws.send(JSON.stringify({
            type: 'alerts',
            data: activeAlerts
          }));
        }

        ws.on('close', () => {
          logger.info(`📱 Cliente desconectado do monitoramento: ${clientIp}`);
        });

        ws.on('error', (error) => {
          logger.error('❌ Erro no WebSocket:', error);
        });
      });

      // Iniciar coleta de métricas (a cada 15 segundos)
      this.startMetricsCollection();

      // Inicializar verificações de saúde (a cada 30 segundos)
      this.startHealthChecks();

      logger.info(`✅ Real-Time Monitoring iniciado na porta ${port}`);
      logger.info('📊 Coleta de métricas: 15s');
      logger.info('🏥 Verificações de saúde: 30s');

    } catch (error) {
      logger.error('❌ Erro ao iniciar monitoramento:', error);
      throw error;
    }
  }

  // ========================================
  // COLETA DE MÉTRICAS
  // ========================================

  private startMetricsCollection(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectSystemMetrics();
        this.currentMetrics = metrics;

        // Broadcast para todos os clientes conectados
        this.broadcastToClients({
          type: 'metrics',
          data: metrics
        });

        // Salvar métricas no banco para histórico
        await this.saveMetricsToDatabase(metrics);

        // Verificar thresholds e gerar alertas
        await this.checkThresholds(metrics);

      } catch (error) {
        logger.error('❌ Erro na coleta de métricas:', error);
        await this.createAlert('critical', 'system', 'Falha na coleta de métricas', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }, 15000); // 15 segundos
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const startTime = Date.now();

    // Métricas do servidor
    const memUsage = process.memoryUsage();
    const uptime = process.uptime() * 1000;
    
    // Métricas do banco de dados
    const dbMetrics = await this.collectDatabaseMetrics();
    
    // Métricas de trading
    const tradingMetrics = await this.collectTradingMetrics();
    
    // Métricas de APIs externas
    const externalMetrics = await this.collectExternalMetrics();

    return {
      timestamp: new Date(),
      server: {
        uptime,
        memoryUsage: memUsage,
        cpuLoad: await this.getCPUUsage(),
        activeConnections: this.wss?.clients.size || 0
      },
      database: dbMetrics,
      trading: tradingMetrics,
      external: externalMetrics
    };
  }

  private async collectDatabaseMetrics(): Promise<SystemMetrics['database']> {
    const startTime = Date.now();
    
    try {
      // Test query para medir latência
      await DatabaseService.getInstance().query('SELECT 1');
      const queryLatency = Date.now() - startTime;

      // Pool info
      const pool = DatabaseService.getInstance().getPool();
      
      return {
        activeConnections: pool.totalCount,
        queryLatency,
        poolSize: pool.totalCount,
        status: queryLatency > this.healthThresholds.dbLatency ? 'critical' : 
                queryLatency > 500 ? 'warning' : 'healthy'
      };
    } catch (error) {
      return {
        activeConnections: 0,
        queryLatency: -1,
        poolSize: 0,
        status: 'critical'
      };
    }
  }

  private async collectTradingMetrics(): Promise<SystemMetrics['trading']> {
    try {
      const [positionsResult, usersResult, pnlResult] = await Promise.all([
        DatabaseService.getInstance().query(
          'SELECT COUNT(*) as count FROM user_positions WHERE status = $1',
          ['open']
        ),
        DatabaseService.getInstance().query('SELECT COUNT(*) as count FROM users'),
        DatabaseService.getInstance().query(`
          SELECT 
            COALESCE(SUM(profit_loss), 0) as total_pnl,
            COUNT(*) as total_trades,
            COUNT(CASE WHEN profit_loss > 0 THEN 1 END) as winning_trades,
            AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_execution_time
          FROM user_positions 
          WHERE updated_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
        `)
      ]);

      const activePositions = parseInt(positionsResult.rows[0]?.count || '0');
      const totalUsers = parseInt(usersResult.rows[0]?.count || '0');
      const pnlData = pnlResult.rows[0];
      
      const totalPnL24h = parseFloat(pnlData?.total_pnl || '0');
      const totalTrades = parseInt(pnlData?.total_trades || '0');
      const winningTrades = parseInt(pnlData?.winning_trades || '0');
      const successRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      const avgExecutionTime = parseFloat(pnlData?.avg_execution_time || '0') * 1000; // Convert to ms

      return {
        activePositions,
        totalUsers,
        totalPnL24h,
        successRate,
        avgExecutionTime
      };
    } catch (error) {
      logger.error('❌ Erro ao coletar métricas de trading:', error);
      return {
        activePositions: -1,
        totalUsers: -1,
        totalPnL24h: 0,
        successRate: 0,
        avgExecutionTime: 0
      };
    }
  }

  private async collectExternalMetrics(): Promise<SystemMetrics['external']> {
    const startTime = Date.now();
    
    try {
      // Test Binance API
      const binanceStart = Date.now();
      await fetch('https://api.binance.com/api/v3/ping');
      const binanceLatency = Date.now() - binanceStart;

      // Test Bybit API
      const bybitStart = Date.now();
      await fetch('https://api.bybit.com/v2/public/time');
      const bybitLatency = Date.now() - bybitStart;

      // Test OpenAI API (usando endpoint simples)
      const openaiStart = Date.now();
      try {
        await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}` }
        });
      } catch {} // Ignorar erro se API key inválida
      const openaiLatency = Date.now() - openaiStart;

      // Test NGROK status
      let ngrokStatus: 'connected' | 'disconnected' = 'disconnected';
      try {
        const response = await fetch('https://marketbot.ngrok.app/api/v1/health');
        ngrokStatus = response.ok ? 'connected' : 'disconnected';
      } catch {}

      return {
        binanceLatency,
        bybitLatency,
        openaiLatency,
        ngrokStatus
      };
    } catch (error) {
      return {
        binanceLatency: -1,
        bybitLatency: -1,
        openaiLatency: -1,
        ngrokStatus: 'disconnected'
      };
    }
  }

  private async getCPUUsage(): Promise<number> {
    // Implementação simplificada - em produção usar library como 'systeminformation'
    return 0; // TODO: Implementar medição real de CPU
  }

  // ========================================
  // SISTEMA DE ALERTAS
  // ========================================

  private async checkThresholds(metrics: SystemMetrics): Promise<void> {
    const checks = [
      // Verificar memória
      {
        condition: (metrics.server.memoryUsage.heapUsed / metrics.server.memoryUsage.heapTotal) * 100 > this.healthThresholds.memory,
        level: 'critical' as const,
        category: 'system' as const,
        message: 'Alto uso de memória detectado',
        details: { memoryUsage: metrics.server.memoryUsage }
      },
      
      // Verificar latência do banco
      {
        condition: metrics.database.queryLatency > this.healthThresholds.dbLatency,
        level: 'warning' as const,
        category: 'database' as const,
        message: 'Alta latência no banco de dados',
        details: { latency: metrics.database.queryLatency }
      },
      
      // Verificar APIs externas
      {
        condition: metrics.external.binanceLatency > this.healthThresholds.apiLatency,
        level: 'warning' as const,
        category: 'external' as const,
        message: 'Alta latência na API Binance',
        details: { latency: metrics.external.binanceLatency }
      },
      
      // Verificar NGROK
      {
        condition: metrics.external.ngrokStatus === 'disconnected',
        level: 'critical' as const,
        category: 'external' as const,
        message: 'NGROK desconectado - webhooks indisponíveis',
        details: { ngrokStatus: metrics.external.ngrokStatus }
      },
      
      // Verificar uptime mínimo
      {
        condition: metrics.server.uptime < this.healthThresholds.minUptime,
        level: 'info' as const,
        category: 'system' as const,
        message: 'Sistema reiniciado recentemente',
        details: { uptime: metrics.server.uptime }
      }
    ];

    for (const check of checks) {
      if (check.condition) {
        await this.createAlert(check.level, check.category, check.message, check.details);
      }
    }
  }

  private async createAlert(level: Alert['level'], category: Alert['category'], message: string, details: any): Promise<void> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      category,
      message,
      details,
      timestamp: new Date(),
      resolved: false
    };

    this.alertsHistory.push(alert);
    
    // Manter apenas últimos 1000 alertas
    if (this.alertsHistory.length > 1000) {
      this.alertsHistory = this.alertsHistory.slice(-1000);
    }

    // Salvar no banco
    await this.saveAlertToDatabase(alert);

    // Broadcast para clientes
    this.broadcastToClients({
      type: 'alert',
      data: alert
    });

    // Log baseado no nível
    if (level === 'critical' || level === 'emergency') {
      logger.error(`🚨 ${level.toUpperCase()}: ${message}`, details);
    } else if (level === 'warning') {
      logger.warn(`⚠️ WARNING: ${message}`, details);
    } else {
      logger.info(`ℹ️ INFO: ${message}`, details);
    }

    // Emitir evento para outros serviços
    this.emit('alert', alert);
  }

  // ========================================
  // VERIFICAÇÕES DE SAÚDE
  // ========================================

  private startHealthChecks(): void {
    setInterval(async () => {
      try {
        const health = await this.getSystemHealth();
        
        this.broadcastToClients({
          type: 'health',
          data: health
        });

        // Se sistema crítico, criar alerta
        if (health.overall === 'critical' || health.overall === 'down') {
          await this.createAlert('emergency', 'system', 'Sistema em estado crítico', { health });
        }

      } catch (error) {
        logger.error('❌ Erro na verificação de saúde:', error);
      }
    }, 30000); // 30 segundos
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const metrics = this.currentMetrics;
    if (!metrics) {
      return {
        overall: 'down',
        components: {
          server: 'critical',
          database: 'critical',
          trading: 'critical',
          external: 'critical'
        },
        alerts: this.alertsHistory.filter(alert => !alert.resolved),
        lastCheck: new Date()
      };
    }

    const components = {
      server: this.getServerHealth(metrics.server),
      database: metrics.database.status === 'healthy' ? 'healthy' : 
                metrics.database.status === 'warning' ? 'warning' : 'critical',
      trading: this.getTradingHealth(metrics.trading),
      external: this.getExternalHealth(metrics.external)
    } as const;

    // Determinar saúde geral
    let overall: SystemHealth['overall'] = 'healthy';
    
    const componentValues = Object.values(components);
    if (componentValues.includes('critical')) {
      overall = 'critical';
    } else if (componentValues.includes('warning')) {
      overall = 'warning';
    }

    return {
      overall,
      components,
      alerts: this.alertsHistory.filter(alert => !alert.resolved),
      lastCheck: new Date()
    };
  }

  private getServerHealth(server: SystemMetrics['server']): 'healthy' | 'warning' | 'critical' {
    const memoryPercent = (server.memoryUsage.heapUsed / server.memoryUsage.heapTotal) * 100;
    
    if (memoryPercent > 90 || server.cpuLoad > 80) {
      return 'critical';
    } else if (memoryPercent > 70 || server.cpuLoad > 60) {
      return 'warning';
    }
    
    return 'healthy';
  }

  private getTradingHealth(trading: SystemMetrics['trading']): 'healthy' | 'warning' | 'critical' {
    if (trading.activePositions === -1) {
      return 'critical';
    } else if (trading.successRate < 30) {
      return 'warning';
    }
    
    return 'healthy';
  }

  private getExternalHealth(external: SystemMetrics['external']): 'healthy' | 'warning' | 'critical' {
    if (external.ngrokStatus === 'disconnected' || external.binanceLatency === -1) {
      return 'critical';
    } else if (external.binanceLatency > 5000 || external.bybitLatency > 5000) {
      return 'warning';
    }
    
    return 'healthy';
  }

  // ========================================
  // UTILITÁRIOS
  // ========================================

  private broadcastToClients(message: any): void {
    if (!this.wss) return;

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  private async saveMetricsToDatabase(metrics: SystemMetrics): Promise<void> {
    try {
      const query = `
        INSERT INTO system_metrics (
          timestamp, server_data, database_data, trading_data, external_data
        ) VALUES ($1, $2, $3, $4, $5)
      `;
      
      await DatabaseService.getInstance().query(query, [
        metrics.timestamp,
        JSON.stringify(metrics.server),
        JSON.stringify(metrics.database),
        JSON.stringify(metrics.trading),
        JSON.stringify(metrics.external)
      ]);
    } catch (error) {
      // Silently fail to avoid recursive alerts
      logger.debug('Falha ao salvar métricas no banco:', error);
    }
  }

  private async saveAlertToDatabase(alert: Alert): Promise<void> {
    try {
      const query = `
        INSERT INTO system_alerts (
          id, level, category, message, details, timestamp, resolved
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      await DatabaseService.getInstance().query(query, [
        alert.id,
        alert.level,
        alert.category,
        alert.message,
        JSON.stringify(alert.details),
        alert.timestamp,
        alert.resolved
      ]);
    } catch (error) {
      logger.debug('Falha ao salvar alerta no banco:', error);
    }
  }

  // ========================================
  // APIS PÚBLICAS
  // ========================================

  getCurrentMetrics(): SystemMetrics | null {
    return this.currentMetrics;
  }

  getActiveAlerts(): Alert[] {
    return this.alertsHistory.filter(alert => !alert.resolved);
  }

  async resolveAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.alertsHistory.find(a => a.id === alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.acknowledgedBy = acknowledgedBy;

    try {
      await DatabaseService.getInstance().query(
        'UPDATE system_alerts SET resolved = true, acknowledged_by = $2 WHERE id = $1',
        [alertId, acknowledgedBy]
      );

      this.broadcastToClients({
        type: 'alert_resolved',
        data: { alertId, acknowledgedBy }
      });

      return true;
    } catch (error) {
      logger.error('❌ Erro ao resolver alerta:', error);
      return false;
    }
  }

  async stop(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.wss) {
      this.wss.close();
    }
    
    logger.info('🔄 Real-Time Monitoring Service parado');
  }
}

export default RealTimeMonitoringService;
