import cron from 'node-cron';
import { WithdrawalService } from '../services/withdrawalService.js';
import { ReconciliationService } from '../services/reconciliationService.js';
import { OperationControlService } from '../services/operationControlService.js';
import { db } from '../../../common/db.js';
import logger from '../../../common/logger.js';

export class FinancialCronJobs {
  static init() {
    logger.info('Inicializando jobs financeiros agendados');

    this.setupWithdrawalProcessing();
    this.setupReconciliation();
    this.setupReports();
    this.setupCleanup();
  }

  /**
   * Processamento automático de saques
   * Executa a cada 30 minutos em horário comercial
   */
  static setupWithdrawalProcessing() {
    // Segunda a Sexta, 8h às 18h, a cada 30 minutos
    cron.schedule('*/30 8-18 * * 1-5', async () => {
      try {
        logger.info('Iniciando processamento automático de saques...');
        
        // Buscar saques pendentes
        const pendingWithdrawals = await db('withdrawal_requests')
          .where({ status: 'pending' })
          .where('created_at', '<=', db.raw("NOW() - INTERVAL '5 minutes'"))
          .orderBy('created_at', 'asc')
          .limit(50);

        let processed = 0;
        let errors = 0;

        for (const withdrawal of pendingWithdrawals) {
          try {
            await WithdrawalService.processWithdrawalAutomatically(withdrawal.id);
            processed++;
            
            // Delay entre processamentos
            await new Promise(resolve => setTimeout(resolve, 2000));
            
          } catch (error) {
            errors++;
            logger.error('Erro processando saque:', {
              withdrawalId: withdrawal.id,
              error: error.message
            });
          }
        }

        logger.info('Processamento de saques concluído:', {
          total_pending: pendingWithdrawals.length,
          processed,
          errors
        });

      } catch (error) {
        logger.error('Erro no cron de processamento de saques:', error);
      }
    });

    logger.info('Cron de saques agendado: a cada 30 minutos, Seg-Sex 8h-18h');
  }

  /**
   * Reconciliação com sistema existente
   */
  static setupReconciliation() {
    // Reconciliação automática diária às 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('Executando reconciliação automática diária');
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const results = await ReconciliationService.reconcilePayments(yesterday, today);
        
        logger.info({ results }, 'Reconciliação automática concluída');
        
        // Gerar relatório se houver discrepâncias
        if (results.discrepancies > 0) {
          await ReconciliationService.generateReconciliationReport(yesterday, today);
        }

      } catch (error) {
        logger.error({ error }, 'Erro na reconciliação automática');
      }
    });

    // Snapshot de saldo Stripe a cada 4 horas
    cron.schedule('0 */4 * * *', async () => {
      try {
        logger.info('Capturando snapshot do saldo Stripe');
        await this.captureStripeBalanceSnapshot();
      } catch (error) {
        logger.error('Erro ao capturar snapshot Stripe:', error);
      }
    });

    logger.info('Cron de reconciliação agendado: diário às 2h e snapshots a cada 4h');
  }

  /**
   * Capturar snapshot do saldo Stripe
   */
  static async captureStripeBalanceSnapshot() {
    try {
      const FinancialControlService = await import('./financialControlService.js');
      const balance = await FinancialControlService.FinancialControlService.getStripeBalance();

      // Calcular totais por moeda
      let totalAvailableBRL = 0;
      let totalAvailableUSD = 0;
      let totalPendingBRL = 0;
      let totalPendingUSD = 0;

      balance.available.forEach(b => {
        if (b.currency === 'BRL') totalAvailableBRL += b.amount;
        if (b.currency === 'USD') totalAvailableUSD += b.amount;
      });

      balance.pending.forEach(b => {
        if (b.currency === 'BRL') totalPendingBRL += b.amount;
        if (b.currency === 'USD') totalPendingUSD += b.amount;
      });

      // Salvar snapshot
      await db('stripe_balance_snapshots').insert({
        available_balance: JSON.stringify(balance.available),
        pending_balance: JSON.stringify(balance.pending),
        total_available_brl: totalAvailableBRL,
        total_available_usd: totalAvailableUSD,
        total_pending_brl: totalPendingBRL,
        total_pending_usd: totalPendingUSD,
        snapshot_date: new Date()
      });

      logger.info('Snapshot do saldo Stripe capturado com sucesso');

    } catch (error) {
      logger.error('Erro ao capturar snapshot do saldo Stripe:', error);
    }
  }

  /**
   * Relatórios automáticos melhorados
   */
  static setupReports() {

    // Reconciliação automática diária às 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('Executando reconciliação automática diária');
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const results = await ReconciliationService.reconcilePayments(yesterday, today);
        
        logger.info({ results }, 'Reconciliação automática concluída');
        
        // Gerar relatório se houver discrepâncias
        if (results.discrepancies > 0) {
          await ReconciliationService.generateReconciliationReport(yesterday, today);
        }

      } catch (error) {
        logger.error({ error }, 'Erro na reconciliação automática');
      }
    });

    // Limpeza de logs de webhook antigos - todo domingo às 3:00 AM
    cron.schedule('0 3 * * 0', async () => {
      try {
        logger.info('Iniciando limpeza de logs de webhook antigos');
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const deletedCount = await db('webhook_logs')
          .where('created_at', '<', thirtyDaysAgo)
          .del();

        logger.info({ deletedCount }, 'Limpeza de logs de webhook concluída');

      } catch (error) {
        logger.error({ error }, 'Erro na limpeza de logs de webhook');
      }
    });

    // Relatório financeiro semanal - toda segunda às 9:00 AM
    cron.schedule('0 9 * * 1', async () => {
      try {
        logger.info('Gerando relatório financeiro semanal');
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const today = new Date();

        await ReconciliationService.generateReconciliationReport(oneWeekAgo, today);
        
        // Aqui você pode adicionar envio de email do relatório para admins
        
        logger.info('Relatório financeiro semanal gerado');

      } catch (error) {
        logger.error({ error }, 'Erro ao gerar relatório financeiro semanal');
      }
    });

    // Verificar pagamentos pendentes há mais de 1 hora - a cada 30 minutos
    cron.schedule('*/30 * * * *', async () => {
      try {
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        const pendingPayments = await db('payments')
          .where('status', 'pending')
          .where('created_at', '<', oneHourAgo)
          .whereNotNull('stripe_payment_intent_id')
          .limit(50); // Processar no máximo 50 por vez

        if (pendingPayments.length > 0) {
          logger.info({ count: pendingPayments.length }, 'Verificando pagamentos pendentes');

          for (const payment of pendingPayments) {
            try {
              await ReconciliationService.reconcilePayment(payment);
            } catch (error) {
              logger.error({ error, paymentId: payment.id }, 'Erro ao verificar pagamento pendente');
            }
          }
        }

      } catch (error) {
        logger.error({ error }, 'Erro na verificação de pagamentos pendentes');
      }
    });

    // Atualizar estatísticas de pagamento - a cada hora
    cron.schedule('0 * * * *', async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Verificar se já existe relatório para hoje
        const existingReport = await db('financial_reports')
          .where({ type: 'daily', report_date: today })
          .first();

        if (existingReport) {
          // Atualizar relatório existente
          const stats = await this.calculateDailyStats();
          
          await db('financial_reports')
            .where({ id: existingReport.id })
            .update({
              data: stats,
              status: 'completed'
            });
        } else {
          // Criar novo relatório
          const stats = await this.calculateDailyStats();
          
          await db('financial_reports').insert({
            type: 'daily',
            report_date: today,
            data: stats,
            status: 'completed'
          });
        }

      } catch (error) {
        logger.error({ error }, 'Erro ao atualizar estatísticas diárias');
      }
    });

    logger.info('Jobs financeiros agendados iniciados com sucesso');
  }

  static async calculateDailyStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalPayments,
      successfulPayments,
      failedPayments,
      totalVolume,
      prepaidVolume,
      subscriptionVolume,
      totalFees,
      uniqueUsers
    ] = await Promise.all([
      db('payments').whereBetween('created_at', [today, tomorrow]).count('* as count').first(),
      db('payments').whereBetween('created_at', [today, tomorrow]).where('status', 'succeeded').count('* as count').first(),
      db('payments').whereBetween('created_at', [today, tomorrow]).where('status', 'failed').count('* as count').first(),
      db('payments').whereBetween('created_at', [today, tomorrow]).where('status', 'succeeded').sum('amount as total').first(),
      db('payments').whereBetween('created_at', [today, tomorrow]).where('status', 'succeeded').where('type', 'prepaid').sum('amount as total').first(),
      db('payments').whereBetween('created_at', [today, tomorrow]).where('status', 'succeeded').where('type', 'subscription').sum('amount as total').first(),
      db('payments').whereBetween('created_at', [today, tomorrow]).where('status', 'succeeded').sum('fee_amount as total').first(),
      db('payments').whereBetween('created_at', [today, tomorrow]).where('status', 'succeeded').countDistinct('user_id as count').first()
    ]);

    return {
      date: today.toISOString().split('T')[0],
      payments: {
        total: parseInt(totalPayments.count),
        successful: parseInt(successfulPayments.count),
        failed: parseInt(failedPayments.count),
        success_rate: totalPayments.count > 0 ? 
          (successfulPayments.count / totalPayments.count * 100).toFixed(2) : 0
      },
      volume: {
        total: parseFloat(totalVolume.total || 0),
        prepaid: parseFloat(prepaidVolume.total || 0),
        subscription: parseFloat(subscriptionVolume.total || 0),
        fees: parseFloat(totalFees.total || 0),
        net: parseFloat(totalVolume.total || 0) - parseFloat(totalFees.total || 0)
      },
      users: {
        unique_payers: parseInt(uniqueUsers.count)
      },
      generated_at: new Date()
    };
  }
}
