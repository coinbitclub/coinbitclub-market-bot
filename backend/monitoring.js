/**
 * 📊 SISTEMA DE MONITORAMENTO E LOGS AVANÇADO - FASE 2
 * Implementa logging estruturado, métricas e alertas
 * Data: 27/07/2025
 * Versão: 2.0.0
 */

const fs = require('fs').promises;
const path = require('path');

class AdvancedMonitoring {
  constructor() {
    this.logDir = path.join(__dirname, 'logs');
    this.metricsFile = path.join(this.logDir, 'metrics.json');
    this.alertsFile = path.join(this.logDir, 'alerts.json');
    
    this.metrics = {
      api_calls: {},
      response_times: {},
      errors: {},
      active_users: new Set(),
      admin_actions: [],
      system_health: {
        uptime: Date.now(),
        memory_usage: [],
        cpu_usage: [],
        db_connections: 0
      }
    };
    
    this.alerts = [];
    this.init();
  }

  async init() {
    try {
      // Criar diretório de logs se não existir
      await fs.mkdir(this.logDir, { recursive: true });
      
      // Carregar métricas existentes
      try {
        const metricsData = await fs.readFile(this.metricsFile, 'utf8');
        this.metrics = { ...this.metrics, ...JSON.parse(metricsData) };
        this.metrics.active_users = new Set(this.metrics.active_users || []);
      } catch (error) {
        console.log('📊 Iniciando novo arquivo de métricas');
      }
      
      // Iniciar coleta automática de métricas
      setInterval(() => this.collectSystemMetrics(), 60000); // A cada minuto
      setInterval(() => this.saveMetrics(), 300000); // A cada 5 minutos
      
      console.log('✅ Sistema de monitoramento inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar monitoramento:', error);
    }
  }

  // 📝 Log estruturado para APIs
  logAPICall(endpoint, method, userId, duration, status, details = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      endpoint,
      method,
      user_id: userId,
      duration_ms: duration,
      status_code: status,
      details
    };

    // Atualizar métricas
    const key = `${method} ${endpoint}`;
    if (!this.metrics.api_calls[key]) {
      this.metrics.api_calls[key] = { count: 0, avg_duration: 0, errors: 0 };
    }

    this.metrics.api_calls[key].count++;
    this.metrics.api_calls[key].avg_duration = 
      (this.metrics.api_calls[key].avg_duration + duration) / 2;

    if (status >= 400) {
      this.metrics.api_calls[key].errors++;
    }

    // Log no console com formatação
    const statusIcon = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
    const durationColor = duration > 1000 ? '🔴' : duration > 500 ? '🟡' : '🟢';
    
    console.log(`${statusIcon} ${timestamp} | ${method} ${endpoint} | ${status} | ${durationColor} ${duration}ms | User: ${userId || 'anonymous'}`);
    
    if (details && Object.keys(details).length > 0) {
      console.log(`   📋 Details:`, details);
    }

    // Alertas automáticos
    this.checkForAlerts(endpoint, method, duration, status);
    
    return logEntry;
  }

  // 👤 Log de ações administrativas
  logAdminAction(adminId, action, targetUserId, details, result) {
    const timestamp = new Date().toISOString();
    const adminAction = {
      timestamp,
      admin_id: adminId,
      action,
      target_user_id: targetUserId,
      details,
      result,
      ip_address: details.ip || 'unknown'
    };

    this.metrics.admin_actions.push(adminAction);
    
    // Manter apenas últimas 1000 ações
    if (this.metrics.admin_actions.length > 1000) {
      this.metrics.admin_actions = this.metrics.admin_actions.slice(-1000);
    }

    const resultIcon = result.success ? '✅' : '❌';
    console.log(`🔧 ${timestamp} | ADMIN ACTION | ${adminId} | ${action} | Target: ${targetUserId} | ${resultIcon}`);
    console.log(`   📝 Details: ${JSON.stringify(details)}`);
    console.log(`   📊 Result: ${JSON.stringify(result)}`);

    return adminAction;
  }

  // 💰 Log específico para operações de crédito
  logCreditOperation(type, userId, amount, currency, adminId = null, notes = '') {
    const timestamp = new Date().toISOString();
    const operation = {
      timestamp,
      type, // 'grant', 'use', 'check_eligibility'
      user_id: userId,
      amount,
      currency,
      admin_id: adminId,
      notes
    };

    console.log(`💰 ${timestamp} | CREDIT ${type.toUpperCase()} | User: ${userId} | ${currency} ${amount} | Admin: ${adminId || 'system'}`);
    if (notes) {
      console.log(`   📝 Notes: ${notes}`);
    }

    // Métricas específicas de crédito
    if (!this.metrics.credit_operations) {
      this.metrics.credit_operations = { grants: 0, uses: 0, checks: 0, total_amount: 0 };
    }

    if (type === 'grant') {
      this.metrics.credit_operations.grants++;
      this.metrics.credit_operations.total_amount += amount;
    } else if (type === 'use') {
      this.metrics.credit_operations.uses++;
    } else if (type === 'check_eligibility') {
      this.metrics.credit_operations.checks++;
    }

    return operation;
  }

  // 🚨 Sistema de alertas automáticos
  checkForAlerts(endpoint, method, duration, status) {
    const now = Date.now();
    
    // Alerta: Response time muito alto
    if (duration > 5000) {
      this.createAlert('HIGH_RESPONSE_TIME', 
        `Endpoint ${method} ${endpoint} respondeu em ${duration}ms`, 
        { endpoint, method, duration, status });
    }

    // Alerta: Muitos erros em sequência
    const recentErrors = this.metrics.api_calls[`${method} ${endpoint}`]?.errors || 0;
    const recentCalls = this.metrics.api_calls[`${method} ${endpoint}`]?.count || 0;
    
    if (recentCalls > 10 && (recentErrors / recentCalls) > 0.5) {
      this.createAlert('HIGH_ERROR_RATE',
        `Alta taxa de erro no endpoint ${method} ${endpoint}: ${((recentErrors/recentCalls)*100).toFixed(1)}%`,
        { endpoint, method, error_rate: recentErrors/recentCalls });
    }

    // Alerta: Endpoint de admin sendo usado muito frequentemente
    if (endpoint.includes('/admin/') && this.metrics.api_calls[`${method} ${endpoint}`]?.count > 100) {
      this.createAlert('HIGH_ADMIN_USAGE',
        `Uso intenso de endpoint admin: ${method} ${endpoint}`,
        { endpoint, method, count: this.metrics.api_calls[`${method} ${endpoint}`].count });
    }
  }

  // 🚨 Criar alerta
  createAlert(type, message, data = {}) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      data,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(type),
      resolved: false
    };

    this.alerts.push(alert);
    
    // Manter apenas últimos 100 alertas
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    const severityIcon = alert.severity === 'HIGH' ? '🔴' : 
                        alert.severity === 'MEDIUM' ? '🟡' : '🟢';
    
    console.log(`🚨 ${severityIcon} ALERT [${type}] ${message}`);
    
    return alert;
  }

  getAlertSeverity(type) {
    const severityMap = {
      'HIGH_RESPONSE_TIME': 'MEDIUM',
      'HIGH_ERROR_RATE': 'HIGH',
      'HIGH_ADMIN_USAGE': 'MEDIUM',
      'SYSTEM_OVERLOAD': 'HIGH',
      'DATABASE_ERROR': 'HIGH',
      'SECURITY_BREACH': 'HIGH'
    };
    
    return severityMap[type] || 'LOW';
  }

  // 📊 Coletar métricas do sistema
  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics.system_health.memory_usage.push({
      timestamp: new Date().toISOString(),
      heap_used: memUsage.heapUsed,
      heap_total: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss
    });

    this.metrics.system_health.cpu_usage.push({
      timestamp: new Date().toISOString(),
      user: cpuUsage.user,
      system: cpuUsage.system
    });

    // Manter apenas últimas 100 medições
    if (this.metrics.system_health.memory_usage.length > 100) {
      this.metrics.system_health.memory_usage = this.metrics.system_health.memory_usage.slice(-100);
    }

    if (this.metrics.system_health.cpu_usage.length > 100) {
      this.metrics.system_health.cpu_usage = this.metrics.system_health.cpu_usage.slice(-100);
    }

    // Verificar se há problemas de performance
    const currentMemMB = memUsage.heapUsed / 1024 / 1024;
    if (currentMemMB > 500) { // Mais de 500MB
      this.createAlert('HIGH_MEMORY_USAGE',
        `Uso de memória alto: ${currentMemMB.toFixed(1)}MB`,
        { memory_mb: currentMemMB });
    }
  }

  // 📈 Gerar relatório de dashboard
  generateDashboard() {
    const uptime = Date.now() - this.metrics.system_health.uptime;
    const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(1);
    
    // Top endpoints por uso
    const topEndpoints = Object.entries(this.metrics.api_calls)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10);

    // Últimos alertas não resolvidos
    const activeAlerts = this.alerts.filter(a => !a.resolved);

    // Últimas ações admin
    const recentAdminActions = this.metrics.admin_actions.slice(-10);

    const dashboard = {
      timestamp: new Date().toISOString(),
      uptime_hours: parseFloat(uptimeHours),
      active_users: this.metrics.active_users.size,
      total_api_calls: Object.values(this.metrics.api_calls).reduce((sum, api) => sum + api.count, 0),
      active_alerts: activeAlerts.length,
      top_endpoints: topEndpoints.map(([endpoint, data]) => ({
        endpoint,
        calls: data.count,
        avg_duration: Math.round(data.avg_duration),
        error_rate: data.errors > 0 ? ((data.errors / data.count) * 100).toFixed(1) + '%' : '0%'
      })),
      recent_alerts: activeAlerts.slice(-5).map(alert => ({
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        timestamp: alert.timestamp
      })),
      recent_admin_actions: recentAdminActions.map(action => ({
        admin: action.admin_id,
        action: action.action,
        target: action.target_user_id,
        timestamp: action.timestamp,
        success: action.result?.success
      })),
      credit_operations: this.metrics.credit_operations || { grants: 0, uses: 0, checks: 0, total_amount: 0 },
      system_health: {
        memory_mb: this.metrics.system_health.memory_usage.length > 0 ? 
          (this.metrics.system_health.memory_usage[this.metrics.system_health.memory_usage.length - 1].heap_used / 1024 / 1024).toFixed(1) : 'N/A',
        db_connections: this.metrics.system_health.db_connections
      }
    };

    return dashboard;
  }

  // 💾 Salvar métricas em arquivo
  async saveMetrics() {
    try {
      const metricsToSave = {
        ...this.metrics,
        active_users: Array.from(this.metrics.active_users)
      };
      
      await fs.writeFile(this.metricsFile, JSON.stringify(metricsToSave, null, 2));
      await fs.writeFile(this.alertsFile, JSON.stringify(this.alerts, null, 2));
      
      console.log(`💾 Métricas salvas: ${Object.keys(this.metrics.api_calls).length} endpoints monitorados`);
    } catch (error) {
      console.error('❌ Erro ao salvar métricas:', error);
    }
  }

  // 📊 Endpoint para dashboard
  getDashboardData() {
    return this.generateDashboard();
  }

  // 🚨 Endpoint para alertas
  getActiveAlerts() {
    return this.alerts.filter(a => !a.resolved);
  }

  // ✅ Resolver alerta
  resolveAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolved_at = new Date().toISOString();
      console.log(`✅ Alerta resolvido: ${alert.type} - ${alert.message}`);
      return true;
    }
    return false;
  }

  // 👤 Registrar usuário ativo
  registerActiveUser(userId) {
    if (userId) {
      this.metrics.active_users.add(userId);
    }
  }

  // 📊 Middleware para Express
  createMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Capturar user ID do token/sessão
      const userId = req.user?.id || req.headers['user-id'] || null;
      if (userId) {
        this.registerActiveUser(userId);
      }

      // Hook para capturar response
      const originalSend = res.send;
      res.send = function(data) {
        const duration = Date.now() - startTime;
        const endpoint = req.route?.path || req.url;
        
        // Log da chamada
        monitoring.logAPICall(
          endpoint,
          req.method,
          userId,
          duration,
          res.statusCode,
          {
            ip: req.ip,
            user_agent: req.get('User-Agent'),
            body_size: data ? data.length : 0
          }
        );
        
        return originalSend.call(this, data);
      };

      next();
    };
  }
}

// Instância global
const monitoring = new AdvancedMonitoring();

module.exports = {
  monitoring,
  AdvancedMonitoring
};
