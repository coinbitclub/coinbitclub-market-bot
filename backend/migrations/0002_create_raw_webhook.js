export async function up(knex) {
  await knex.schema.createTable('raw_webhook', table => {
    table.increments('id').primary();
    table.string('source');
    table.string('type');
    table.uuid('user_id');
    table.jsonb('raw_data');
    table.timestamp('received_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTable('raw_webhook');
}
