export function up(knex) {
  return knex.schema.createTable('system_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('level').notNullable(); // debug, info, warn, error
    table.string('service').notNullable(); // api-gateway, decision-engine, etc
    table.text('message').notNullable();
    table.jsonb('details'); // Additional details
    table.string('user_id').nullable();
    table.string('request_id').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['level', 'created_at']);
    table.index(['service', 'created_at']);
    table.index(['user_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('system_logs');
}
