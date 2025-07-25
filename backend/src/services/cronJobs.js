/**
 * Sistema de Tarefas Agendadas
 * Executa tarefas de manutenção e conciliação automaticamente
 */
import cron from 'node-cron';
import reconciliationService from '../services/reconciliationService.js';
import logger from '../common/logger.js';
import db from '../common/db.js';

class CronJobs {
  
  constructor() {
    this.jobs = new Map();
  }
  
  /**
   * Inicializar todas as tarefas agendadas
   */
  initialize() {
    logger.info('Inicializando tarefas agendadas');
    
    // Conciliação diária às 6h
    this.scheduleJob('daily-reconciliation', '0 6 * * *', async () => {
      await this.runDailyReconciliation();
    });
    
    // Snapshot do saldo Stripe a cada 4 horas
    this.scheduleJob('stripe-balance-snapshot', '0 */4 * * *', async () => {
      await this.takeStripeBalanceSnapshot();
    });
    
    // Relatório financeiro diário às 7h
    this.scheduleJob('daily-financial-report', '0 7 * * *', async () => {
      await this.generateDailyReport();
    });
    
    // Limpeza de dados antigos - domingos às 2h
    this.scheduleJob('cleanup-old-data', '0 2 * * 0', async () => {
      await this.cleanupOldData();
    });
    
    // Verificar alertas não resolvidos a cada 2 horas
    this.scheduleJob('check-unresolved-alerts', '0 */2 * * *', async () => {
      await this.checkUnresolvedAlerts();
    });
    
    // Processar saques automáticos a cada hora (horário comercial)
    this.scheduleJob('process-auto-withdrawals', '0 9-18 * * 1-5', async () => {
      await this.processAutoWithdrawals();
    });
    
    // Monitorar taxa de falhas de pagamento a cada 30 minutos
    this.scheduleJob('monitor-payment-failures', '*/30 * * * *', async () => {
      await this.monitorPaymentFailures();
    });
    
    // Backup de dados críticos - diário às 3h
    this.scheduleJob('backup-critical-data', '0 3 * * *', async () => {
      await this.backupCriticalData();
    });
    
    logger.info('Tarefas agendadas inicializadas:', Array.from(this.jobs.keys()));
  }
  
  /**
   * Agendar uma tarefa
   */
  scheduleJob(name, schedule, task) {
    try {
      const job = cron.schedule(schedule, async () => {
        logger.info(`Executando tarefa agendada: ${name}`);
        
        try {
          await task();
          logger.info(`Tarefa concluída: ${name}`);
        } catch (error) {
          logger.error(`Erro na tarefa ${name}:`, error);
          
          // Registrar falha no sistema de alertas
          await this.createTaskAlert(name, error);
        }
      }, {
        scheduled: false,
        timezone: "America/Sao_Paulo"
      });
      
      this.jobs.set(name, job);
      job.start();
      
      logger.info(`Tarefa agendada: ${name} - ${schedule}`);
      
    } catch (error) {
      logger.error(`Erro ao agendar tarefa ${name}:`, error);
    }
  }
  
  /**
   * Executar conciliação diária
   */
  async runDailyReconciliation() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const results = await reconciliationService.runDailyReconciliation(yesterday);
      
      // Se houver discrepâncias, criar alerta
      if (results.discrepancies.length > 0) {
        await db('system_alerts').insert({
          type: 'reconciliation_discrepancy',
          severity: 'high',
          title: 'Discrepâncias encontradas na conciliação diária',
          message: `${results.discrepancies.length} discrepâncias encontradas para ${yesterday.toISOString().split('T')[0]}`,
          data: JSON.stringify({
            date: yesterday.toISOString().split('T')[0],
            discrepancy_count: results.discrepancies.length,
            summary: results.summary
          })
        });
      }
      
    } catch (error) {
      logger.error('Erro na conciliação diária agendada:', error);
      throw error;
    }
  }
  
  /**
   * Capturar snapshot do saldo Stripe
   */
  async takeStripeBalanceSnapshot() {
    try {
      await reconciliationService.getStripeBalanceSnapshot();
    } catch (error) {
      logger.error('Erro ao capturar snapshot do saldo:', error);
      throw error;
    }
  }
  
  /**
   * Gerar relatório financeiro diário
   */
  async generateDailyReport() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await reconciliationService.generateDailyFinancialReport(yesterday);
    } catch (error) {
      logger.error('Erro ao gerar relatório diário:', error);
      throw error;
    }
  }
  
  /**
   * Limpeza de dados antigos
   */
  async cleanupOldData() {
    try {
      await reconciliationService.cleanupOldData();
    } catch (error) {
      logger.error('Erro na limpeza de dados:', error);
      throw error;
    }
  }
  
  /**
   * Verificar alertas não resolvidos
   */
  async checkUnresolvedAlerts() {
    try {
      await reconciliationService.checkUnresolvedAlerts();
    } catch (error) {
      logger.error('Erro ao verificar alertas:', error);
      throw error;
    }
  }
  
  /**
   * Processar saques automáticos
   */
  async processAutoWithdrawals() {
    try {
      const withdrawalSettings = await db('payment_settings')
        .where('key', 'withdrawal_settings')
        .first();
      
      if (!withdrawalSettings.value.business_hours_only) {
        return; // Só processa em horário comercial
      }
      
      const autoApprovalLimit = withdrawalSettings.value.auto_approval_limit;
      
      // Buscar saques pendentes para aprovação automática
      const pendingWithdrawals = await db('withdrawal_requests')
        .where('status', 'pending')
        .where('amount', '<=', autoApprovalLimit)
        .limit(10); // Processar até 10 por vez
      
      for (const withdrawal of pendingWithdrawals) {
        try {
          await this.processWithdrawal(withdrawal.id);
          logger.info(`Saque processado automaticamente: ${withdrawal.id}`);
        } catch (error) {
          logger.error(`Erro ao processar saque ${withdrawal.id}:`, error);
          
          // Marcar como falha
          await db('withdrawal_requests')
            .where('id', withdrawal.id)
            .update({
              status: 'failed',
              processing_notes: error.message
            });
        }
      }
      
    } catch (error) {
      logger.error('Erro no processamento automático de saques:', error);
      throw error;
    }
  }
  
  /**
   * Processar saque individual
   */
  async processWithdrawal(withdrawalId) {
    try {
      const withdrawal = await db('withdrawal_requests')
        .where('id', withdrawalId)
        .first();
      
      if (!withdrawal) {
        throw new Error('Saque não encontrado');
      }
      
      // Verificar saldo do usuário
      const balance = await db('user_prepaid_balance')
        .where('user_id', withdrawal.user_id)
        .where('currency', withdrawal.currency)
        .first();
      
      if (!balance || balance.balance < withdrawal.amount) {
        throw new Error('Saldo insuficiente');
      }
      
      await db.transaction(async (trx) => {
        // Debitar saldo
        await trx('user_prepaid_balance')
          .where('user_id', withdrawal.user_id)
          .where('currency', withdrawal.currency)
          .decrement('balance', withdrawal.amount);
        
        // Registrar transação
        await trx('prepaid_transactions').insert({
          user_id: withdrawal.user_id,
          type: 'debit',
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          balance_before: balance.balance,
          balance_after: balance.balance - withdrawal.amount,
          description: `Saque processado - ${withdrawal.withdrawal_type}`,
          reference_id: withdrawalId,
          metadata: JSON.stringify({
            withdrawal_type: withdrawal.withdrawal_type,
            processing_method: 'automatic'
          })
        });
        
        // Atualizar status do saque
        await trx('withdrawal_requests')
          .where('id', withdrawalId)
          .update({
            status: 'completed',
            processed_at: new Date(),
            processing_notes: 'Processado automaticamente pelo sistema'
          });
      });
      
    } catch (error) {
      logger.error(`Erro ao processar saque ${withdrawalId}:`, error);
      throw error;
    }
  }
  
  /**
   * Monitorar taxa de falhas de pagamento
   */
  async monitorPaymentFailures() {
    try {
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);
      
      // Contar pagamentos da última hora
      const paymentStats = await db('payments')
        .where('created_at', '>=', lastHour)
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as failed', ['failed']),
          db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as succeeded', ['succeeded'])
        )
        .first();
      
      if (paymentStats.total > 0) {
        const failureRate = (paymentStats.failed / paymentStats.total) * 100;
        
        // Se taxa de falha > 10%, criar alerta
        if (failureRate > 10) {
          await db('system_alerts').insert({
            type: 'high_failure_rate',
            severity: failureRate > 25 ? 'critical' : 'high',
            title: 'Alta taxa de falhas de pagamento detectada',
            message: `Taxa de falha: ${failureRate.toFixed(2)}% na última hora`,
            data: JSON.stringify({
              period: 'last_hour',
              total_payments: paymentStats.total,
              failed_payments: paymentStats.failed,
              failure_rate: failureRate,
              timestamp: new Date().toISOString()
            })
          });
        }
      }
      
    } catch (error) {
      logger.error('Erro ao monitorar falhas de pagamento:', error);
      throw error;
    }
  }
  
  /**
   * Backup de dados críticos
   */
  async backupCriticalData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Dados de pagamentos do dia
      const paymentsData = await db('payments')
        .whereRaw('DATE(created_at) = ?', [today])
        .select('*');
      
      // Dados de saques do dia
      const withdrawalsData = await db('withdrawal_requests')
        .whereRaw('DATE(created_at) = ?', [today])
        .select('*');
      
      // Snapshot de saldos
      const balancesData = await db('user_prepaid_balance')
        .select('*');
      
      const backupData = {
        date: today,
        payments: paymentsData,
        withdrawals: withdrawalsData,
        balances: balancesData,
        backup_timestamp: new Date().toISOString()
      };
      
      // Salvar no sistema de relatórios
      await db('daily_reports').insert({
        report_date: new Date(),
        report_type: 'backup_critical_data',
        report_data: JSON.stringify(backupData),
        status: 'completed'
      });
      
      logger.info('Backup de dados críticos concluído');
      
    } catch (error) {
      logger.error('Erro no backup de dados críticos:', error);
      throw error;
    }
  }
  
  /**
   * Criar alerta de falha de tarefa
   */
  async createTaskAlert(taskName, error) {
    try {
      await db('system_alerts').insert({
        type: 'system_error',
        severity: 'high',
        title: `Falha na tarefa agendada: ${taskName}`,
        message: error.message,
        data: JSON.stringify({
          task_name: taskName,
          error_stack: error.stack,
          timestamp: new Date().toISOString()
        })
      });
    } catch (alertError) {
      logger.error('Erro ao criar alerta de tarefa:', alertError);
    }
  }
  
  /**
   * Parar uma tarefa específica
   */
  stopJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      logger.info(`Tarefa parada: ${name}`);
    }
  }
  
  /**
   * Parar todas as tarefas
   */
  stopAllJobs() {
    for (const [name, job] of this.jobs) {
      job.stop();
      logger.info(`Tarefa parada: ${name}`);
    }
    this.jobs.clear();
    logger.info('Todas as tarefas agendadas foram paradas');
  }
  
  /**
   * Obter status das tarefas
   */
  getJobsStatus() {
    const status = {};
    for (const [name, job] of this.jobs) {
      status[name] = {
        running: job.running,
        scheduled: job.scheduled
      };
    }
    return status;
  }
}

export default new CronJobs();
