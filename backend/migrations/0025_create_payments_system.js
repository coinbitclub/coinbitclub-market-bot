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
    table.string('operation_type').notNullable(); // 'trade', 'copy_trade', 'signal', etc.
    table.enum('operation_direction', ['debit', 'credit']).notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.decimal('balance_before', 15, 2).notNullable();
    table.decimal('balance_after', 15, 2).notNullable();
    table.string('currency', 3).defaultTo('BRL');
    table.boolean('allowed').notNullable(); // Se a operação foi permitida
    table.text('reason').nullable(); // Motivo se não foi permitida
    table.text('description').nullable();
    table.jsonb('metadata').nullable();
    table.timestamps(true, true);
    
    table.index(['user_id', 'created_at']);
    table.index(['operation_type']);
    table.index(['allowed']);
    table.index(['currency', 'created_at']);
  });

  // Tabela de alertas do sistema
  await knex.schema.createTable('system_alerts', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.enum('type', ['reconciliation_discrepancy', 'high_failure_rate', 'suspicious_activity', 'system_error']).notNullable();
    table.enum('severity', ['low', 'medium', 'high', 'critical']).notNullable();
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.jsonb('data').nullable();
    table.boolean('resolved').defaultTo(false);
    table.integer('resolved_by').nullable().references('id').inTable('users');
    table.timestamp('resolved_at').nullable();
    table.timestamps(true, true);
    
    table.index(['type', 'severity']);
    table.index(['resolved', 'created_at']);
  });

  // Tabela para armazenar snapshots de saldo Stripe
  await knex.schema.createTable('stripe_balance_snapshots', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.jsonb('available_balance').notNullable(); // Saldo disponível por moeda
    table.jsonb('pending_balance').notNullable(); // Saldo pendente por moeda
    table.decimal('total_available_brl', 15, 2).defaultTo(0);
    table.decimal('total_available_usd', 15, 2).defaultTo(0);
    table.decimal('total_pending_brl', 15, 2).defaultTo(0);
    table.decimal('total_pending_usd', 15, 2).defaultTo(0);
    table.timestamp('snapshot_date').notNullable();
    table.timestamps(true, true);
    
    table.index(['snapshot_date']);
  });

  // Tabela para relatórios diários automáticos
  await knex.schema.createTable('daily_reports', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.date('report_date').notNullable().unique();
    table.string('report_type').notNullable(); // 'financial_daily', 'operational_daily'
    table.jsonb('report_data').notNullable();
    table.enum('status', ['generating', 'completed', 'failed']).defaultTo('completed');
    table.timestamps(true, true);
    
    table.index(['report_date', 'report_type']);
  });

  // Tabela para relatórios semanais
  await knex.schema.createTable('weekly_reports', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.date('week_start').notNullable();
    table.date('week_end').notNullable();
    table.string('report_type').notNullable();
    table.jsonb('report_data').notNullable();
    table.enum('status', ['generating', 'completed', 'failed']).defaultTo('completed');
    table.timestamps(true, true);
    
    table.unique(['week_start', 'report_type']);
  });

  // Tabela para relatórios mensais
  await knex.schema.createTable('monthly_reports', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.date('month_start').notNullable();
    table.date('month_end').notNullable();
    table.string('report_type').notNullable();
    table.jsonb('report_data').notNullable();
    table.enum('status', ['generating', 'completed', 'failed']).defaultTo('completed');
    table.timestamps(true, true);
    
    table.unique(['month_start', 'report_type']);
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
      key: 'prepaid_discounts',
      value: JSON.stringify({
        enabled: true,
        brl_tiers: [
          { minimum: 60000, maximum: 599999, discount_percentage: 5 }, // R$ 600 - R$ 5.999
          { minimum: 600000, maximum: 99999999, discount_percentage: 10 } // R$ 6.000+
        ],
        usd_tiers: [
          { minimum: 6000, maximum: 59999, discount_percentage: 5 }, // USD 60 - USD 599
          { minimum: 60000, maximum: 99999999, discount_percentage: 10 } // USD 600+
        ],
        first_time_only: false // Aplicar em todas as recargas que atendem aos critérios
      }),
      description: 'Configurações de desconto promocional por faixa de recarga'
    },
    {
      key: 'subscription_plans',
      value: JSON.stringify({
        brasil_mensal: {
          monthly_fee: 20000, // R$ 200.00
          commission_rate: 10,
          currency: 'BRL'
        },
        brasil_comissao: {
          monthly_fee: 0,
          commission_rate: 20,
          currency: 'BRL'
        },
        exterior_mensal: {
          monthly_fee: 4000, // USD 40.00
          commission_rate: 10,
          currency: 'USD'
        },
        exterior_comissao: {
          monthly_fee: 0,
          commission_rate: 20,
          currency: 'USD'
        }
      }),
      description: 'Configurações dos planos de assinatura'
    },
    {
      key: 'withdrawal_settings',
      value: JSON.stringify({
        auto_approval_limit: 1000,
        business_hours_only: true,
        max_daily_withdrawals: 5
      }),
      description: 'Configurações de saque automático'
    }
  ]);

  // Inserir tiers de afiliados
  await knex('affiliate_tiers').insert([
    {
      name: 'normal',
      commission_rate: 0.015, // 1.5%
      minimum_volume: 0,
      benefits: JSON.stringify(['comissão_standard']),
      is_active: true
    },
    {
      name: 'vip',
      commission_rate: 0.05, // 5%
      minimum_volume: 10000,
      benefits: JSON.stringify(['comissão_premium', 'suporte_prioritário', 'materiais_exclusivos']),
      is_active: true
    }
  ]);

  // Inserir configurações de moedas
  await knex('currency_settings').insert([
    {
      currency: 'BRL',
      country_code: 'BR',
      minimum_balance: 100.00, // Mínimo para recarga R$ 100
      minimum_operation: 100.00, // Mínimo para operação
      withdrawal_fee_percentage: 0.02, // 2%
      withdrawal_fee_fixed: 5.00,
      minimum_withdrawal: 50.00,
      prepaid_enabled: true,
      subscription_enabled: true,
      payment_methods: JSON.stringify(['card', 'pix', 'boleto'])
    },
    {
      currency: 'USD',
      country_code: 'US',
      minimum_balance: 20.00, // Mínimo para recarga USD 20
      minimum_operation: 20.00, // Mínimo para operação
      withdrawal_fee_percentage: 0.025, // 2.5%
      withdrawal_fee_fixed: 2.00,
      minimum_withdrawal: 20.00,
      prepaid_enabled: true,
      subscription_enabled: true,
      payment_methods: JSON.stringify(['card', 'crypto'])
    }
  ]);

  // Tabela de produtos Stripe
  await knex.schema.createTable('stripe_products', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('stripe_product_id').notNullable().unique();
    table.string('name').notNullable();
    table.text('description').nullable();
    table.enum('type', ['subscription', 'prepaid', 'one_time']).notNullable();
    table.jsonb('features').nullable(); // Lista de recursos
    table.boolean('is_active').defaultTo(true);
    table.jsonb('metadata').nullable();
    table.timestamps(true, true);
    
    table.index(['type', 'is_active']);
    table.index(['stripe_product_id']);
  });

  // Tabela de preços Stripe
  await knex.schema.createTable('stripe_prices', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('product_id').notNullable().references('id').inTable('stripe_products').onDelete('CASCADE');
    table.string('stripe_price_id').notNullable().unique();
    table.decimal('amount', 15, 2).notNullable();
    table.string('currency', 3).notNullable();
    table.string('interval').nullable(); // month, year para assinaturas
    table.integer('interval_count').defaultTo(1);
    table.integer('trial_period_days').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.string('nickname').nullable();
    table.jsonb('metadata').nullable();
    table.timestamps(true, true);
    
    table.index(['product_id', 'is_active']);
    table.index(['stripe_price_id']);
    table.index(['currency', 'amount']);
  });

  // Tabela de sessões de checkout
  await knex.schema.createTable('checkout_sessions', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('stripe_session_id').notNullable().unique();
    table.integer('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('price_id').notNullable().references('id').inTable('stripe_prices');
    table.enum('status', ['open', 'complete', 'expired']).defaultTo('open');
    table.decimal('amount', 15, 2).notNullable();
    table.string('currency', 3).notNullable();
    table.string('stripe_payment_intent_id').nullable();
    table.string('stripe_subscription_id').nullable();
    table.timestamp('completed_at').nullable();
    table.timestamp('expires_at').nullable();
    table.jsonb('metadata').nullable();
    table.timestamps(true, true);
    
    table.index(['stripe_session_id']);
    table.index(['user_id', 'status']);
    table.index(['status', 'created_at']);
  });

  // Tabela de códigos promocionais
  await knex.schema.createTable('promotional_codes', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('code').notNullable().unique();
    table.string('stripe_coupon_id').nullable();
    table.string('stripe_promotion_code_id').nullable();
    table.enum('discount_type', ['percentage', 'fixed_amount']).notNullable();
    table.decimal('discount_value', 15, 2).notNullable(); // % ou valor fixo
    table.string('currency', 3).nullable(); // Para descontos de valor fixo
    table.integer('max_redemptions').nullable();
    table.integer('times_redeemed').defaultTo(0);
    table.timestamp('valid_from').nullable();
    table.timestamp('valid_until').nullable();
    table.boolean('is_active').defaultTo(true);
    table.boolean('first_purchase_only').defaultTo(true); // Aplicar apenas na primeira compra
    table.boolean('applies_to_subscription').defaultTo(true); // Se aplica à primeira mensalidade
    table.boolean('applies_to_prepaid').defaultTo(true); // Se aplica à primeira recarga
    table.decimal('minimum_amount', 15, 2).nullable(); // Valor mínimo para aplicar desconto
    table.text('description').nullable();
    table.jsonb('applicable_products').nullable(); // IDs dos produtos aplicáveis
    table.timestamps(true, true);
    
    table.index(['code', 'is_active']);
    table.index(['valid_from', 'valid_until']);
    table.index(['first_purchase_only']);
  });

  // Tabela de uso de códigos promocionais
  await knex.schema.createTable('promotional_code_usage', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('promotional_code_id').notNullable().references('id').inTable('promotional_codes').onDelete('CASCADE');
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('checkout_session_id').nullable().references('id').inTable('checkout_sessions');
    table.decimal('discount_applied', 15, 2).notNullable();
    table.string('currency', 3).notNullable();
    table.timestamps(true, true);
    
    table.index(['promotional_code_id']);
    table.index(['user_id']);
    table.unique(['promotional_code_id', 'user_id']); // Um usuário só pode usar um código uma vez
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('promotional_code_usage');
  await knex.schema.dropTableIfExists('promotional_codes');
  await knex.schema.dropTableIfExists('checkout_sessions');
  await knex.schema.dropTableIfExists('stripe_prices');
  await knex.schema.dropTableIfExists('stripe_products');
  await knex.schema.dropTableIfExists('monthly_reports');
  await knex.schema.dropTableIfExists('weekly_reports');
  await knex.schema.dropTableIfExists('daily_reports');
  await knex.schema.dropTableIfExists('stripe_balance_snapshots');
  await knex.schema.dropTableIfExists('system_alerts');
  await knex.schema.dropTableIfExists('operation_logs');
  await knex.schema.dropTableIfExists('financial_reports');
  await knex.schema.dropTableIfExists('currency_settings');
  
  // Remover colunas adicionadas à tabela users
  await knex.schema.table('users', table => {
    table.dropColumn('affiliate_tier_id');
    table.dropColumn('minimum_balance_required');
    table.dropColumn('can_operate');
  });
  
  await knex.schema.dropTableIfExists('affiliate_tiers');
  await knex.schema.dropTableIfExists('withdrawal_requests');
  await knex.schema.dropTableIfExists('webhook_logs');
  await knex.schema.dropTableIfExists('payment_settings');
  await knex.schema.dropTableIfExists('prepaid_transactions');
  await knex.schema.dropTableIfExists('user_prepaid_balance');
  await knex.schema.dropTableIfExists('payment_reconciliation');
  await knex.schema.dropTableIfExists('payments');
}
