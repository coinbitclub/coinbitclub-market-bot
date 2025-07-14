/**
 * Migration inicial: cria todas as tabelas centrais do MarketBot
 */
exports.up = async function (knex) {
  await knex.schema.createTable('users', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('email').notNullable().unique();
    t.string('password').notNullable();
    t.enu('role', ['user','affiliate','admin']).notNullable().defaultTo('user');
    t.enu('status', ['trial_active','trial_expired','active','inactive'])
      .notNullable().defaultTo('trial_active');
    t.timestamp('trial_ends_at').nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('user_settings', t => {
    t.uuid('user_id').primary().references('users.id').onDelete('cascade');
    t.integer('sizing_override').notNullable().defaultTo(30);
    t.integer('leverage_override').notNullable().defaultTo(6);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('user_credentials', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('users.id').onDelete('cascade');
    t.string('exchange').notNullable();
    t.text('api_key').notNullable();
    t.text('api_secret').notNullable();
    t.boolean('is_testnet').notNullable().defaultTo(false);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('plans', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name').notNullable();
    t.string('price_id').notNullable();
    t.string('currency',3).notNullable();
    t.decimal('unit_amount').notNullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('subscriptions', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('users.id').onDelete('cascade');
    t.uuid('plan_id').notNullable().references('plans.id').onDelete('cascade');
    t.enu('status',['active','cancelled','expired']).notNullable().defaultTo('active');
    t.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('ends_at').nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('user_financial', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('users.id').onDelete('cascade');
    t.decimal('balance',14,2).notNullable().defaultTo(0);
    t.decimal('profit',14,2).notNullable().defaultTo(0);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('commissions', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.enu('type',['subscription','trade']).notNullable();
    t.decimal('amount',14,2).notNullable();
    t.jsonb('meta').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('affiliate_financial', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('affiliate_id').notNullable().references('users.id').onDelete('cascade');
    t.decimal('credits',14,2).notNullable().defaultTo(0);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('affiliate_commission_credits', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('affiliate_id').notNullable().references('users.id').onDelete('cascade');
    t.uuid('user_id').notNullable().references('users.id').onDelete('cascade');
    t.decimal('amount',14,2).notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('bot_logs', t => {
    t.bigIncrements('id').primary();
    t.string('level',10).notNullable();
    t.text('message').notNullable();
    t.jsonb('meta').nullable();
    t.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('event_logs', t => {
    t.bigIncrements('id').primary();
    t.string('event_type').notNullable();
    t.text('message').notNullable();
    t.jsonb('meta').nullable();
    t.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('ai_logs', t => {
    t.bigIncrements('id').primary();
    t.jsonb('request').notNullable();
    t.jsonb('response').notNullable();
    t.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('openai_logs', t => {
    t.bigIncrements('id').primary();
    t.jsonb('request').notNullable();
    t.jsonb('response').notNullable();
    t.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('notifications', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('users.id').onDelete('cascade');
    t.string('type').notNullable();
    t.text('message').notNullable();
    t.enu('status',['pending','sent','failed']).notNullable().defaultTo('pending');
    t.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('openai_logs');
  await knex.schema.dropTableIfExists('ai_logs');
  await knex.schema.dropTableIfExists('event_logs');
  await knex.schema.dropTableIfExists('bot_logs');
  await knex.schema.dropTableIfExists('affiliate_commission_credits');
  await knex.schema.dropTableIfExists('affiliate_financial');
  await knex.schema.dropTableIfExists('commissions');
  await knex.schema.dropTableIfExists('user_financial');
  await knex.schema.dropTableIfExists('subscriptions');
  await knex.schema.dropTableIfExists('plans');
  await knex.schema.dropTableIfExists('user_credentials');
  await knex.schema.dropTableIfExists('user_settings');
  await knex.schema.dropTableIfExists('users');
};
