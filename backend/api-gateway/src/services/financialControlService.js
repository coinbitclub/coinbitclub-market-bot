import Stripe from 'stripe';
import { db } from '../../../common/db.js';
import logger from '../../../common/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Serviço para leitura e controle financeiro completo
 * Integração com Stripe para dados financeiros em tempo real
 */
export class FinancialControlService {
  
  /**
   * Buscar saldo atual da conta Stripe
   */
  static async getStripeBalance() {
    try {
      const balance = await stripe.balance.retrieve();
      
      return {
        available: balance.available.map(b => ({
          amount: b.amount / 100, // Converter centavos para valor real
          currency: b.currency.toUpperCase()
        })),
        pending: balance.pending.map(b => ({
          amount: b.amount / 100,
          currency: b.currency.toUpperCase()
        }))
      };
    } catch (error) {
      logger.error('Erro ao buscar saldo Stripe:', error);
      throw error;
    }
  }

  /**
   * Obter vendas diárias detalhadas
   */
  static async getDailySales(date = new Date()) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Dados do banco local
    const localSales = await db('payments')
      .where('status', 'succeeded')
      .whereBetween('paid_at', [startDate, endDate])
      .select(
        db.raw('currency'),
        db.raw('COUNT(*) as transaction_count'),
        db.raw('SUM(amount) as gross_amount'),
        db.raw('SUM(fee_amount) as total_fees'),
        db.raw('SUM(amount - fee_amount) as net_amount'),
        db.raw('type'),
        db.raw('payment_method')
      )
      .groupBy('currency', 'type', 'payment_method');

    // Dados do Stripe (para validação)
    const stripeCharges = await this.getStripeChargesForDate(date);
    
    // Vendas de assinaturas
    const subscriptionSales = await db('payments')
      .where('type', 'subscription')
      .where('status', 'succeeded')
      .whereBetween('paid_at', [startDate, endDate])
      .select(
        db.raw('COUNT(*) as subscription_count'),
        db.raw('SUM(amount) as subscription_revenue')
      )
      .first();

    // Vendas pré-pagas
    const prepaidSales = await db('payments')
      .where('type', 'prepaid')
      .where('status', 'succeeded')
      .whereBetween('paid_at', [startDate, endDate])
      .select(
        db.raw('COUNT(*) as prepaid_count'),
        db.raw('SUM(amount) as prepaid_revenue')
      )
      .first();

    return {
      date: date.toISOString().split('T')[0],
      local_data: {
        detailed_sales: localSales,
        subscription_sales: subscriptionSales,
        prepaid_sales: prepaidSales
      },
      stripe_data: stripeCharges,
      reconciliation: this.compareLocalVsStripe(localSales, stripeCharges)
    };
  }

  /**
   * Buscar charges do Stripe para uma data específica
   */
  static async getStripeChargesForDate(date) {
    const startTimestamp = Math.floor(new Date(date).setHours(0, 0, 0, 0) / 1000);
    const endTimestamp = Math.floor(new Date(date).setHours(23, 59, 59, 999) / 1000);

    try {
      const charges = await stripe.charges.list({
        created: {
          gte: startTimestamp,
          lte: endTimestamp
        },
        limit: 100
      });

      const summary = {
        total_charges: charges.data.length,
        successful_charges: 0,
        failed_charges: 0,
        total_amount: 0,
        total_fees: 0,
        by_currency: {},
        by_payment_method: {}
      };

      charges.data.forEach(charge => {
        if (charge.status === 'succeeded') {
          summary.successful_charges++;
          summary.total_amount += charge.amount / 100;
          summary.total_fees += (charge.application_fee_amount || 0) / 100;

          // Agrupar por moeda
          const currency = charge.currency.toUpperCase();
          if (!summary.by_currency[currency]) {
            summary.by_currency[currency] = {
              count: 0,
              amount: 0,
              fees: 0
            };
          }
          summary.by_currency[currency].count++;
          summary.by_currency[currency].amount += charge.amount / 100;
          summary.by_currency[currency].fees += (charge.application_fee_amount || 0) / 100;

          // Agrupar por método de pagamento
          const paymentMethod = charge.payment_method_details?.type || 'unknown';
          if (!summary.by_payment_method[paymentMethod]) {
            summary.by_payment_method[paymentMethod] = {
              count: 0,
              amount: 0
            };
          }
          summary.by_payment_method[paymentMethod].count++;
          summary.by_payment_method[paymentMethod].amount += charge.amount / 100;
        } else {
          summary.failed_charges++;
        }
      });

      return summary;
    } catch (error) {
      logger.error('Erro ao buscar charges do Stripe:', error);
      return null;
    }
  }

  /**
   * Obter relatório financeiro mensal completo
   */
  static async getMonthlyFinancialReport(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const [
      monthlyPayments,
      monthlyWithdrawals,
      monthlyCommissions,
      stripeBalance,
      stripeFees,
      chargebacks
    ] = await Promise.all([
      this.getMonthlyPayments(startDate, endDate),
      this.getMonthlyWithdrawals(startDate, endDate),
      this.getMonthlyCommissions(startDate, endDate),
      this.getStripeBalance(),
      this.getStripeFees(startDate, endDate),
      this.getChargebacks(startDate, endDate)
    ]);

    // Cálculos financeiros
    const grossRevenue = monthlyPayments.total_amount;
    const totalFees = stripeFees.total_fees + monthlyWithdrawals.total_fees;
    const netRevenue = grossRevenue - totalFees;
    const totalCommissions = monthlyCommissions.total_paid;
    const netProfit = netRevenue - totalCommissions;

    return {
      period: {
        year,
        month,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      },
      revenue: {
        gross_revenue: grossRevenue,
        net_revenue: netRevenue,
        subscription_revenue: monthlyPayments.subscription_amount,
        prepaid_revenue: monthlyPayments.prepaid_amount
      },
      costs: {
        stripe_fees: stripeFees.total_fees,
        withdrawal_fees: monthlyWithdrawals.total_fees,
        affiliate_commissions: totalCommissions,
        chargebacks: chargebacks.total_amount,
        total_costs: totalFees + totalCommissions + chargebacks.total_amount
      },
      profit: {
        net_profit: netProfit,
        profit_margin: grossRevenue > 0 ? (netProfit / grossRevenue * 100).toFixed(2) : 0
      },
      stripe_account: {
        available_balance: stripeBalance.available,
        pending_balance: stripeBalance.pending
      },
      transactions: {
        total_payments: monthlyPayments.count,
        total_withdrawals: monthlyWithdrawals.count,
        success_rate: monthlyPayments.count > 0 ? 
          (monthlyPayments.successful / monthlyPayments.count * 100).toFixed(2) : 0
      },
      detailed_data: {
        payments: monthlyPayments,
        withdrawals: monthlyWithdrawals,
        commissions: monthlyCommissions,
        fees: stripeFees,
        chargebacks: chargebacks
      }
    };
  }

  /**
   * Controle de fluxo de caixa em tempo real
   */
  static async getCashFlowAnalysis(days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Entradas (pagamentos)
    const dailyIncome = await db('payments')
      .where('status', 'succeeded')
      .whereBetween('paid_at', [startDate, endDate])
      .select(
        db.raw('DATE(paid_at) as date'),
        db.raw('SUM(amount) as income'),
        db.raw('COUNT(*) as transactions')
      )
      .groupBy(db.raw('DATE(paid_at)'))
      .orderBy('date');

    // Saídas (saques + comissões)
    const dailyOutcome = await db.raw(`
      SELECT 
        DATE(created_at) as date,
        SUM(CASE 
          WHEN status = 'completed' AND withdrawal_type = 'user_prepaid' 
          THEN net_amount ELSE 0 END) as user_withdrawals,
        SUM(CASE 
          WHEN status = 'completed' AND withdrawal_type = 'admin_profit' 
          THEN net_amount ELSE 0 END) as admin_withdrawals,
        COUNT(*) as withdrawal_count
      FROM withdrawal_requests 
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [startDate, endDate]);

    const dailyCommissions = await db('affiliate_commissions')
      .where('status', 'paid')
      .whereBetween('created_at', [startDate, endDate])
      .select(
        db.raw('DATE(created_at) as date'),
        db.raw('SUM(commission_amount) as commissions'),
        db.raw('COUNT(*) as commission_count')
      )
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date');

    // Combinar dados por data
    const cashFlow = {};
    
    dailyIncome.forEach(income => {
      cashFlow[income.date] = {
        date: income.date,
        income: parseFloat(income.income),
        transactions: parseInt(income.transactions),
        user_withdrawals: 0,
        admin_withdrawals: 0,
        commissions: 0,
        net_flow: parseFloat(income.income)
      };
    });

    dailyOutcome[0].forEach(outcome => {
      if (cashFlow[outcome.date]) {
        cashFlow[outcome.date].user_withdrawals = parseFloat(outcome.user_withdrawals);
        cashFlow[outcome.date].admin_withdrawals = parseFloat(outcome.admin_withdrawals);
        cashFlow[outcome.date].net_flow -= (parseFloat(outcome.user_withdrawals) + parseFloat(outcome.admin_withdrawals));
      }
    });

    dailyCommissions.forEach(commission => {
      if (cashFlow[commission.date]) {
        cashFlow[commission.date].commissions = parseFloat(commission.commissions);
        cashFlow[commission.date].net_flow -= parseFloat(commission.commissions);
      }
    });

    return {
      period_days: days,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      daily_flow: Object.values(cashFlow),
      summary: {
        total_income: Object.values(cashFlow).reduce((sum, day) => sum + day.income, 0),
        total_user_withdrawals: Object.values(cashFlow).reduce((sum, day) => sum + day.user_withdrawals, 0),
        total_admin_withdrawals: Object.values(cashFlow).reduce((sum, day) => sum + day.admin_withdrawals, 0),
        total_commissions: Object.values(cashFlow).reduce((sum, day) => sum + day.commissions, 0),
        net_cash_flow: Object.values(cashFlow).reduce((sum, day) => sum + day.net_flow, 0)
      }
    };
  }

  /**
   * Detectar anomalias financeiras
   */
  static async detectFinancialAnomalies() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const [
      todayStats,
      yesterdayStats,
      weekAverage,
      suspiciousTransactions,
      failureRates
    ] = await Promise.all([
      this.getDailyStats(today),
      this.getDailyStats(yesterday),
      this.getWeeklyAverage(lastWeek, today),
      this.getSuspiciousTransactions(),
      this.getFailureRates()
    ]);

    const anomalies = [];

    // Verificar volume anômalo
    if (todayStats.total_amount > weekAverage.avg_amount * 2) {
      anomalies.push({
        type: 'high_volume',
        severity: 'medium',
        description: 'Volume de transações muito acima da média',
        data: {
          today_volume: todayStats.total_amount,
          week_average: weekAverage.avg_amount
        }
      });
    }

    // Verificar taxa de falhas alta
    if (failureRates.current_rate > 10) {
      anomalies.push({
        type: 'high_failure_rate',
        severity: 'high',
        description: 'Taxa de falhas de pagamento acima do normal',
        data: failureRates
      });
    }

    // Verificar transações suspeitas
    if (suspiciousTransactions.length > 0) {
      anomalies.push({
        type: 'suspicious_transactions',
        severity: 'high',
        description: 'Transações potencialmente fraudulentas detectadas',
        data: suspiciousTransactions
      });
    }

    return {
      anomalies_detected: anomalies.length,
      anomalies,
      analysis_timestamp: new Date(),
      stats_comparison: {
        today: todayStats,
        yesterday: yesterdayStats,
        week_average: weekAverage
      }
    };
  }

  /**
   * Sincronizar dados com Stripe (reconciliação completa)
   */
  static async syncWithStripe(startDate, endDate) {
    try {
      logger.info('Iniciando sincronização completa com Stripe');

      // Buscar dados do Stripe
      const stripeData = await this.getStripeDataRange(startDate, endDate);
      
      // Buscar dados locais
      const localData = await this.getLocalDataRange(startDate, endDate);
      
      // Comparar e encontrar discrepâncias
      const discrepancies = this.findDiscrepancies(stripeData, localData);
      
      // Criar relatório de sincronização
      const syncReport = {
        sync_id: `sync_${Date.now()}`,
        period: {
          start_date: startDate,
          end_date: endDate
        },
        stripe_data: stripeData,
        local_data: localData,
        discrepancies: discrepancies,
        sync_timestamp: new Date(),
        status: discrepancies.length === 0 ? 'synchronized' : 'discrepancies_found'
      };

      // Salvar relatório
      await db('financial_reports').insert({
        type: 'stripe_sync',
        report_date: new Date(),
        data: JSON.stringify(syncReport),
        status: 'completed'
      });

      logger.info(`Sincronização concluída: ${discrepancies.length} discrepâncias encontradas`);
      
      return syncReport;

    } catch (error) {
      logger.error('Erro na sincronização com Stripe:', error);
      throw error;
    }
  }

  // Métodos auxiliares privados
  static async getMonthlyPayments(startDate, endDate) {
    const result = await db('payments')
      .whereBetween('created_at', [startDate, endDate])
      .select(
        db.raw('COUNT(*) as count'),
        db.raw('COUNT(CASE WHEN status = "succeeded" THEN 1 END) as successful'),
        db.raw('SUM(CASE WHEN status = "succeeded" THEN amount ELSE 0 END) as total_amount'),
        db.raw('SUM(CASE WHEN status = "succeeded" AND type = "subscription" THEN amount ELSE 0 END) as subscription_amount'),
        db.raw('SUM(CASE WHEN status = "succeeded" AND type = "prepaid" THEN amount ELSE 0 END) as prepaid_amount')
      )
      .first();

    return {
      count: parseInt(result.count),
      successful: parseInt(result.successful),
      total_amount: parseFloat(result.total_amount || 0),
      subscription_amount: parseFloat(result.subscription_amount || 0),
      prepaid_amount: parseFloat(result.prepaid_amount || 0)
    };
  }

  static async getMonthlyWithdrawals(startDate, endDate) {
    const result = await db('withdrawal_requests')
      .whereBetween('created_at', [startDate, endDate])
      .select(
        db.raw('COUNT(*) as count'),
        db.raw('SUM(CASE WHEN status = "completed" THEN net_amount ELSE 0 END) as total_amount'),
        db.raw('SUM(fee_amount) as total_fees')
      )
      .first();

    return {
      count: parseInt(result.count),
      total_amount: parseFloat(result.total_amount || 0),
      total_fees: parseFloat(result.total_fees || 0)
    };
  }

  static async getMonthlyCommissions(startDate, endDate) {
    const result = await db('affiliate_commissions')
      .whereBetween('created_at', [startDate, endDate])
      .where('status', 'paid')
      .select(
        db.raw('COUNT(*) as count'),
        db.raw('SUM(commission_amount) as total_paid')
      )
      .first();

    return {
      count: parseInt(result.count),
      total_paid: parseFloat(result.total_paid || 0)
    };
  }

  static async getStripeFees(startDate, endDate) {
    // Buscar taxas do Stripe via API ou banco
    const result = await db('payments')
      .whereBetween('paid_at', [startDate, endDate])
      .where('status', 'succeeded')
      .select(
        db.raw('SUM(fee_amount) as total_fees')
      )
      .first();

    return {
      total_fees: parseFloat(result.total_fees || 0)
    };
  }

  static async getChargebacks(startDate, endDate) {
    // Implementar busca de chargebacks
    // Por enquanto retornar zero
    return {
      count: 0,
      total_amount: 0
    };
  }

  static async getDailyStats(date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const result = await db('payments')
      .whereBetween('created_at', [startDate, endDate])
      .select(
        db.raw('COUNT(*) as count'),
        db.raw('SUM(CASE WHEN status = "succeeded" THEN amount ELSE 0 END) as total_amount')
      )
      .first();

    return {
      count: parseInt(result.count),
      total_amount: parseFloat(result.total_amount || 0)
    };
  }

  static async getWeeklyAverage(startDate, endDate) {
    const result = await db('payments')
      .whereBetween('created_at', [startDate, endDate])
      .where('status', 'succeeded')
      .select(
        db.raw('AVG(amount) as avg_amount'),
        db.raw('COUNT(*) / 7 as avg_daily_count')
      )
      .first();

    return {
      avg_amount: parseFloat(result.avg_amount || 0),
      avg_daily_count: parseFloat(result.avg_daily_count || 0)
    };
  }

  static async getSuspiciousTransactions() {
    // Implementar detecção de transações suspeitas
    return [];
  }

  static async getFailureRates() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db('payments')
      .where('created_at', '>=', today)
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('COUNT(CASE WHEN status = "failed" THEN 1 END) as failed')
      )
      .first();

    const total = parseInt(result.total);
    const failed = parseInt(result.failed);
    const rate = total > 0 ? (failed / total * 100) : 0;

    return {
      total_transactions: total,
      failed_transactions: failed,
      current_rate: parseFloat(rate.toFixed(2))
    };
  }

  static compareLocalVsStripe(localData, stripeData) {
    if (!stripeData) return { status: 'stripe_data_unavailable' };

    // Implementar comparação detalhada
    return {
      status: 'compared',
      differences: []
    };
  }

  static async getStripeDataRange(startDate, endDate) {
    // Implementar busca de dados do Stripe para período
    return {};
  }

  static async getLocalDataRange(startDate, endDate) {
    // Implementar busca de dados locais para período
    return {};
  }

  static findDiscrepancies(stripeData, localData) {
    // Implementar detecção de discrepâncias
    return [];
  }
}

export default FinancialControlService;
