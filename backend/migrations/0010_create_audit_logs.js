export function up(knex) {
  return knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').nullable(); // User who performed the action
    table.string('action').notNullable(); // login, logout, user_created, user_updated, etc
    table.string('resource_type').nullable(); // user, plan, subscription, etc
    table.string('resource_id').nullable(); // ID of the affected resource
    table.jsonb('details'); // Additional action details
    table.string('ip_address').nullable();
    table.string('user_agent').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('user_id').references('id').inTable('users');
    table.index(['user_id', 'created_at']);
    table.index(['action', 'created_at']);
    table.index(['resource_type', 'resource_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('audit_logs');
}
