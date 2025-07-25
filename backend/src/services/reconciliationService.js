/**
 * Serviço de Conciliação
 * Automatiza a conciliação entre dados internos e Stripe
 */
import db from '../common/db.js';
import logger from '../common/logger.js';
import stripeService from './stripeService.js';

class ReconciliationService {
  
  /**
   * Executar conciliação diária
   */
  async runDailyReconciliation(date = new Date()) {
    try {
      logger.info('Iniciando conciliação diária:', date.toISOString());
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Buscar pagamentos do dia
      const internalPayments = await db('payments')
        .whereBetween('created_at', [startOfDay, endOfDay])
        .where('status', 'succeeded')
        .whereNotNull('stripe_payment_intent_id');
      
      // Buscar dados do Stripe
      const stripePayments = await this.getStripePayments(startOfDay, endOfDay);
      
      // Reconciliar
      const reconciliationResults = await this.reconcilePayments(internalPayments, stripePayments);
      
      // Salvar relatório
      await this.saveReconciliationReport(date, reconciliationResults);
      
      logger.info('Conciliação diária concluída:', {
        date: date.toISOString(),
        internal_count: internalPayments.length,
        stripe_count: stripePayments.length,
        matched: reconciliationResults.matched.length,
        discrepancies: reconciliationResults.discrepancies.length
      });
      
      return reconciliationResults;
      
    } catch (error) {
      logger.error('Erro na conciliação diária:', error);
      throw error;
    }
  }
  
  /**
   * Buscar pagamentos do Stripe
   */
  async getStripePayments(startDate, endDate) {
    try {
      const payments = [];
      let hasMore = true;
      let startingAfter = null;
      
      while (hasMore) {
        const params = {
          created: {
            gte: Math.floor(startDate.getTime() / 1000),
            lte: Math.floor(endDate.getTime() / 1000)
          },
          limit: 100
        };
        
        if (startingAfter) {
          params.starting_after = startingAfter;
        }
        
        const response = await stripeService.stripe.paymentIntents.list(params);
        
        payments.push(...response.data);
        hasMore = response.has_more;
        
        if (hasMore && response.data.length > 0) {
          startingAfter = response.data[response.data.length - 1].id;
        }
      }
      
      return payments.filter(payment => payment.status === 'succeeded');
      
    } catch (error) {
      logger.error('Erro ao buscar pagamentos do Stripe:', error);
      throw error;
    }
  }
  
  /**
   * Reconciliar pagamentos
   */
  async reconcilePayments(internalPayments, stripePayments) {
    const matched = [];
    const discrepancies = [];
    const stripeOnly = [];
    const internalOnly = [];
    
    // Criar maps para busca rápida
    const stripeMap = new Map();
    stripePayments.forEach(payment => {
      stripeMap.set(payment.id, payment);
    });
    
    const internalMap = new Map();
    internalPayments.forEach(payment => {
      internalMap.set(payment.stripe_payment_intent_id, payment);
    });
    
    // Verificar pagamentos internos
    for (const internalPayment of internalPayments) {
      const stripePayment = stripeMap.get(internalPayment.stripe_payment_intent_id);
      
      if (stripePayment) {
        // Verificar se os valores batem
        const internalAmount = Math.round(internalPayment.amount * 100);
        const stripeAmount = stripePayment.amount;
        
        if (internalAmount === stripeAmount) {
          matched.push({
            internal: internalPayment,
            stripe: stripePayment,
            status: 'matched'
          });
          
          // Salvar reconciliação
          await this.saveReconciliationRecord(internalPayment, stripePayment, 'matched');
          
        } else {
          discrepancies.push({
            internal: internalPayment,
            stripe: stripePayment,
            discrepancy_type: 'amount_mismatch',
            internal_amount: internalAmount,
            stripe_amount: stripeAmount,
            difference: Math.abs(internalAmount - stripeAmount)
          });
          
          // Salvar discrepância
          await this.saveReconciliationRecord(internalPayment, stripePayment, 'discrepancy');
          
          // Criar alerta
          await this.createReconciliationAlert('amount_mismatch', {
            internal_payment_id: internalPayment.id,
            stripe_payment_id: stripePayment.id,
            internal_amount: internalAmount,
            stripe_amount: stripeAmount
          });
        }
        
        // Remover do map do Stripe para identificar órfãos
        stripeMap.delete(internalPayment.stripe_payment_intent_id);
        
      } else {
        internalOnly.push(internalPayment);
        
        // Criar alerta para pagamento interno sem correspondência no Stripe
        await this.createReconciliationAlert('internal_only', {
          internal_payment_id: internalPayment.id,
          stripe_payment_intent_id: internalPayment.stripe_payment_intent_id
        });
      }
    }
    
    // Pagamentos apenas no Stripe (órfãos)
    for (const [paymentId, stripePayment] of stripeMap) {
      stripeOnly.push(stripePayment);
      
      // Criar alerta para pagamento do Stripe sem correspondência interna
      await this.createReconciliationAlert('stripe_only', {
        stripe_payment_id: stripePayment.id,
        stripe_amount: stripePayment.amount
      });
    }
    
    return {
      matched,
      discrepancies,
      stripeOnly,
      internalOnly,
      summary: {
        total_internal: internalPayments.length,
        total_stripe: stripePayments.length,
        matched_count: matched.length,
        discrepancy_count: discrepancies.length,
        stripe_only_count: stripeOnly.length,
        internal_only_count: internalOnly.length
      }
    };
  }
  
  /**
   * Salvar registro de reconciliação
   */
  async saveReconciliationRecord(internalPayment, stripePayment, status) {
    try {
      await db('payment_reconciliation').insert({
        payment_id: internalPayment.id,
        external_transaction_id: stripePayment.id,
        gateway_amount: stripePayment.amount / 100,
        gateway_fee: (stripePayment.application_fee_amount || 0) / 100,
        reconciliation_status: status,
        gateway_processed_at: new Date(stripePayment.created * 1000),
        gateway_data: JSON.stringify(stripePayment)
      });
      
    } catch (error) {
      logger.error('Erro ao salvar registro de reconciliação:', error);
    }
  }
  
  /**
   * Criar alerta de reconciliação
   */
  async createReconciliationAlert(type, data) {
    try {
      const alertMessages = {
        amount_mismatch: 'Discrepância de valor entre sistema interno e Stripe',
        internal_only: 'Pagamento registrado internamente mas não encontrado no Stripe',
        stripe_only: 'Pagamento encontrado no Stripe mas não registrado internamente'
      };
      
      const severity = type === 'amount_mismatch' ? 'high' : 'medium';
      
      await db('system_alerts').insert({
        type: 'reconciliation_discrepancy',
        severity: severity,
        title: alertMessages[type],
        message: `Tipo: ${type}`,
        data: JSON.stringify(data)
      });
      
    } catch (error) {
      logger.error('Erro ao criar alerta de reconciliação:', error);
    }
  }
  
  /**
   * Salvar relatório de reconciliação
   */
  async saveReconciliationReport(date, results) {
    try {
      await db('financial_reports').insert({
        type: 'reconciliation',
        report_date: date,
        data: JSON.stringify(results),
        status: 'completed'
      });
      
    } catch (error) {
      logger.error('Erro ao salvar relatório de reconciliação:', error);
    }
  }
  
  /**
   * Obter snapshot do saldo Stripe
   */
  async getStripeBalanceSnapshot() {
    try {
      const balance = await stripeService.stripe.balance.retrieve();
      
      const availableBalance = {};
      const pendingBalance = {};
      
      balance.available.forEach(item => {
        availableBalance[item.currency.toUpperCase()] = item.amount / 100;
      });
      
      balance.pending.forEach(item => {
        pendingBalance[item.currency.toUpperCase()] = item.amount / 100;
      });
      
      await db('stripe_balance_snapshots').insert({
        available_balance: JSON.stringify(availableBalance),
        pending_balance: JSON.stringify(pendingBalance),
        total_available_brl: availableBalance.BRL || 0,
        total_available_usd: availableBalance.USD || 0,
        total_pending_brl: pendingBalance.BRL || 0,
        total_pending_usd: pendingBalance.USD || 0,
        snapshot_date: new Date()
      });
      
      return {
        available: availableBalance,
        pending: pendingBalance
      };
      
    } catch (error) {
      logger.error('Erro ao obter snapshot do saldo Stripe:', error);
      throw error;
    }
  }
  
  /**
   * Gerar relatório financeiro diário
   */
  async generateDailyFinancialReport(date = new Date()) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Dados de pagamentos
      const paymentsData = await db('payments')
        .whereBetween('created_at', [startOfDay, endOfDay])
        .where('status', 'succeeded')
        .select(
          db.raw('COUNT(*) as total_payments'),
          db.raw('SUM(amount) as total_amount'),
          db.raw('SUM(CASE WHEN currency = ? THEN amount ELSE 0 END) as total_brl', ['BRL']),
          db.raw('SUM(CASE WHEN currency = ? THEN amount ELSE 0 END) as total_usd', ['USD']),
          db.raw('SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as subscription_revenue', ['subscription']),
          db.raw('SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as prepaid_revenue', ['prepaid'])
        )
        .first();
      
      // Dados de saques
      const withdrawalsData = await db('withdrawal_requests')
        .whereBetween('created_at', [startOfDay, endOfDay])
        .select(
          db.raw('COUNT(*) as total_withdrawals'),
          db.raw('SUM(amount) as total_withdrawal_amount'),
          db.raw('SUM(fee_amount) as total_fees'),
          db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as pending_withdrawals', ['pending']),
          db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as completed_withdrawals', ['completed'])
        )
        .first();
      
      // Novos usuários
      const newUsersData = await db('users')
        .whereBetween('created_at', [startOfDay, endOfDay])
        .select(
          db.raw('COUNT(*) as new_users')
        )
        .first();
      
      const reportData = {
        date: date.toISOString().split('T')[0],
        payments: paymentsData,
        withdrawals: withdrawalsData,
        users: newUsersData,
        generated_at: new Date().toISOString()
      };
      
      // Salvar relatório
      await db('daily_reports').insert({
        report_date: date,
        report_type: 'financial_daily',
        report_data: JSON.stringify(reportData),
        status: 'completed'
      });
      
      return reportData;
      
    } catch (error) {
      logger.error('Erro ao gerar relatório financeiro diário:', error);
      throw error;
    }
  }
  
  /**
   * Executar tarefas de manutenção
   */
  async runMaintenanceTasks() {
    try {
      logger.info('Iniciando tarefas de manutenção');
      
      // 1. Conciliação diária
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await this.runDailyReconciliation(yesterday);
      
      // 2. Snapshot do saldo Stripe
      await this.getStripeBalanceSnapshot();
      
      // 3. Relatório financeiro diário
      await this.generateDailyFinancialReport(yesterday);
      
      // 4. Limpeza de dados antigos
      await this.cleanupOldData();
      
      // 5. Verificar alertas não resolvidos
      await this.checkUnresolvedAlerts();
      
      logger.info('Tarefas de manutenção concluídas');
      
    } catch (error) {
      logger.error('Erro nas tarefas de manutenção:', error);
      throw error;
    }
  }
  
  /**
   * Limpeza de dados antigos
   */
  async cleanupOldData() {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      // Limpar logs de webhook antigos
      await db('webhook_logs')
        .where('created_at', '<', sixMonthsAgo)
        .where('status', 'processed')
        .del();
      
      // Limpar sessões de checkout expiradas
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      await db('checkout_sessions')
        .where('created_at', '<', thirtyDaysAgo)
        .where('status', 'expired')
        .del();
      
      logger.info('Limpeza de dados antigos concluída');
      
    } catch (error) {
      logger.error('Erro na limpeza de dados antigos:', error);
    }
  }
  
  /**
   * Verificar alertas não resolvidos
   */
  async checkUnresolvedAlerts() {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const unresolvedAlerts = await db('system_alerts')
        .where('resolved', false)
        .where('created_at', '<', threeDaysAgo)
        .where('severity', 'high')
        .orWhere('severity', 'critical');
      
      if (unresolvedAlerts.length > 0) {
        logger.warn(`${unresolvedAlerts.length} alertas críticos não resolvidos há mais de 3 dias`);
        
        // Aqui você pode implementar notificações por email/Slack
      }
      
    } catch (error) {
      logger.error('Erro ao verificar alertas não resolvidos:', error);
    }
  }
}

export default new ReconciliationService();
