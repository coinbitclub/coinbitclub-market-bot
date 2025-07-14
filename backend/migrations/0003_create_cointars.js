export async function up(knex) {
  await knex.schema.createTable('cointars', table => {
    table.increments('id').primary();
    table.float('fear_greed_index');
    table.float('btc_dominance');
    table.timestamp('timestamp').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTable('cointars');
}
