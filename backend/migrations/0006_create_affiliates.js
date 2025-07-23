export async function up(knex) {
  await knex.schema.createTable('affiliates', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('code').notNullable().unique();
    table.integer('parent_affiliate_id').unsigned().nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('parent_affiliate_id').references('id').inTable('affiliates').onDelete('SET NULL');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('affiliates');
}
