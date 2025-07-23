export async function up(knex) {
  // Esta tabela pode já existir em outra migração, verificar se existe
  const exists = await knex.schema.hasTable('plans');
  if (!exists) {
    await knex.schema.createTable('plans', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('description');
      table.decimal('price', 10, 2).notNullable();
      table.integer('duration_days').notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('plans');
}
