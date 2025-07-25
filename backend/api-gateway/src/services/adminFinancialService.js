import { db } from '../../../common/db.js';
import logger from '../../../common/logger.js';

/**
 * Serviço de Extrato Financeiro para Administração
 * Dashboard completo para controle financeiro da empresa
 */
export class AdminFinancialService {

  /**
   * Obter dashboard financeiro completo para admin
   */
  static async getAdminDashboard(options = {}) {
    try {
      const {
        start_date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
        end_date = new Date(),
        currency = 'all'
      } = options;

      // Buscar dados em paralelo
      const [
        revenueData,
        withdrawalData,
        userStats,
        affiliateStats,
        operationStats,
        stripeBalance,
        reconciliationStatus,
        systemAlerts
      ] = await Promise.all([
        this.getRevenueData(start_date, end_date, currency),
        this.getWithdrawalData(start_date, end_date, currency),
        this.getUserStatistics(start_date, end_date),
        this.getAffiliateStatistics(start_date, end_date),
        this.getOperationStatistics(start_date, end_date),
        this.getStripeBalanceData(),
        this.getReconciliationStatus(),
        this.getSystemAlerts()
      ]);

      // Calcular métricas principais
      const metrics = this.calculateKeyMetrics(revenueData, withdrawalData, userStats);

      return {
        period: {
          start_date,
          end_date,
          days: Math.ceil((end_date - start_date) / (1000 * 60 * 60 * 24))
        },
        key_metrics: metrics,
        revenue: revenueData,
        withdrawals: withdrawalData,
        users: userStats,
        affiliates: affiliateStats,
        operations: operationStats,
        stripe_balance: stripeBalance,
        reconciliation: reconciliationStatus,
        alerts: systemAlerts,
        generated_at: new Date()
      };

    } catch (error) {
      logger.error('Erro ao gerar dashboard admin:', error);
      throw error;
    }
  }

  /**
   * Obter dados de receita
   */
  static async getRevenueData(startDate, endDate, currency = 'all') {
    let query = db('payments')
      .where('status', 'succeeded')
      .whereBetween('paid_at', [startDate, endDate]);

    if (currency !== 'all') {
      query = query.where('currency', currency);
    }

    const [
      totalRevenue,
      revenueByType,
      revenueByDay,
      revenueByMethod
    ] = await Promise.all([
      // Receita total
      query.clone()
        .sum('amount as total')
        .groupBy('currency')
        .select('currency'),

      // Receita por tipo
      query.clone()
        .sum('amount as total')
        .count('* as count')
        .groupBy('type', 'currency')
        .select('type', 'currency'),

      // Receita por dia
      query.clone()
        .select(db.raw('DATE(paid_at) as date'))
        .sum('amount as total')
        .count('* as transactions')
        .groupBy(db.raw('DATE(paid_at)'), 'currency')
        .select('currency')
        .orderBy('date'),

      // Receita por método de pagamento
      query.clone()
        .sum('amount as total')
        .count('* as count')
        .groupBy('payment_method', 'currency')
        .select('payment_method', 'currency')
    ]);

    return {
      total: this.formatCurrencyGroups(totalRevenue),
      by_type: this.formatCurrencyGroups(revenueByType, 'type'),
      by_day: this.formatDailyData(revenueByDay),
      by_payment_method: this.formatCurrencyGroups(revenueByMethod, 'payment_method')
    };
  }

  /**
   * Obter dados de saques
   */
  static async getWithdrawalData(startDate, endDate, currency = 'all') {
    let query = db('withdrawal_requests')
      .whereBetween('created_at', [startDate, endDate]);

    if (currency !== 'all') {
      query = query.where('currency', currency);
    }

    const [
      totalWithdrawals,
      withdrawalsByStatus,
      withdrawalsByType,
      pendingWithdrawals
    ] = await Promise.all([
      // Total de saques
      query.clone()
        .sum('amount as total_requested')
        .sum('net_amount as total_net')
        .sum('fee_amount as total_fees')
        .groupBy('currency')
        .select('currency'),

      // Saques por status
      query.clone()
        .sum('amount as total')
        .count('* as count')
        .groupBy('status', 'currency')
        .select('status', 'currency'),

      // Saques por tipo
      query.clone()
        .sum('amount as total')
        .count('* as count')
        .groupBy('withdrawal_type', 'currency')
        .select('withdrawal_type', 'currency'),

      // Saques pendentes
      db('withdrawal_requests')
        .where('status', 'pending')
        .sum('amount as total')
        .count('* as count')
        .groupBy('currency')
        .select('currency')
    ]);

    return {
      total: this.formatCurrencyGroups(totalWithdrawals),
      by_status: this.formatCurrencyGroups(withdrawalsByStatus, 'status'),
      by_type: this.formatCurrencyGroups(withdrawalsByType, 'withdrawal_type'),
      pending: this.formatCurrencyGroups(pendingWithdrawals)
    };
  }

  /**
   * Obter estatísticas de usuários
   */
  static async getUserStatistics(startDate, endDate) {
    const [
      newUsers,
      activeUsers,
      usersByTier,
      userRevenue
    ] = await Promise.all([
      // Novos usuários
      db('users')
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first(),

      // Usuários ativos (com operações)
      db('operation_logs')
        .whereBetween('created_at', [startDate, endDate])
        .countDistinct('user_id as count')
        .first(),

      // Usuários por tier de afiliado
      db('users')
        .leftJoin('affiliate_tiers', 'users.affiliate_tier_id', 'affiliate_tiers.id')
        .count('users.id as count')
        .groupBy('affiliate_tiers.name')
        .select('affiliate_tiers.name as tier'),

      // Receita por usuário (top 10)
      db('payments')
        .leftJoin('users', 'payments.user_id', 'users.id')
        .where('payments.status', 'succeeded')
        .whereBetween('payments.paid_at', [startDate, endDate])
        .sum('payments.amount as total_revenue')
        .count('payments.id as total_payments')
        .groupBy('users.id', 'users.name', 'users.email')
        .select('users.id', 'users.name', 'users.email')
        .orderBy('total_revenue', 'desc')
        .limit(10)
    ]);

    return {
      new_users: parseInt(newUsers.count),
      active_users: parseInt(activeUsers.count),
      by_tier: usersByTier,
      top_revenue_users: userRevenue.map(user => ({
        ...user,
        total_revenue: parseFloat(user.total_revenue),
        total_payments: parseInt(user.total_payments)
      }))
    };
  }

  /**
   * Obter estatísticas de afiliados
   */
  static async getAffiliateStatistics(startDate, endDate) {
    const [
      totalCommissions,
      commissionsByTier,
      topAffiliates
    ] = await Promise.all([
      // Total de comissões pagas
      db('affiliate_commissions')
        .where('status', 'paid')
        .whereBetween('paid_at', [startDate, endDate])
        .sum('commission_amount as total')
        .count('* as count')
        .first(),

      // Comissões por tier
      db('affiliate_commissions')
        .where('status', 'paid')
        .whereBetween('paid_at', [startDate, endDate])
        .sum('commission_amount as total')
        .count('* as count')
        .groupBy('tier_name')
        .select('tier_name'),

      // Top afiliados
      db('affiliate_commissions')
        .leftJoin('users', 'affiliate_commissions.affiliate_id', 'users.id')
        .where('affiliate_commissions.status', 'paid')
        .whereBetween('affiliate_commissions.paid_at', [startDate, endDate])
        .sum('affiliate_commissions.commission_amount as total_earned')
        .count('affiliate_commissions.id as total_commissions')
        .groupBy('users.id', 'users.name', 'users.email')
        .select('users.id', 'users.name', 'users.email')
        .orderBy('total_earned', 'desc')
        .limit(10)
    ]);

    return {
      total_commissions: {
        amount: parseFloat(totalCommissions.total || 0),
        count: parseInt(totalCommissions.count)
      },
      by_tier: commissionsByTier.map(tier => ({
        tier_name: tier.tier_name,
        total: parseFloat(tier.total),
        count: parseInt(tier.count)
      })),
      top_affiliates: topAffiliates.map(affiliate => ({
        ...affiliate,
        total_earned: parseFloat(affiliate.total_earned),
        total_commissions: parseInt(affiliate.total_commissions)
      }))
    };
  }

  /**
   * Obter estatísticas de operações
   */
  static async getOperationStatistics(startDate, endDate) {
    const [
      totalOperations,
      operationsByType,
      profitLoss
    ] = await Promise.all([
      // Total de operações
      db('operation_logs')
        .whereBetween('created_at', [startDate, endDate])
        .count('* as total')
        .sum('amount as volume')
        .first(),

      // Operações por tipo
      db('operation_logs')
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .sum('amount as volume')
        .groupBy('operation_type')
        .select('operation_type'),

      // Lucro/Prejuízo
      db('operation_logs')
        .whereBetween('created_at', [startDate, endDate])
        .select(
          db.raw(`
            SUM(CASE WHEN operation_direction = 'credit' THEN amount ELSE 0 END) as total_profits,
            SUM(CASE WHEN operation_direction = 'debit' THEN amount ELSE 0 END) as total_losses,
            COUNT(CASE WHEN operation_direction = 'credit' THEN 1 END) as profitable_operations,
            COUNT(CASE WHEN operation_direction = 'debit' THEN 1 END) as loss_operations
          `)
        )
        .first()
    ]);

    const successRate = (totalOperations.total > 0) ? 
      (profitLoss.profitable_operations / totalOperations.total * 100) : 0;

    return {
      total: {
        operations: parseInt(totalOperations.total),
        volume: parseFloat(totalOperations.volume || 0)
      },
      by_type: operationsByType.map(op => ({
        type: op.operation_type,
        count: parseInt(op.count),
        volume: parseFloat(op.volume)
      })),
      profit_loss: {
        total_profits: parseFloat(profitLoss.total_profits || 0),
        total_losses: parseFloat(profitLoss.total_losses || 0),
        net_result: parseFloat(profitLoss.total_profits || 0) - parseFloat(profitLoss.total_losses || 0),
        profitable_operations: parseInt(profitLoss.profitable_operations),
        loss_operations: parseInt(profitLoss.loss_operations),
        success_rate: parseFloat(successRate.toFixed(2))
      }
    };
  }

  /**
   * Obter dados do saldo Stripe
   */
  static async getStripeBalanceData() {
    try {
      // Buscar último snapshot
      const latestSnapshot = await db('stripe_balance_snapshots')
        .orderBy('snapshot_date', 'desc')
        .first();

      if (!latestSnapshot) {
        return {
          available: { BRL: 0, USD: 0 },
          pending: { BRL: 0, USD: 0 },
          last_updated: null
        };
      }

      return {
        available: {
          BRL: parseFloat(latestSnapshot.total_available_brl),
          USD: parseFloat(latestSnapshot.total_available_usd)
        },
        pending: {
          BRL: parseFloat(latestSnapshot.total_pending_brl),
          USD: parseFloat(latestSnapshot.total_pending_usd)
        },
        last_updated: latestSnapshot.snapshot_date,
        raw_data: latestSnapshot.available_balance
      };

    } catch (error) {
      logger.error('Erro ao obter dados do Stripe:', error);
      return {
        available: { BRL: 0, USD: 0 },
        pending: { BRL: 0, USD: 0 },
        last_updated: null,
        error: 'Erro ao carregar dados'
      };
    }
  }

  /**
   * Obter status de reconciliação
   */
  static async getReconciliationStatus() {
    const [
      pendingReconciliation,
      discrepancies,
      lastReconciliation
    ] = await Promise.all([
      // Reconciliações pendentes
      db('payment_reconciliation')
        .where('reconciliation_status', 'pending')
        .count('* as count')
        .sum('gateway_amount as total')
        .first(),

      // Discrepâncias
      db('payment_reconciliation')
        .where('reconciliation_status', 'discrepancy')
        .count('* as count')
        .first(),

      // Última reconciliação
      db('payment_reconciliation')
        .orderBy('reconciled_at', 'desc')
        .first()
    ]);

    return {
      pending: {
        count: parseInt(pendingReconciliation.count),
        total_amount: parseFloat(pendingReconciliation.total || 0)
      },
      discrepancies: parseInt(discrepancies.count),
      last_reconciliation: lastReconciliation ? lastReconciliation.reconciled_at : null
    };
  }

  /**
   * Obter alertas do sistema
   */
  static async getSystemAlerts() {
    const alerts = await db('system_alerts')
      .where('resolved', false)
      .orderBy('created_at', 'desc')
      .limit(10);

    return alerts.map(alert => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      created_at: alert.created_at,
      data: alert.data
    }));
  }

  /**
   * Calcular métricas principais
   */
  static calculateKeyMetrics(revenueData, withdrawalData, userStats) {
    const totalRevenueBRL = revenueData.total.BRL?.total || 0;
    const totalRevenueUSD = revenueData.total.USD?.total || 0;
    const totalWithdrawalsBRL = withdrawalData.total.BRL?.total_net || 0;
    const totalWithdrawalsUSD = withdrawalData.total.USD?.total_net || 0;

    return {
      gross_revenue: {
        BRL: totalRevenueBRL,
        USD: totalRevenueUSD
      },
      net_revenue: {
        BRL: totalRevenueBRL - totalWithdrawalsBRL,
        USD: totalRevenueUSD - totalWithdrawalsUSD
      },
      total_fees: {
        BRL: withdrawalData.total.BRL?.total_fees || 0,
        USD: withdrawalData.total.USD?.total_fees || 0
      },
      user_growth: userStats.new_users,
      active_users: userStats.active_users
    };
  }

  /**
   * Formatar dados agrupados por moeda
   */
  static formatCurrencyGroups(data, groupBy = null) {
    const formatted = {};

    data.forEach(item => {
      const currency = item.currency || 'BRL';
      
      if (!formatted[currency]) {
        formatted[currency] = {};
      }

      if (groupBy) {
        const key = item[groupBy] || 'unknown';
        formatted[currency][key] = {
          total: parseFloat(item.total || 0),
          count: parseInt(item.count || 0)
        };
      } else {
        Object.keys(item).forEach(key => {
          if (key !== 'currency') {
            formatted[currency][key] = parseFloat(item[key] || 0);
          }
        });
      }
    });

    return formatted;
  }

  /**
   * Formatar dados diários
   */
  static formatDailyData(data) {
    const formatted = {};

    data.forEach(item => {
      const currency = item.currency || 'BRL';
      const date = item.date;

      if (!formatted[currency]) {
        formatted[currency] = [];
      }

      formatted[currency].push({
        date,
        total: parseFloat(item.total || 0),
        transactions: parseInt(item.transactions || 0)
      });
    });

    return formatted;
  }

  /**
   * Gerar relatório de reconciliação
   */
  static async generateReconciliationReport(startDate, endDate) {
    try {
      const discrepancies = await db('payment_reconciliation')
        .leftJoin('payments', 'payment_reconciliation.payment_id', 'payments.id')
        .where('payment_reconciliation.reconciliation_status', 'discrepancy')
        .whereBetween('payment_reconciliation.created_at', [startDate, endDate])
        .select(
          'payment_reconciliation.*',
          'payments.amount as payment_amount',
          'payments.stripe_payment_intent_id'
        );

      const summary = await db('payment_reconciliation')
        .whereBetween('created_at', [startDate, endDate])
        .select(
          db.raw('COUNT(*) as total_transactions'),
          db.raw('SUM(CASE WHEN reconciliation_status = "matched" THEN 1 ELSE 0 END) as matched'),
          db.raw('SUM(CASE WHEN reconciliation_status = "discrepancy" THEN 1 ELSE 0 END) as discrepancies'),
          db.raw('SUM(CASE WHEN reconciliation_status = "pending" THEN 1 ELSE 0 END) as pending')
        )
        .first();

      return {
        period: { start_date: startDate, end_date: endDate },
        summary: {
          total_transactions: parseInt(summary.total_transactions),
          matched: parseInt(summary.matched),
          discrepancies: parseInt(summary.discrepancies),
          pending: parseInt(summary.pending),
          match_rate: summary.total_transactions > 0 ? 
            (summary.matched / summary.total_transactions * 100).toFixed(2) : '0'
        },
        discrepancies: discrepancies.map(disc => ({
          id: disc.id,
          payment_id: disc.payment_id,
          stripe_payment_intent: disc.stripe_payment_intent_id,
          payment_amount: parseFloat(disc.payment_amount),
          gateway_amount: parseFloat(disc.gateway_amount),
          difference: parseFloat(disc.payment_amount) - parseFloat(disc.gateway_amount),
          notes: disc.reconciliation_notes,
          created_at: disc.created_at
        })),
        generated_at: new Date()
      };

    } catch (error) {
      logger.error('Erro ao gerar relatório de reconciliação:', error);
      throw error;
    }
  }

  /**
   * Exportar dados financeiros
   */
  static async exportFinancialData(startDate, endDate, format = 'json') {
    try {
      const dashboard = await this.getAdminDashboard({
        start_date: startDate,
        end_date: endDate
      });

      if (format === 'csv') {
        return this.convertDashboardToCSV(dashboard);
      }

      return dashboard;

    } catch (error) {
      logger.error('Erro ao exportar dados financeiros:', error);
      throw error;
    }
  }

  /**
   * Converter dashboard para CSV
   */
  static convertDashboardToCSV(dashboard) {
    // Implementação básica - pode ser expandida
    const csvData = {
      revenue_summary: {
        headers: ['Currency', 'Total Revenue', 'Transaction Count'],
        rows: []
      },
      user_stats: {
        headers: ['Metric', 'Value'],
        rows: [
          ['New Users', dashboard.users.new_users],
          ['Active Users', dashboard.users.active_users]
        ]
      }
    };

    // Adicionar dados de receita
    Object.keys(dashboard.revenue.total).forEach(currency => {
      const data = dashboard.revenue.total[currency];
      csvData.revenue_summary.rows.push([
        currency,
        data.total || 0,
        data.count || 0
      ]);
    });

    return csvData;
  }
}

export default AdminFinancialService;
