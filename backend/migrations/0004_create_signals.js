export async function up(knex) {
  await knex.schema.createTable('signals', (table) => {
    table.increments('id').primary();
    table.string('type').notNullable();
    table.string('symbol').notNullable();
    table.decimal('price', 18, 8);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('signals');
}
