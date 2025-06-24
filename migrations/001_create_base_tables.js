export async function up(knex) {
  await knex.schema
    .createTable('signals', table => {
      table.increments('id').primary();
      table.jsonb('signal_json').notNullable();
      table.timestamp('received_at').defaultTo(knex.fn.now());
    })
    .createTable('dominance', table => {
      table.increments('id').primary();
      table.timestamp('timestamp').notNullable();
      table.decimal('btc_dom').notNullable();
      table.decimal('eth_dom').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('fear_greed', table => {
      table.increments('id').primary();
      table.integer('index_value').notNullable();
      table.string('value_classification');
      table.timestamp('timestamp').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('market', table => {
      table.increments('id').primary();
      table.string('symbol').notNullable();
      table.decimal('price').notNullable();
      table.timestamp('timestamp').notNullable();
      table.timestamp('captured_at').defaultTo(knex.fn.now());
    });
}

export async function down(knex) {
  await knex.schema
    .dropTableIfExists('market')
    .dropTableIfExists('fear_greed')
    .dropTableIfExists('dominance')
    .dropTableIfExists('signals');
}
