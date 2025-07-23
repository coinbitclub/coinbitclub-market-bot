export async function up(knex) {
  await knex.schema.createTable('ai_reports', (table) => {
    table.increments('id').primary();
    table.string('report_type').notNullable();
    table.string('period').notNullable(); // daily, weekly, monthly
    table.jsonb('data').notNullable();
    table.jsonb('insights');
    table.timestamp('generated_at').defaultTo(knex.fn.now());
    table.timestamp('period_start');
    table.timestamp('period_end');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('ai_reports');
}
