/**
 * Migration: Sistema de Crédito para Afiliados
 * Permite afiliados usarem comissões como crédito em conta
 */

export const up = async (knex) => {
  
  // Tabela para registro de uso de crédito de afiliados
  await knex.schema.createTable('affiliate_credit_usage', (table) => {
    table.uuid('id').primary();
    table.uuid('affiliate_id').notNullable();
    table.decimal('amount', 15, 2).notNullable(); // Valor em BRL
    table.string('currency', 3).notNullable().defaultTo('BRL');
    table.text('description');
    table.enum('status', ['pending', 'completed', 'cancelled']).notNullable().defaultTo('pending');
    table.decimal('conversion_rate', 10, 6); // Taxa BRL -> USD
    table.decimal('converted_amount_usd', 15, 2); // Valor convertido em USD
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at');
    table.timestamp('cancelled_at');
    
    // Índices
    table.index('affiliate_id');
    table.index('status');
    table.index('created_at');
    table.index(['affiliate_id', 'status']);
    
    // Chave estrangeira
    table.foreign('affiliate_id').references('id').inTable('users').onDelete('CASCADE');
  });

  // Tabela para configurações de crédito
  await knex.schema.createTable('affiliate_credit_settings', (table) => {
    table.uuid('id').primary();
    table.decimal('min_conversion_amount', 10, 2).notNullable().defaultTo(10.00); // Mínimo R$ 10
    table.decimal('max_conversion_amount', 15, 2); // Máximo por operação
    table.decimal('daily_conversion_limit', 15, 2); // Limite diário
    table.decimal('monthly_conversion_limit', 15, 2); // Limite mensal
    table.decimal('conversion_fee_percent', 5, 4).defaultTo(0); // Taxa de conversão
    table.boolean('enabled').defaultTo(true);
    table.json('allowed_currencies').defaultTo('["USD"]'); // Moedas permitidas para conversão
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Inserir configurações padrão
  await knex('affiliate_credit_settings').insert({
    id: knex.raw('gen_random_uuid()'),
    min_conversion_amount: 10.00,
    max_conversion_amount: 5000.00,
    daily_conversion_limit: 1000.00,
    monthly_conversion_limit: 10000.00,
    conversion_fee_percent: 0,
    enabled: true,
    allowed_currencies: JSON.stringify(['USD']),
    created_at: knex.fn.now(),
    updated_at: knex.fn.now()
  });

  // Adicionar campos extras à tabela de comissões se não existirem
  const hasAvailableForCredit = await knex.schema.hasColumn('affiliate_commissions', 'available_for_credit');
  if (!hasAvailableForCredit) {
    await knex.schema.alterTable('affiliate_commissions', (table) => {
      table.boolean('available_for_credit').defaultTo(true);
      table.decimal('used_as_credit', 15, 2).defaultTo(0);
    });
  }

  // Tabela para histórico de conversões de taxa de câmbio (para auditoria)
  await knex.schema.createTable('credit_conversion_history', (table) => {
    table.uuid('id').primary();
    table.uuid('credit_usage_id').notNullable();
    table.string('from_currency', 3).notNullable();
    table.string('to_currency', 3).notNullable();
    table.decimal('original_amount', 15, 2).notNullable();
    table.decimal('converted_amount', 15, 2).notNullable();
    table.decimal('exchange_rate', 10, 6).notNullable();
    table.string('rate_source', 50); // API usada para taxa
    table.timestamp('conversion_date').defaultTo(knex.fn.now());
    
    // Índices
    table.index('credit_usage_id');
    table.index('conversion_date');
    table.index(['from_currency', 'to_currency']);
    
    // Chave estrangeira
    table.foreign('credit_usage_id').references('id').inTable('affiliate_credit_usage').onDelete('CASCADE');
  });

  // Tabela para limites de uso de crédito por afiliado
  await knex.schema.createTable('affiliate_credit_limits', (table) => {
    table.uuid('id').primary();
    table.uuid('affiliate_id').notNullable();
    table.decimal('daily_used', 15, 2).defaultTo(0);
    table.decimal('monthly_used', 15, 2).defaultTo(0);
    table.date('last_daily_reset');
    table.date('last_monthly_reset');
    table.decimal('custom_daily_limit', 15, 2); // Limite personalizado
    table.decimal('custom_monthly_limit', 15, 2); // Limite personalizado
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Índices
    table.index('affiliate_id');
    table.index('last_daily_reset');
    table.index('last_monthly_reset');
    
    // Chave estrangeira e unique
    table.foreign('affiliate_id').references('id').inTable('users').onDelete('CASCADE');
    table.unique('affiliate_id');
  });

  // Atualizar tabela de prepaid_transactions para incluir fonte
  const hasSourceField = await knex.schema.hasColumn('prepaid_transactions', 'source_type');
  if (!hasSourceField) {
    await knex.schema.alterTable('prepaid_transactions', (table) => {
      table.string('source_type', 50); // 'payment', 'affiliate_credit', 'bonus', 'refund', etc.
      table.uuid('source_reference_id'); // ID da transação de origem
    });
    
    // Atualizar registros existentes
    await knex('prepaid_transactions').update({
      source_type: 'legacy'
    });
  }

  console.log('✅ Migração do sistema de crédito para afiliados criada com sucesso');
};

export const down = async (knex) => {
  // Remover campos adicionados
  await knex.schema.alterTable('prepaid_transactions', (table) => {
    table.dropColumn('source_type');
    table.dropColumn('source_reference_id');
  });

  await knex.schema.alterTable('affiliate_commissions', (table) => {
    table.dropColumn('available_for_credit');
    table.dropColumn('used_as_credit');
  });

  // Remover tabelas
  await knex.schema.dropTableIfExists('affiliate_credit_limits');
  await knex.schema.dropTableIfExists('credit_conversion_history');
  await knex.schema.dropTableIfExists('affiliate_credit_settings');
  await knex.schema.dropTableIfExists('affiliate_credit_usage');

  console.log('✅ Migração do sistema de crédito para afiliados revertida');
};
