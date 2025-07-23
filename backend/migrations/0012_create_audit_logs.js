export async function up(knex) {
  await knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned();
    table.string('action').notNullable();
    table.string('table_name');
    table.integer('record_id');
    table.jsonb('old_values');
    table.jsonb('new_values');
    table.string('ip_address');
    table.string('user_agent');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
}
