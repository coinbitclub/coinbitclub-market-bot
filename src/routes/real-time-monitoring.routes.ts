// ========================================
// MARKETBOT - REAL-TIME MONITORING ROUTES
// Rotas para dashboard de monitoramento e alertas
// FASE 6 - Monitoramento crítico para produção
// ========================================

import { Router } from 'express';
import RealTimeMonitoringController from '../controllers/real-time-monitoring.controller.js';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import { DatabaseService } from '../services/database.service.js';
import { logger } from '../utils/logger.js';

const router = Router();
const monitoringController = new RealTimeMonitoringController();

// ========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ========================================

// Criar middleware de autenticação
const authMiddleware = createAuthMiddleware(DatabaseService.getInstance().getPool());

// Todas as rotas de monitoramento requerem autenticação
router.use(authMiddleware.authenticate);

// ========================================
// MÉTRICAS DO SISTEMA
// ========================================

/**
 * @route GET /api/v1/monitoring/metrics/current
 * @desc Obter métricas atuais do sistema
 * @access Private (requires auth token)
 */
router.get('/metrics/current', async (req, res) => {
  logger.info('📊 GET /monitoring/metrics/current');
  await monitoringController.getCurrentMetrics(req, res);
});

/**
 * @route GET /api/v1/monitoring/metrics/history
 * @desc Obter histórico de métricas
 * @query hours - Número de horas para buscar (padrão: 1)
 * @access Private (requires auth token)
 */
router.get('/metrics/history', async (req, res) => {
  logger.info(`📊 GET /monitoring/metrics/history - Hours: ${req.query.hours || 1}`);
  await monitoringController.getMetricsHistory(req, res);
});

/**
 * @route GET /api/v1/monitoring/health
 * @desc Verificar saúde geral do sistema
 * @access Private (requires auth token)
 */
router.get('/health', async (req, res) => {
  logger.info('🏥 GET /monitoring/health');
  await monitoringController.getSystemHealth(req, res);
});

// ========================================
// ALERTAS DO SISTEMA
// ========================================

/**
 * @route GET /api/v1/monitoring/alerts/active
 * @desc Obter alertas ativos
 * @access Private (requires auth token)
 */
router.get('/alerts/active', async (req, res) => {
  logger.info('🚨 GET /monitoring/alerts/active');
  await monitoringController.getActiveAlerts(req, res);
});

/**
 * @route GET /api/v1/monitoring/alerts/history
 * @desc Obter histórico de alertas
 * @query hours - Número de horas para buscar (padrão: 24)
 * @query level - Filtrar por nível (info, warning, critical, emergency)
 * @query category - Filtrar por categoria (system, trading, database, external, security)
 * @access Private (requires auth token)
 */
router.get('/alerts/history', async (req, res) => {
  logger.info(`🚨 GET /monitoring/alerts/history - Filters: ${JSON.stringify(req.query)}`);
  await monitoringController.getAlertsHistory(req, res);
});

/**
 * @route POST /api/v1/monitoring/alerts/:alertId/resolve
 * @desc Resolver um alerta específico
 * @body acknowledgedBy - ID ou nome do usuário que resolveu
 * @access Private (requires auth token)
 */
router.post('/alerts/:alertId/resolve', async (req, res) => {
  logger.info(`🔧 POST /monitoring/alerts/${req.params.alertId}/resolve`);
  await monitoringController.resolveAlert(req, res);
});

// ========================================
// DASHBOARD OVERVIEW
// ========================================

/**
 * @route GET /api/v1/monitoring/dashboard
 * @desc Obter overview completo para dashboard
 * @access Private (requires auth token)
 */
router.get('/dashboard', async (req, res) => {
  logger.info('📈 GET /monitoring/dashboard');
  await monitoringController.getDashboardOverview(req, res);
});

/**
 * @route GET /api/v1/monitoring/config
 * @desc Obter configurações do sistema de monitoramento
 * @access Private (requires auth token)
 */
router.get('/config', async (req, res) => {
  logger.info('⚙️ GET /monitoring/config');
  await monitoringController.getMonitoringConfig(req, res);
});

// ========================================
// ENDPOINTS DE DESENVOLVIMENTO/TESTE
// ========================================

/**
 * @route POST /api/v1/monitoring/dev/test-alert
 * @desc Criar alerta de teste (apenas desenvolvimento)
 * @body level - Nível do alerta (info, warning, critical, emergency)
 * @body category - Categoria (system, trading, database, external, security)
 * @body message - Mensagem do alerta
 * @access Private (requires auth token)
 */
router.post('/dev/test-alert', async (req, res) => {
  // Apenas em ambiente de desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({
      error: 'Endpoint de teste não disponível em produção'
    });
    return;
  }

  logger.info('🧪 POST /monitoring/dev/test-alert');
  await monitoringController.triggerTestAlert(req, res);
});

/**
 * @route GET /api/v1/monitoring/dev/status
 * @desc Status do sistema de monitoramento (desenvolvimento)
 * @access Private (requires auth token)
 */
router.get('/dev/status', async (req, res) => {
  try {
    const monitoringService = require('../services/real-time-monitoring.service.js').default;
    const instance = monitoringService.getInstance();
    
    res.json({
      success: true,
      data: {
        service: 'Real-Time Monitoring Service',
        status: 'active',
        features: [
          'WebSocket Server (porta 3001)',
          'Coleta de métricas (15s)',
          'Verificações de saúde (30s)',
          'Sistema de alertas',
          'Histórico de métricas',
          'Dashboard real-time'
        ],
        endpoints: {
          metrics: '/api/v1/monitoring/metrics/*',
          alerts: '/api/v1/monitoring/alerts/*',
          health: '/api/v1/monitoring/health',
          dashboard: '/api/v1/monitoring/dashboard',
          config: '/api/v1/monitoring/config'
        },
        websocket: {
          port: 3001,
          events: ['metrics', 'alerts', 'health', 'alert_resolved']
        }
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao obter status do serviço',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// ========================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// ========================================

router.use((error: any, req: any, res: any, next: any) => {
  logger.error('❌ Erro nas rotas de monitoramento:', error);
  
  res.status(500).json({
    error: 'Erro interno do servidor de monitoramento',
    message: error.message || 'Erro desconhecido',
    path: req.path,
    method: req.method,
    timestamp: new Date()
  });
});

// ========================================
// DOCUMENTAÇÃO DAS ROTAS
// ========================================

/**
 * @route GET /api/v1/monitoring/
 * @desc Documentação das rotas de monitoramento
 * @access Private (requires auth token)
 */
router.get('/', (req, res) => {
  res.json({
    service: 'MarketBot Real-Time Monitoring API',
    version: '1.0.0',
    description: 'Sistema de monitoramento 24/7 com WebSockets e alertas',
    endpoints: {
      metrics: {
        'GET /metrics/current': 'Métricas atuais do sistema',
        'GET /metrics/history?hours=1': 'Histórico de métricas'
      },
      health: {
        'GET /health': 'Status geral de saúde do sistema'
      },
      alerts: {
        'GET /alerts/active': 'Alertas ativos não resolvidos',
        'GET /alerts/history?hours=24&level=&category=': 'Histórico de alertas com filtros',
        'POST /alerts/:alertId/resolve': 'Resolver alerta específico'
      },
      dashboard: {
        'GET /dashboard': 'Overview completo para dashboard',
        'GET /config': 'Configurações do sistema de monitoramento'
      },
      development: {
        'POST /dev/test-alert': 'Criar alerta de teste (apenas dev)',
        'GET /dev/status': 'Status detalhado do serviço (apenas dev)'
      }
    },
    websocket: {
      url: 'ws://localhost:3001',
      events: {
        metrics: 'Métricas em tempo real (15s)',
        alerts: 'Novos alertas',
        health: 'Status de saúde (30s)',
        alert_resolved: 'Alertas resolvidos'
      }
    },
    authentication: 'Todas as rotas requerem token JWT válido',
    timestamp: new Date()
  });
});

export default router;
