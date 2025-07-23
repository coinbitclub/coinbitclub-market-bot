export async function up(knex) {
  await knex.schema.createTable('ai_decisions', (table) => {
    table.increments('id').primary();
    table.string('signal_id').notNullable();
    table.string('symbol').notNullable();
    table.string('decision').notNullable(); // BUY/SELL/HOLD
    table.decimal('confidence', 5, 4); // 0.0000 to 1.0000
    table.jsonb('analysis_data');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('ai_decisions');
}
