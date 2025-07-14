export async function up(knex) {
  await knex.schema.createTable('affiliates', table => {
    table.increments('id').primary();
    table.uuid('user_id');
    table.uuid('affiliate_id');
    table.float('commission_amount');
    table.boolean('paid').defaultTo(false);
  });
}

export async function down(knex) {
  await knex.schema.dropTable('affiliates');
}
