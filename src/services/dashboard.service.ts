// ========================================
// MARKETBOT - DASHBOARD SERVICE
// Sistema de dashboard real-time para administração
// ========================================

import { Pool } from 'pg';
import { DatabaseService } from './database.service';
import { EventEmitter } from 'events';

export interface DashboardMetrics {
  // Métricas de usuários
  total_users: number;
  active_users_24h: number;
  new_users_today: number;
  users_with_2fa: number;
  
  // Métricas financeiras
  total_balance_usd: number;
  total_balance_brl: number;
  total_withdrawals_pending: number;
  total_commissions_today: number;
  
  // Métricas de trading
  active_positions: number;
  positions_today: number;
  total_pnl_today: number;
  success_rate_today: number;
  
  // Métricas de sistema
  active_blocked_ips: number;
  suspicious_activities_24h: number;
  failed_logins_1h: number;
  system_uptime: number;
  
  // Métricas de performance
  avg_response_time_ms: number;
  requests_per_minute: number;
  error_rate_percentage: number;
  
  // Timestamps
  last_updated: Date;
  update_interval_seconds: number;
}

export interface SystemAlert {
  id: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  title: string;
  message: string;
  component: string;
  timestamp: Date;
  resolved: boolean;
  auto_resolve: boolean;
}

export interface ActiveUser {
  user_id: string;
  email: string;
  user_type: string;
  last_activity: Date;
  active_positions: number;
  current_session_duration: number;
  ip_address: string;
}

export interface RecentActivity {
  id: string;
  type: 'LOGIN' | 'TRADE' | 'WITHDRAWAL' | 'DEPOSIT' | 'SECURITY';
  user_email: string;
  description: string;
  amount?: number;
  currency?: string;
  timestamp: Date;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export class DashboardService extends EventEmitter {
  private static instance: DashboardService;
  private db: Pool;
  private metricsCache: DashboardMetrics | null = null;
  private alertsCache: SystemAlert[] = [];
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL_MS = 30000; // 30 segundos

  constructor() {
    super();
    const dbService = DatabaseService.getInstance();
    this.db = dbService.getPool();
    this.startMetricsUpdater();
  }

  static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  // ========================================
  // MÉTRICAS PRINCIPAIS
  // ========================================

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    if (this.metricsCache && this.isCacheValid()) {
      return this.metricsCache;
    }

    try {
      const metrics = await this.calculateMetrics();
      this.metricsCache = metrics;
      this.emit('metrics_updated', metrics);
      return metrics;
    } catch (error) {
      console.error('❌ Erro ao buscar métricas do dashboard:', error);
      throw error;
    }
  }

  private async calculateMetrics(): Promise<DashboardMetrics> {
    const queries = await Promise.all([
      // Métricas de usuários
      this.db.query('SELECT COUNT(*) as total_users FROM users'),
      this.db.query(`
        SELECT COUNT(*) as active_users_24h 
        FROM users 
        WHERE last_login_at > NOW() - INTERVAL '24 hours'
      `),
      this.db.query(`
        SELECT COUNT(*) as new_users_today 
        FROM users 
        WHERE created_at >= CURRENT_DATE
      `),
      this.db.query(`
        SELECT COUNT(*) as users_with_2fa 
        FROM user_2fa 
        WHERE is_enabled = true
      `),

      // Métricas financeiras
      this.db.query(`
        SELECT 
          COALESCE(SUM(account_balance_usd), 0) as total_balance_usd,
          COALESCE(SUM(commission_balance_brl), 0) as total_balance_brl
        FROM users
      `),
      this.db.query(`
        SELECT COUNT(*) as total_withdrawals_pending 
        FROM withdrawals 
        WHERE status = 'PENDING'
      `),
      this.db.query(`
        SELECT COALESCE(SUM(amount_brl), 0) as total_commissions_today
        FROM commission_transactions 
        WHERE created_at >= CURRENT_DATE
      `),

      // Métricas de trading
      this.db.query(`
        SELECT COUNT(*) as active_positions 
        FROM trading_positions 
        WHERE status = 'OPEN'
      `),
      this.db.query(`
        SELECT 
          COUNT(*) as positions_today,
          COALESCE(SUM(pnl_usd), 0) as total_pnl_today,
          COALESCE(AVG(CASE WHEN pnl_usd > 0 THEN 1.0 ELSE 0.0 END) * 100, 0) as success_rate_today
        FROM trading_positions 
        WHERE created_at >= CURRENT_DATE
      `),

      // Métricas de segurança
      this.db.query(`
        SELECT COUNT(*) as active_blocked_ips 
        FROM blocked_ips 
        WHERE blocked_until > NOW()
      `),
      this.db.query(`
        SELECT COUNT(*) as suspicious_activities_24h 
        FROM suspicious_activities 
        WHERE detected_at > NOW() - INTERVAL '24 hours'
      `),

      // Sistema
      this.db.query(`
        SELECT COUNT(*) as failed_logins_1h 
        FROM login_attempts 
        WHERE success = false AND created_at > NOW() - INTERVAL '1 hour'
      `)
    ]);

    const [
      totalUsers, activeUsers24h, newUsersToday, usersWith2FA,
      balances, withdrawalsPending, commissionsToday,
      activePositions, tradingStats,
      blockedIPs, suspiciousActivities, failedLogins
    ] = queries;

    return {
      // Usuários
      total_users: parseInt(totalUsers.rows[0].total_users),
      active_users_24h: parseInt(activeUsers24h.rows[0].active_users_24h),
      new_users_today: parseInt(newUsersToday.rows[0].new_users_today),
      users_with_2fa: parseInt(usersWith2FA.rows[0].users_with_2fa),

      // Financeiro
      total_balance_usd: parseFloat(balances.rows[0].total_balance_usd || '0'),
      total_balance_brl: parseFloat(balances.rows[0].total_balance_brl || '0'),
      total_withdrawals_pending: parseInt(withdrawalsPending.rows[0].total_withdrawals_pending),
      total_commissions_today: parseFloat(commissionsToday.rows[0].total_commissions_today || '0'),

      // Trading
      active_positions: parseInt(activePositions.rows[0].active_positions),
      positions_today: parseInt(tradingStats.rows[0].positions_today || '0'),
      total_pnl_today: parseFloat(tradingStats.rows[0].total_pnl_today || '0'),
      success_rate_today: parseFloat(tradingStats.rows[0].success_rate_today || '0'),

      // Segurança
      active_blocked_ips: parseInt(blockedIPs.rows[0].active_blocked_ips),
      suspicious_activities_24h: parseInt(suspiciousActivities.rows[0].suspicious_activities_24h),
      failed_logins_1h: parseInt(failedLogins.rows[0].failed_logins_1h),

      // Sistema (valores mocados por enquanto)
      system_uptime: this.calculateUptime(),
      avg_response_time_ms: this.getAverageResponseTime(),
      requests_per_minute: this.getRequestsPerMinute(),
      error_rate_percentage: this.getErrorRate(),

      // Meta
      last_updated: new Date(),
      update_interval_seconds: this.UPDATE_INTERVAL_MS / 1000
    };
  }

  // ========================================
  // USUÁRIOS ATIVOS
  // ========================================

  async getActiveUsers(limit: number = 50): Promise<ActiveUser[]> {
    try {
      const result = await this.db.query(`
        SELECT 
          u.id as user_id,
          u.email,
          u.user_type,
          u.last_login_at as last_activity,
          COUNT(tp.id) as active_positions,
          EXTRACT(EPOCH FROM (NOW() - u.last_login_at)) as session_duration
        FROM users u
        LEFT JOIN trading_positions tp ON u.id = tp.user_id AND tp.status = 'OPEN'
        WHERE u.last_login_at > NOW() - INTERVAL '2 hours'
        GROUP BY u.id, u.email, u.user_type, u.last_login_at
        ORDER BY u.last_login_at DESC
        LIMIT $1
      `, [limit]);

      return result.rows.map(row => ({
        user_id: row.user_id,
        email: row.email,
        user_type: row.user_type,
        last_activity: row.last_activity,
        active_positions: parseInt(row.active_positions),
        current_session_duration: parseInt(row.session_duration || '0'),
        ip_address: '0.0.0.0' // TODO: Implementar tracking de IP por sessão
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar usuários ativos:', error);
      return [];
    }
  }

  // ========================================
  // ATIVIDADES RECENTES
  // ========================================

  async getRecentActivities(limit: number = 100): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = [];

      // Buscar atividades de diferentes fontes
      const [trades, withdrawals, logins] = await Promise.all([
        this.getRecentTrades(limit / 3),
        this.getRecentWithdrawals(limit / 3),
        this.getRecentLogins(limit / 3)
      ]);

      activities.push(...trades, ...withdrawals, ...logins);

      // Ordenar por timestamp mais recente
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

    } catch (error) {
      console.error('❌ Erro ao buscar atividades recentes:', error);
      return [];
    }
  }

  private async getRecentTrades(limit: number): Promise<RecentActivity[]> {
    const result = await this.db.query(`
      SELECT 
        tp.id,
        u.email,
        tp.symbol,
        tp.side,
        tp.quantity,
        tp.pnl_usd,
        tp.status,
        tp.created_at
      FROM trading_positions tp
      JOIN users u ON tp.user_id = u.id
      ORDER BY tp.created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => ({
      id: `trade_${row.id}`,
      type: 'TRADE' as const,
      user_email: row.email,
      description: `${row.side.toUpperCase()} ${row.quantity} ${row.symbol}`,
      amount: parseFloat(row.pnl_usd || '0'),
      currency: 'USD',
      timestamp: row.created_at,
      status: row.status === 'CLOSED' ? 'SUCCESS' : 'PENDING' as const
    }));
  }

  private async getRecentWithdrawals(limit: number): Promise<RecentActivity[]> {
    const result = await this.db.query(`
      SELECT 
        w.id,
        u.email,
        w.amount,
        w.currency,
        w.status,
        w.created_at
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => ({
      id: `withdrawal_${row.id}`,
      type: 'WITHDRAWAL' as const,
      user_email: row.email,
      description: `Saque de ${row.currency}`,
      amount: parseFloat(row.amount),
      currency: row.currency,
      timestamp: row.created_at,
      status: row.status as 'SUCCESS' | 'PENDING' | 'FAILED'
    }));
  }

  private async getRecentLogins(limit: number): Promise<RecentActivity[]> {
    const result = await this.db.query(`
      SELECT 
        la.id,
        u.email,
        la.success,
        la.created_at,
        la.ip_address
      FROM login_attempts la
      JOIN users u ON la.user_id = u.id
      ORDER BY la.created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => ({
      id: `login_${row.id}`,
      type: 'LOGIN' as const,
      user_email: row.email,
      description: `Login de ${row.ip_address}`,
      timestamp: row.created_at,
      status: row.success ? 'SUCCESS' : 'FAILED' as const
    }));
  }

  // ========================================
  // ALERTAS DO SISTEMA
  // ========================================

  async getSystemAlerts(): Promise<SystemAlert[]> {
    return this.alertsCache.filter(alert => !alert.resolved);
  }

  async createAlert(type: SystemAlert['type'], title: string, message: string, component: string): Promise<void> {
    const alert: SystemAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      component,
      timestamp: new Date(),
      resolved: false,
      auto_resolve: type === 'INFO' || type === 'WARNING'
    };

    this.alertsCache.push(alert);
    this.emit('alert_created', alert);

    // Auto-resolver alertas de baixa prioridade após 5 minutos
    if (alert.auto_resolve) {
      setTimeout(() => {
        this.resolveAlert(alert.id);
      }, 5 * 60 * 1000);
    }

    console.log(`🚨 Alerta criado: ${type} - ${title}`);
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alertsCache.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.emit('alert_resolved', alert);
      console.log(`✅ Alerta resolvido: ${alert.title}`);
    }
  }

  // ========================================
  // UTILITÁRIOS PRIVADOS
  // ========================================

  private startMetricsUpdater(): void {
    this.updateInterval = setInterval(async () => {
      try {
        await this.getDashboardMetrics();
      } catch (error) {
        console.error('❌ Erro na atualização automática de métricas:', error);
      }
    }, this.UPDATE_INTERVAL_MS);
  }

  private isCacheValid(): boolean {
    if (!this.metricsCache) return false;
    
    const now = new Date();
    const cacheAge = now.getTime() - this.metricsCache.last_updated.getTime();
    return cacheAge < this.UPDATE_INTERVAL_MS;
  }

  private calculateUptime(): number {
    // TODO: Implementar cálculo real de uptime
    return 99.9;
  }

  private getAverageResponseTime(): number {
    // TODO: Implementar cálculo real de response time
    return 150;
  }

  private getRequestsPerMinute(): number {
    // TODO: Implementar cálculo real de RPM
    return 45;
  }

  private getErrorRate(): number {
    // TODO: Implementar cálculo real de error rate
    return 0.1;
  }

  // ========================================
  // LIMPEZA E DESTRUIÇÃO
  // ========================================

  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.removeAllListeners();
  }
}

export default DashboardService;
