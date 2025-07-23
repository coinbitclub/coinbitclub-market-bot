export async function up(knex) {
  await knex.schema.createTable('user_financial', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.decimal('balance', 18, 8).defaultTo(0);
    table.decimal('locked', 18, 8).defaultTo(0);
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('user_financial');
}
