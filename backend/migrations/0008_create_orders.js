export async function up(knex) {
  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('exchange').notNullable();
    table.string('symbol').notNullable();
    table.string('side').notNullable(); // BUY/SELL
    table.decimal('quantity', 18, 8).notNullable();
    table.decimal('price', 18, 8);
    table.string('type').notNullable(); // MARKET/LIMIT
    table.string('status').defaultTo('PENDING');
    table.string('exchange_order_id');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('orders');
}
