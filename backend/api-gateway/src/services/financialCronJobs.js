import cron from 'node-cron';
import { ReconciliationService } from '../services/reconciliationService.js';
import { db } from '../../../common/db.js';
import logger from '../../../common/logger.js';

export class FinancialCronJobs {
  static init() {
    logger.info('Inicializando jobs financeiros agendados');

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
