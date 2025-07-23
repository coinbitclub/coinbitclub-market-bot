/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('plans', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('stripe_product_id').notNullable().unique();
    table.string('stripe_price_id_monthly');
    table.string('stripe_price_id_yearly');
    table.decimal('price_monthly', 10, 2);
    table.decimal('price_yearly', 10, 2);
    table.json('features');
    table.integer('max_concurrent_operations').defaultTo(2);
    table.boolean('active').defaultTo(true);
    table.timestamps(true, true);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('plans');
}
