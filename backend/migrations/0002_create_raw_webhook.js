export async function up(knex) {
  await knex.schema.createTable('raw_webhook', (table) => {
    table.increments('id').primary();
    table.string('source').notNullable();
    table.jsonb('payload').notNullable();
    table.timestamp('received_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('raw_webhook');
}
