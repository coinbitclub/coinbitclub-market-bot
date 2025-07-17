export async function up(knex) {
  await knex.schema.createTable('signals', table => {
    table.increments('id').primary();
    table.integer('raw_id');
    table.uuid('user_id');
    table.string('symbol');
    table.string('timeframe');
    table.jsonb('indicators');
    table.timestamp('filtered_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTable('signals');
}
