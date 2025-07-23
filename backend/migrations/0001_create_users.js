/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('name').notNullable();
    table.string('phone', 20);
    table.enum('role', ['user', 'admin', 'affiliate']).defaultTo('user');
    table.enum('status', ['active', 'suspended', 'inactive']).defaultTo('active');
    table.string('timezone', 50).defaultTo('UTC');
    table.string('language', 10).defaultTo('en');
    table.integer('affiliate_id').references('id').inTable('users').onDelete('SET NULL');
    table.decimal('commission_rate', 5, 2).defaultTo(0.00);
    table.boolean('email_notifications').defaultTo(true);
    table.boolean('sms_notifications').defaultTo(false);
    table.enum('risk_tolerance', ['low', 'medium', 'high']).defaultTo('medium');
    table.integer('max_concurrent_trades').defaultTo(2);
    table.timestamp('email_verified_at');
    table.timestamp('trial_ends_at');
    table.timestamp('last_login_at');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['email']);
    table.index(['role']);
    table.index(['status']);
    table.index(['affiliate_id']);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('users');
}
