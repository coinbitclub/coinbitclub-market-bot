export async function up(knex) {
  await knex.schema.createTable('user_financial', table => {
    table.increments('id').primary();
    table.uuid('user_id');
    table.float('profit_loss');
    table.timestamp('timestamp').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTable('user_financial');
}
