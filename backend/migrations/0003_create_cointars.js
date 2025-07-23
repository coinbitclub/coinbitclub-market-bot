export async function up(knex) {
  await knex.schema.createTable('cointars', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('symbol').notNullable();
    table.decimal('price', 18, 8);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('cointars');
}
