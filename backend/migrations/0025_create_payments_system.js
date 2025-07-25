/**
 * Complete Payments System Migration
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Tabela principal de pagamentos
  await knex.schema.createTable('payments', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('stripe_payment_intent_id').unique();
    table.string('stripe_invoice_id').nullable();
    table.string('stripe_subscription_id').nullable();
    table.enum('type', ['subscription', 'prepaid', 'one_time', 'refund']).notNullable();
    table.enum('status', ['pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded']).defaultTo('pending');
    table.decimal('amount', 15, 2).notNullable();
    table.string('currency', 3).defaultTo('BRL');
    table.decimal('fee_amount', 15, 2).defaultTo(0);
    table.string('payment_method').nullable(); // card, pix, boleto, etc
    table.string('payment_method_id').nullable(); // Stripe payment method ID
    table.jsonb('metadata').nullable();
    table.timestamp('paid_at').nullable();
    table.timestamp('failed_at').nullable();
    table.text('failure_reason').nullable();
    table.text('description').nullable();
    table.timestamps(true, true);
    
    table.index(['user_id', 'created_at']);
    table.index(['status', 'created_at']);
    table.index(['type', 'status']);
    table.index(['stripe_payment_intent_id']);
  });

  // Tabela de reconciliação de pagamentos
  await knex.schema.createTable('payment_reconciliation', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('payment_id').notNullable().references('id').inTable('payments').onDelete('CASCADE');
    table.string('external_transaction_id').notNullable(); // ID da transação no gateway
    table.decimal('gateway_amount', 15, 2).notNullable();
    table.decimal('gateway_fee', 15, 2).defaultTo(0);
    table.enum('reconciliation_status', ['pending', 'matched', 'discrepancy', 'manual_review']).defaultTo('pending');
    table.timestamp('gateway_processed_at').nullable();
    table.jsonb('gateway_data').nullable();
    table.text('reconciliation_notes').nullable();
    table.integer('reconciled_by').nullable().references('id').inTable('users');
    table.timestamp('reconciled_at').nullable();
    table.timestamps(true, true);
    
    table.unique(['external_transaction_id']);
    table.index(['reconciliation_status']);
    table.index(['gateway_processed_at']);
  });

  // Tabela de saldos pré-pagos dos usuários
  await knex.schema.createTable('user_prepaid_balance', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('balance', 15, 2).defaultTo(0);
    table.decimal('pending_balance', 15, 2).defaultTo(0); // Saldo pendente de confirmação
    table.string('currency', 3).defaultTo('BRL');
    table.timestamp('last_transaction_at').nullable();
    table.timestamps(true, true);
    
    table.unique(['user_id', 'currency']);
    table.index(['user_id']);
  });

  // Tabela de transações de saldo pré-pago
  await knex.schema.createTable('prepaid_transactions', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('payment_id').nullable().references('id').inTable('payments').onDelete('SET NULL');
    table.enum('type', ['credit', 'debit', 'bonus', 'refund', 'fee']).notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.string('currency', 3).defaultTo('BRL');
    table.decimal('balance_before', 15, 2).notNullable();
    table.decimal('balance_after', 15, 2).notNullable();
    table.text('description').notNullable();
    table.string('reference_id').nullable(); // ID de referência (subscription, order, etc)
    table.jsonb('metadata').nullable();
    table.timestamps(true, true);
    
    table.index(['user_id', 'created_at']);
    table.index(['type', 'created_at']);
    table.index(['reference_id']);
  });

  // Tabela de configurações de pagamento
  await knex.schema.createTable('payment_settings', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('key').notNullable().unique();
    table.jsonb('value').notNullable();
    table.text('description').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  // Tabela de logs de webhook
  await knex.schema.createTable('webhook_logs', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('provider').notNullable(); // stripe, paypal, etc
    table.string('event_type').notNullable();
    table.string('event_id').notNullable();
    table.jsonb('payload').notNullable();
    table.enum('status', ['received', 'processing', 'processed', 'failed', 'ignored']).defaultTo('received');
    table.text('processing_notes').nullable();
    table.timestamp('processed_at').nullable();
    table.integer('retry_count').defaultTo(0);
    table.timestamps(true, true);
    
    table.unique(['provider', 'event_id']);
    table.index(['status', 'created_at']);
    table.index(['event_type']);
  });

  // Tabela de solicitações de saque
  await knex.schema.createTable('withdrawal_requests', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('amount', 15, 2).notNullable();
    table.string('currency', 3).defaultTo('BRL');
    table.enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled']).defaultTo('pending');
    table.enum('withdrawal_type', ['user_prepaid', 'admin_profit', 'affiliate_commission']).notNullable();
    table.jsonb('bank_details').nullable(); // Dados bancários para o saque
    table.string('pix_key').nullable(); // Chave PIX para saques em BRL
    table.string('crypto_address').nullable(); // Endereço crypto para saques internacionais
    table.decimal('fee_amount', 15, 2).defaultTo(0);
    table.decimal('net_amount', 15, 2).notNullable(); // Valor líquido após taxas
    table.text('processing_notes').nullable();
    table.timestamp('processed_at').nullable();
    table.integer('processed_by').nullable().references('id').inTable('users');
    table.string('transaction_hash').nullable(); // Hash da transação (se crypto)
    table.timestamps(true, true);
    
    table.index(['user_id', 'created_at']);
    table.index(['status', 'created_at']);
    table.index(['withdrawal_type']);
  });

  // Tabela de tipos de afiliados (VIP vs Normal)
  await knex.schema.createTable('affiliate_tiers', table => {
    table.increments('id').primary();
    table.string('name').notNullable().unique(); // 'normal', 'vip'
    table.decimal('commission_rate', 5, 4).notNullable(); // 0.015 (1.5%) ou 0.05 (5%)
    table.decimal('minimum_volume', 15, 2).defaultTo(0); // Volume mínimo para manter o tier
    table.jsonb('benefits').nullable(); // Benefícios adicionais
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  // Atualizar tabela de users para incluir tier de afiliado
  await knex.schema.table('users', table => {
    table.integer('affiliate_tier_id').nullable().references('id').inTable('affiliate_tiers');
    table.decimal('minimum_balance_required', 15, 2).defaultTo(100); // Saldo mínimo para operar
    table.boolean('can_operate').defaultTo(true); // Se pode abrir novas operações
  });

  // Tabela de configurações de operação por moeda
  await knex.schema.createTable('currency_settings', table => {
    table.increments('id').primary();
    table.string('currency', 3).notNullable().unique();
    table.string('country_code', 2).nullable(); // BR, US, etc
    table.decimal('minimum_balance', 15, 2).notNullable();
    table.decimal('minimum_operation', 15, 2).notNullable();
    table.decimal('withdrawal_fee_percentage', 5, 4).defaultTo(0); // Taxa de saque em %
    table.decimal('withdrawal_fee_fixed', 15, 2).defaultTo(0); // Taxa fixa de saque
    table.decimal('minimum_withdrawal', 15, 2).defaultTo(50);
    table.boolean('prepaid_enabled').defaultTo(true);
    table.boolean('subscription_enabled').defaultTo(true);
    table.jsonb('payment_methods').nullable(); // Métodos de pagamento disponíveis
    table.timestamps(true, true);
  });

  // Tabela de relatórios financeiros
  await knex.schema.createTable('financial_reports', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('type').notNullable(); // daily, weekly, monthly, reconciliation
    table.date('report_date').notNullable();
    table.jsonb('data').notNullable();
    table.enum('status', ['generating', 'completed', 'failed']).defaultTo('generating');
    table.integer('generated_by').nullable().references('id').inTable('users');
    table.timestamps(true, true);
    
    table.unique(['type', 'report_date']);
    table.index(['type', 'status']);
  });

  // Tabela de logs de operações (para controle de saldo mínimo)
  await knex.schema.createTable('operation_logs', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('operation_type').notNullable(); // 'trade_open', 'trade_close', 'balance_check'
    table.decimal('balance_before', 15, 2).notNullable();
    table.decimal('balance_after', 15, 2).nullable();
    table.decimal('amount_used', 15, 2).nullable();
    table.string('currency', 3).defaultTo('BRL');
    table.boolean('allowed').notNullable(); // Se a operação foi permitida
    table.text('reason').nullable(); // Motivo se não foi permitida
    table.jsonb('metadata').nullable();
    table.timestamps(true, true);
    
    table.index(['user_id', 'created_at']);
    table.index(['operation_type']);
    table.index(['allowed']);
  });

  // Inserir configurações padrão
  await knex('payment_settings').insert([
    {
      key: 'stripe_webhook_tolerance',
      value: JSON.stringify({ seconds: 300 }),
      description: 'Tolerância de tempo para webhooks do Stripe (em segundos)'
    },
    {
      key: 'auto_reconciliation',
      value: JSON.stringify({ enabled: true, max_discrepancy: 0.01 }),
      description: 'Configurações de reconciliação automática'
    },
    {
      key: 'payment_methods',
      value: JSON.stringify({
        enabled: ['card', 'pix', 'boleto'],
        default: 'card'
      }),
      description: 'Métodos de pagamento habilitados'
    },
    {
      key: 'prepaid_bonus',
      value: JSON.stringify({
        enabled: true,
        tiers: [
          { minimum: 100, bonus_percentage: 5 },
          { minimum: 500, bonus_percentage: 10 },
          { minimum: 1000, bonus_percentage: 15 }
        ]
      }),
      description: 'Configurações de bônus para recarga pré-paga'
    }
  ]);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('financial_reports');
  await knex.schema.dropTableIfExists('webhook_logs');
  await knex.schema.dropTableIfExists('payment_settings');
  await knex.schema.dropTableIfExists('prepaid_transactions');
  await knex.schema.dropTableIfExists('user_prepaid_balance');
  await knex.schema.dropTableIfExists('payment_reconciliation');
  await knex.schema.dropTableIfExists('payments');
}
