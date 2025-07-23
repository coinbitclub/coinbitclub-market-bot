export async function up(knex) {
  // Esta tabela pode já existir em outra migração, verificar se existe
  const exists = await knex.schema.hasTable('subscriptions');
  if (!exists) {
    await knex.schema.createTable('subscriptions', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.integer('plan_id').unsigned().notNullable();
      table.string('status').defaultTo('active');
      table.timestamp('starts_at').defaultTo(knex.fn.now());
      table.timestamp('ends_at');
      table.boolean('is_trial').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('plan_id').references('id').inTable('plans').onDelete('CASCADE');
    });
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('subscriptions');
}
