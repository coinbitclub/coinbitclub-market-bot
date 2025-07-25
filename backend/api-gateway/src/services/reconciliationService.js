import Stripe from 'stripe';
import { db } from '../../../common/db.js';
import { env } from '../../../common/env.js';
import logger from '../../../common/logger.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export class ReconciliationService {
  /**
   * Reconciliar pagamentos automaticamente
   */
  static async reconcilePayments(dateFrom = null, dateTo = null) {
    try {
      logger.info('Iniciando reconciliação de pagamentos');

      if (!dateFrom) {
        dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 1); // Ontem
      }
      if (!dateTo) {
        dateTo = new Date(); // Hoje
      }

      // Buscar pagamentos pendentes de reconciliação
      const payments = await db('payments')
        .leftJoin('payment_reconciliation', 'payments.id', 'payment_reconciliation.payment_id')
        .whereNull('payment_reconciliation.id')
        .where('payments.created_at', '>=', dateFrom)
        .where('payments.created_at', '<=', dateTo)
        .whereNotNull('payments.stripe_payment_intent_id')
        .select('payments.*');

      logger.info(`Encontrados ${payments.length} pagamentos para reconciliar`);

      const results = {
        total: payments.length,
        matched: 0,
        discrepancies: 0,
        errors: 0
      };

      for (const payment of payments) {
        try {
          const reconciliationResult = await this.reconcilePayment(payment);
          
          if (reconciliationResult.status === 'matched') {
            results.matched++;
          } else if (reconciliationResult.status === 'discrepancy') {
            results.discrepancies++;
          }
        } catch (error) {
          logger.error({ error, paymentId: payment.id }, 'Erro ao reconciliar pagamento');
          results.errors++;
        }
      }

      logger.info({ results }, 'Reconciliação concluída');
      return results;

    } catch (error) {
      logger.error({ error }, 'Erro na reconciliação de pagamentos');
      throw error;
    }
  }

  /**
   * Reconciliar um pagamento específico
   */
  static async reconcilePayment(payment) {
    try {
      if (!payment.stripe_payment_intent_id) {
        throw new Error('Pagamento sem Payment Intent ID');
      }

      // Buscar dados do Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
      
      // Buscar charges relacionadas
      const charges = await stripe.charges.list({
        payment_intent: payment.stripe_payment_intent_id,
        limit: 10
      });

      if (charges.data.length === 0) {
        throw new Error('Nenhuma charge encontrada para o Payment Intent');
      }

      const charge = charges.data[0]; // Primeira charge (geralmente a única)
      
      // Calcular valores
      const gatewayAmount = charge.amount / 100; // Stripe usa centavos
      const gatewayFee = charge.application_fee_amount ? charge.application_fee_amount / 100 : 0;
      const paymentAmount = parseFloat(payment.amount);

      // Determinar status da reconciliação
      let reconciliationStatus = 'matched';
      let notes = [];

      // Verificar discrepâncias de valor
      const amountDifference = Math.abs(gatewayAmount - paymentAmount);
      if (amountDifference > 0.01) { // Tolerância de 1 centavo
        reconciliationStatus = 'discrepancy';
        notes.push(`Diferença de valor: Gateway ${gatewayAmount}, Sistema ${paymentAmount}`);
      }

      // Verificar status
      if (paymentIntent.status !== payment.status) {
        if (reconciliationStatus !== 'discrepancy') {
          reconciliationStatus = 'manual_review';
        }
        notes.push(`Diferença de status: Gateway ${paymentIntent.status}, Sistema ${payment.status}`);
      }

      // Criar registro de reconciliação
      const [reconciliation] = await db('payment_reconciliation').insert({
        payment_id: payment.id,
        external_transaction_id: charge.id,
        gateway_amount: gatewayAmount,
        gateway_fee: gatewayFee,
        reconciliation_status: reconciliationStatus,
        gateway_processed_at: new Date(charge.created * 1000),
        gateway_data: {
          payment_intent: paymentIntent,
          charge: charge,
          balance_transaction: charge.balance_transaction
        },
        reconciliation_notes: notes.length > 0 ? notes.join('; ') : null,
        reconciled_at: new Date()
      }).returning('*');

      // Atualizar pagamento se necessário
      const updateData = {};
      
      if (paymentIntent.status === 'succeeded' && payment.status !== 'succeeded') {
        updateData.status = 'succeeded';
        updateData.paid_at = new Date(charge.created * 1000);
        updateData.fee_amount = gatewayFee;
      } else if (paymentIntent.status === 'failed' && payment.status !== 'failed') {
        updateData.status = 'failed';
        updateData.failed_at = new Date();
        updateData.failure_reason = paymentIntent.last_payment_error?.message || 'Falha no pagamento';
      }

      if (Object.keys(updateData).length > 0) {
        await db('payments')
          .where({ id: payment.id })
          .update(updateData);
      }

      // Se houve mudança de status para succeeded, processar credito se for pré-pago
      if (updateData.status === 'succeeded' && payment.type === 'prepaid') {
        await this.processPrepaidPaymentSuccess(payment);
      }

      logger.info({ 
        paymentId: payment.id, 
        reconciliationStatus,
        gatewayAmount,
        paymentAmount 
      }, 'Pagamento reconciliado');

      return {
        reconciliation,
        status: reconciliationStatus,
        notes
      };

    } catch (error) {
      logger.error({ error, paymentId: payment.id }, 'Erro ao reconciliar pagamento específico');
      throw error;
    }
  }

  /**
   * Processar pagamento pré-pago bem sucedido
   */
  static async processPrepaidPaymentSuccess(payment) {
    try {
      // Verificar se já foi processado
      const existingTransaction = await db('prepaid_transactions')
        .where({ payment_id: payment.id, type: 'credit' })
        .first();

      if (existingTransaction) {
        logger.warn({ paymentId: payment.id }, 'Pagamento pré-pago já processado');
        return;
      }

      const metadata = payment.metadata || {};
      const totalCredit = metadata.total_credit || payment.amount;
      const bonusAmount = metadata.bonus_amount || 0;

      // Creditar saldo
      const PaymentService = await import('./paymentService.js');
      await PaymentService.PaymentService.creditPrepaidBalance(
        payment.user_id, 
        parseFloat(totalCredit), 
        payment.currency, 
        payment.id, 
        `Recarga confirmada${bonusAmount > 0 ? ` (inclui bônus de ${payment.currency} ${bonusAmount})` : ''}`
      );

      logger.info({ 
        paymentId: payment.id, 
        userId: payment.user_id,
        totalCredit,
        bonusAmount 
      }, 'Saldo pré-pago creditado após reconciliação');

    } catch (error) {
      logger.error({ error, paymentId: payment.id }, 'Erro ao processar pagamento pré-pago');
    }
  }

  /**
   * Buscar discrepâncias pendentes
   */
  static async getPendingDiscrepancies() {
    const discrepancies = await db('payment_reconciliation')
      .join('payments', 'payment_reconciliation.payment_id', 'payments.id')
      .join('users', 'payments.user_id', 'users.id')
      .where('payment_reconciliation.reconciliation_status', 'discrepancy')
      .orWhere('payment_reconciliation.reconciliation_status', 'manual_review')
      .select(
        'payment_reconciliation.*',
        'payments.amount as payment_amount',
        'payments.currency',
        'payments.type as payment_type',
        'users.name as user_name',
        'users.email as user_email'
      )
      .orderBy('payment_reconciliation.created_at', 'desc');

    return discrepancies;
  }

  /**
   * Resolver discrepância manualmente
   */
  static async resolveDiscrepancy(reconciliationId, resolution, notes, userId) {
    try {
      await db('payment_reconciliation')
        .where({ id: reconciliationId })
        .update({
          reconciliation_status: 'matched',
          reconciliation_notes: notes,
          reconciled_by: userId,
          reconciled_at: new Date()
        });

      // Log da resolução
      await db('audit_logs').insert({
        user_id: userId,
        action: 'reconciliation_resolved',
        resource_type: 'payment_reconciliation',
        resource_id: reconciliationId,
        details: {
          resolution,
          notes
        }
      });

      logger.info({ 
        reconciliationId, 
        resolution, 
        resolvedBy: userId 
      }, 'Discrepância resolvida manualmente');

    } catch (error) {
      logger.error({ error, reconciliationId }, 'Erro ao resolver discrepância');
      throw error;
    }
  }

  /**
   * Gerar relatório de reconciliação
   */
  static async generateReconciliationReport(dateFrom, dateTo) {
    try {
      const [
        totalPayments,
        reconciledPayments,
        pendingReconciliation,
        discrepancies,
        totalVolume,
        totalFees
      ] = await Promise.all([
        // Total de pagamentos no período
        db('payments')
          .whereBetween('created_at', [dateFrom, dateTo])
          .count('* as count')
          .first(),

        // Pagamentos reconciliados
        db('payments')
          .join('payment_reconciliation', 'payments.id', 'payment_reconciliation.payment_id')
          .whereBetween('payments.created_at', [dateFrom, dateTo])
          .where('payment_reconciliation.reconciliation_status', 'matched')
          .count('* as count')
          .first(),

        // Pendentes de reconciliação
        db('payments')
          .leftJoin('payment_reconciliation', 'payments.id', 'payment_reconciliation.payment_id')
          .whereNull('payment_reconciliation.id')
          .whereBetween('payments.created_at', [dateFrom, dateTo])
          .count('* as count')
          .first(),

        // Discrepâncias
        db('payments')
          .join('payment_reconciliation', 'payments.id', 'payment_reconciliation.payment_id')
          .whereBetween('payments.created_at', [dateFrom, dateTo])
          .whereIn('payment_reconciliation.reconciliation_status', ['discrepancy', 'manual_review'])
          .count('* as count')
          .first(),

        // Volume total
        db('payments')
          .whereBetween('created_at', [dateFrom, dateTo])
          .where('status', 'succeeded')
          .sum('amount as total')
          .first(),

        // Taxas totais
        db('payments')
          .whereBetween('created_at', [dateFrom, dateTo])
          .where('status', 'succeeded')
          .sum('fee_amount as total')
          .first()
      ]);

      const report = {
        period: { from: dateFrom, to: dateTo },
        summary: {
          total_payments: parseInt(totalPayments.count),
          reconciled_payments: parseInt(reconciledPayments.count),
          pending_reconciliation: parseInt(pendingReconciliation.count),
          discrepancies: parseInt(discrepancies.count),
          reconciliation_rate: totalPayments.count > 0 ? 
            (reconciledPayments.count / totalPayments.count * 100).toFixed(2) : 0
        },
        financial: {
          total_volume: parseFloat(totalVolume.total || 0),
          total_fees: parseFloat(totalFees.total || 0),
          net_volume: parseFloat(totalVolume.total || 0) - parseFloat(totalFees.total || 0)
        },
        generated_at: new Date()
      };

      // Salvar relatório
      await db('financial_reports').insert({
        type: 'reconciliation',
        report_date: new Date().toISOString().split('T')[0],
        data: report,
        status: 'completed'
      });

      return report;

    } catch (error) {
      logger.error({ error }, 'Erro ao gerar relatório de reconciliação');
      throw error;
    }
  }
}
