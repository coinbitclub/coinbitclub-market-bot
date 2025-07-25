import { PaymentService } from '../api-gateway/src/services/paymentService.js';
import { ReconciliationService } from '../api-gateway/src/services/reconciliationService.js';
import { db } from '../common/db.js';

export async function seed(knex) {
  // Limpar dados existentes (apenas para desenvolvimento)
  if (process.env.NODE_ENV !== 'production') {
    await knex('prepaid_transactions').del();
    await knex('user_prepaid_balance').del();
    await knex('payment_reconciliation').del();
    await knex('payments').del();
    await knex('webhook_logs').del();
    await knex('financial_reports').del();
  }

  // Inserir dados de exemplo para desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    
    // Buscar usuários existentes
    const users = await knex('users').select('id', 'name', 'email').limit(5);
    
    if (users.length > 0) {
      // Criar alguns pagamentos de exemplo
      const samplePayments = [];
      
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        
        // Pagamento pré-pago bem sucedido
        samplePayments.push({
          user_id: user.id,
          stripe_payment_intent_id: `pi_test_${Date.now()}_${i}`,
          type: 'prepaid',
          status: 'succeeded',
          amount: 100 + (i * 50),
          currency: 'BRL',
          payment_method: 'card',
          description: `Recarga pré-paga de teste - ${user.name}`,
          paid_at: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Dias diferentes
          metadata: {
            bonus_amount: (100 + (i * 50)) * 0.05, // 5% de bônus
            total_credit: (100 + (i * 50)) * 1.05
          }
        });

        // Pagamento de assinatura
        if (i < 3) {
          samplePayments.push({
            user_id: user.id,
            stripe_payment_intent_id: `pi_test_sub_${Date.now()}_${i}`,
            type: 'subscription',
            status: 'succeeded',
            amount: 99.90,
            currency: 'BRL',
            payment_method: 'card',
            description: `Assinatura mensal - ${user.name}`,
            paid_at: new Date(),
            metadata: {
              subscription_type: 'monthly'
            }
          });
        }
      }

      // Inserir pagamentos
      const insertedPayments = await knex('payments').insert(samplePayments).returning('*');

      // Criar saldos pré-pagos para os usuários
      const prepaidBalances = [];
      const prepaidTransactions = [];

      for (const payment of insertedPayments) {
        if (payment.type === 'prepaid' && payment.status === 'succeeded') {
          const metadata = payment.metadata || {};
          const totalCredit = metadata.total_credit || payment.amount;

          // Verificar se já existe saldo para este usuário
          const existingBalance = prepaidBalances.find(b => b.user_id === payment.user_id);
          
          if (existingBalance) {
            existingBalance.balance += totalCredit;
          } else {
            prepaidBalances.push({
              user_id: payment.user_id,
              balance: totalCredit,
              currency: payment.currency,
              last_transaction_at: payment.paid_at
            });
          }

          // Criar transação de crédito
          prepaidTransactions.push({
            user_id: payment.user_id,
            payment_id: payment.id,
            type: 'credit',
            amount: totalCredit,
            currency: payment.currency,
            balance_before: 0,
            balance_after: totalCredit,
            description: 'Recarga de desenvolvimento',
            reference_id: payment.id
          });
        }
      }

      // Inserir saldos
      if (prepaidBalances.length > 0) {
        await knex('user_prepaid_balance').insert(prepaidBalances);
      }

      // Inserir transações
      if (prepaidTransactions.length > 0) {
        await knex('prepaid_transactions').insert(prepaidTransactions);
      }

      // Criar reconciliações de exemplo
      const reconciliations = insertedPayments.map(payment => ({
        payment_id: payment.id,
        external_transaction_id: `ch_test_${payment.id}`,
        gateway_amount: payment.amount,
        gateway_fee: payment.amount * 0.029, // Taxa típica do Stripe
        reconciliation_status: 'matched',
        gateway_processed_at: payment.paid_at,
        reconciled_at: payment.paid_at,
        gateway_data: {
          charge_id: `ch_test_${payment.id}`,
          balance_transaction: `txn_test_${payment.id}`
        }
      }));

      await knex('payment_reconciliation').insert(reconciliations);

      // Criar alguns logs de webhook de exemplo
      const webhookLogs = [];
      for (let i = 0; i < 10; i++) {
        webhookLogs.push({
          provider: 'stripe',
          event_type: i % 2 === 0 ? 'payment_intent.succeeded' : 'invoice.payment_succeeded',
          event_id: `evt_test_${Date.now()}_${i}`,
          payload: {
            id: `evt_test_${Date.now()}_${i}`,
            type: i % 2 === 0 ? 'payment_intent.succeeded' : 'invoice.payment_succeeded',
            data: { object: { id: `test_${i}`, amount: 9990 } }
          },
          status: 'processed',
          processed_at: new Date(Date.now() - (i * 60 * 60 * 1000))
        });
      }

      await knex('webhook_logs').insert(webhookLogs);

      // Criar relatório financeiro de exemplo
      await knex('financial_reports').insert({
        type: 'daily',
        report_date: new Date().toISOString().split('T')[0],
        data: {
          date: new Date().toISOString().split('T')[0],
          payments: {
            total: insertedPayments.length,
            successful: insertedPayments.filter(p => p.status === 'succeeded').length,
            failed: 0,
            success_rate: '100.00'
          },
          volume: {
            total: insertedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
            prepaid: insertedPayments.filter(p => p.type === 'prepaid').reduce((sum, p) => sum + parseFloat(p.amount), 0),
            subscription: insertedPayments.filter(p => p.type === 'subscription').reduce((sum, p) => sum + parseFloat(p.amount), 0),
            fees: insertedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) * 0.029), 0),
            net: insertedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) * 0.971), 0)
          },
          users: {
            unique_payers: users.length
          },
          generated_at: new Date()
        },
        status: 'completed'
      });

      console.log(`✅ Seed de pagamentos concluído:`);
      console.log(`   - ${insertedPayments.length} pagamentos criados`);
      console.log(`   - ${prepaidBalances.length} saldos pré-pagos criados`);
      console.log(`   - ${prepaidTransactions.length} transações pré-pagas criadas`);
      console.log(`   - ${reconciliations.length} reconciliações criadas`);
      console.log(`   - ${webhookLogs.length} logs de webhook criados`);
      console.log(`   - 1 relatório financeiro criado`);
    }
  }
}
