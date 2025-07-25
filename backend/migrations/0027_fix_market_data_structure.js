/**
 * Fix Market Data Structure Migration
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Drop existing cointars table and recreate with proper structure
  await knex.schema.dropTableIfExists('cointars');
  
  // Create market_data table for storing market metrics
  await knex.schema.createTable('market_data', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.decimal('market_cap', 20, 2).nullable();
    table.decimal('volume_24h', 20, 2).nullable();
    table.decimal('btc_dominance', 8, 4).nullable();
    table.decimal('market_cap_change', 8, 4).nullable(); // percentage
    table.decimal('volume_change', 8, 4).nullable(); // percentage
    table.decimal('btc_dominance_change', 8, 4).nullable(); // percentage
    table.timestamp('data_timestamp').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['data_timestamp']);
    table.index(['created_at']);
  });

  // Create fear_greed_index table
  await knex.schema.createTable('fear_greed_index', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.integer('value').notNullable(); // 0-100
    table.string('classification').notNullable(); // 'Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed'
    table.timestamp('data_timestamp').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['data_timestamp']);
    table.index(['value']);
  });

  // Create btc_dominance_history table for detailed tracking
  await knex.schema.createTable('btc_dominance_history', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.decimal('dominance_percentage', 8, 4).notNullable();
    table.timestamp('data_timestamp').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['data_timestamp']);
  });

  // Update raw_webhook table structure to match what ingestor expects
  await knex.schema.table('raw_webhook', table => {
    table.string('type').nullable();
    table.renameColumn('payload', 'raw_data');
  });

  // Create cointars table for trading signals (TradingView webhooks)
  await knex.schema.createTable('cointars', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.integer('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('symbol').notNullable(); // e.g., BTCUSDT
    table.string('exchange').nullable(); // bybit, binance, etc.
    table.enum('signal_type', ['BUY', 'SELL', 'CLOSE']).notNullable();
    table.decimal('price', 18, 8).nullable();
    table.decimal('quantity', 18, 8).nullable();
    table.text('strategy_name').nullable();
    table.jsonb('indicators').nullable(); // RSI, EMA, etc.
    table.jsonb('metadata').nullable(); // Additional webhook data
    table.enum('status', ['pending', 'processing', 'executed', 'failed', 'ignored']).defaultTo('pending');
    table.text('execution_notes').nullable();
    table.timestamp('signal_timestamp').notNullable();
    table.timestamp('processed_at').nullable();
    table.timestamps(true, true);
    
    table.index(['symbol', 'signal_timestamp']);
    table.index(['status', 'created_at']);
    table.index(['user_id', 'created_at']);
    table.index(['exchange', 'symbol']);
  });

  // Create system_metrics table for performance monitoring
  await knex.schema.createTable('system_metrics', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('metric_name').notNullable();
    table.decimal('metric_value', 18, 8).notNullable();
    table.string('metric_unit').nullable(); // %, ms, count, etc.
    table.jsonb('metadata').nullable();
    table.timestamp('recorded_at').notNullable();
    table.timestamps(true, true);
    
    table.index(['metric_name', 'recorded_at']);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('system_metrics');
  await knex.schema.dropTableIfExists('cointars');
  
  // Revert raw_webhook changes
  await knex.schema.table('raw_webhook', table => {
    table.dropColumn('type');
    table.renameColumn('raw_data', 'payload');
  });
  
  await knex.schema.dropTableIfExists('btc_dominance_history');
  await knex.schema.dropTableIfExists('fear_greed_index');
  await knex.schema.dropTableIfExists('market_data');
  
  // Recreate original cointars table
  await knex.schema.createTable('cointars', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('symbol').notNullable();
    table.decimal('price', 18, 8);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}
