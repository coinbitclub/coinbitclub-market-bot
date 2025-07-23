/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('subscriptions', table => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('plan_id').notNullable().references('id').inTable('plans').onDelete('CASCADE');
    table.string('stripe_subscription_id').unique();
    table.string('stripe_customer_id');
    table.enum('status', ['active', 'inactive', 'cancelled', 'past_due']).defaultTo('active');
    table.enum('billing_cycle', ['monthly', 'yearly']).defaultTo('monthly');
    table.timestamp('current_period_start');
    table.timestamp('current_period_end');
    table.timestamp('trial_ends_at');
    table.timestamp('cancelled_at');
    table.timestamps(true, true);
    
    table.index(['user_id']);
    table.index(['plan_id']);
    table.index(['status']);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('subscriptions');
}
