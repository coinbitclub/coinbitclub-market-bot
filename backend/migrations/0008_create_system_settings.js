export function up(knex) {
  return knex.schema.createTable('system_settings', (table) => {
    table.string('key').primary();
    table.text('value').notNullable();
    table.string('type').defaultTo('string'); // string, number, boolean, json
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export function down(knex) {
  return knex.schema.dropTable('system_settings');
}
