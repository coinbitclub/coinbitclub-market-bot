export async function up(knex) {
  await knex.schema.createTable('user_settings', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.boolean('notifications_email').defaultTo(true);
    table.boolean('notifications_push').defaultTo(true);
    table.string('theme').defaultTo('dark');
    table.string('language').defaultTo('pt');
    table.string('timezone').defaultTo('America/Sao_Paulo');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.unique('user_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('user_settings');
}
