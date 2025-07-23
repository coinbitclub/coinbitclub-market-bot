export function up(knex) {
  return knex.schema.createTable('financial_transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.string('type').notNullable(); // deposit, withdrawal, commission, refund
    table.decimal('amount', 15, 2).notNullable();
    table.string('currency').defaultTo('USD');
    table.string('status').defaultTo('pending'); // pending, processing, completed, failed, cancelled
    table.string('method').nullable(); // pix, bank_transfer, crypto, etc
    table.text('description').nullable();
    table.jsonb('metadata'); // Additional transaction details
    table.string('external_reference').nullable(); // Reference from payment provider
    table.timestamp('processed_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('user_id').references('id').inTable('users');
    table.index(['user_id', 'created_at']);
    table.index(['type', 'status']);
    table.index(['status', 'created_at']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('financial_transactions');
}
