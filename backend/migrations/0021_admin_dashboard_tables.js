/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function(knex) {
  // Tabela para leituras do mercado
  await knex.schema.createTable('market_readings', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.enum('direction', ['LONG', 'SHORT', 'NEUTRO']).notNullable();
    table.decimal('confidence', 5, 2).notNullable(); // 0.00 to 100.00
    table.text('ai_justification');
    table.text('day_tracking');
    table.json('market_data'); // Dados extras do mercado
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('created_at');
  });

  // Tabela para logs do sistema
  await knex.schema.createTable('system_logs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.enum('level', ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']).notNullable();
    table.string('service').notNullable(); // api-gateway, decision-engine, etc.
    table.string('component'); // controller, service, etc.
    table.text('message').notNullable();
    table.json('metadata'); // Dados extras
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    
    table.index(['timestamp', 'level']);
    table.index('service');
  });

  // Tabela para estratégias dos ingestores
  await knex.schema.createTable('ingestor_strategies', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable().unique();
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.enum('source', ['TRADINGVIEW', 'COINTARS', 'CUSTOM']).notNullable();
    table.json('config'); // Configurações específicas da estratégia
    table.decimal('accuracy', 5, 2).defaultTo(0); // Precisão histórica
    table.integer('signals_today').defaultTo(0);
    table.timestamp('last_signal_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('is_active');
    table.index('source');
  });

  // Atualizar tabela de sinais se não existir coluna strategy
  const hasStrategyColumn = await knex.schema.hasColumn('signals', 'strategy');
  if (!hasStrategyColumn) {
    await knex.schema.alterTable('signals', function(table) {
      table.string('strategy'); // Nome da estratégia usada
      table.decimal('accuracy', 5, 2); // Precisão do sinal
    });
  }

  // Atualizar tabela de orders se não existir colunas de P&L
  const hasProfitLossColumn = await knex.schema.hasColumn('orders', 'profit_loss');
  if (!hasProfitLossColumn) {
    await knex.schema.alterTable('orders', function(table) {
      table.decimal('profit_loss', 15, 2).defaultTo(0); // P&L em USDT
      table.decimal('profit_loss_percentage', 5, 2).defaultTo(0); // P&L em %
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function(knex) {
  await knex.schema.dropTableIfExists('market_readings');
  await knex.schema.dropTableIfExists('system_logs'); 
  await knex.schema.dropTableIfExists('ingestor_strategies');
  
  // Remover colunas adicionadas
  const hasStrategyColumn = await knex.schema.hasColumn('signals', 'strategy');
  if (hasStrategyColumn) {
    await knex.schema.alterTable('signals', function(table) {
      table.dropColumn('strategy');
      table.dropColumn('accuracy');
    });
  }

  const hasProfitLossColumn = await knex.schema.hasColumn('orders', 'profit_loss');
  if (hasProfitLossColumn) {
    await knex.schema.alterTable('orders', function(table) {
      table.dropColumn('profit_loss');
      table.dropColumn('profit_loss_percentage');
    });
  }
};
