export async function up(knex) {
  await knex.schema.createTable('users', table => {
    table.uuid('id').primary();
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('role').defaultTo('user');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTable('users');
}
