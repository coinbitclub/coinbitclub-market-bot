// migrations/20250707120000_add_constraints_and_indices.js
export const shorthands = undefined;

/**
 * Aplica constraints e índices de forma segura:
 * cada chamada é envolvida em try/catch para não falhar se o objeto não existir.
 */
export function up(pgm) {
  const safe = fn => { try { fn(); } catch {} };

  // === Constraints ===
  safe(() => pgm.addConstraint(
    'operations', 'fk_operations_user',
    { foreignKeys: { columns: 'user_id', references: 'users(id)' } }
  ));
  safe(() => pgm.addConstraint(
    'operations', 'fk_operations_subscription',
    { foreignKeys: { columns: 'subscription_id', references: 'subscriptions(id)' } }
  ));
  safe(() => pgm.addConstraint(
    'commissions', 'fk_commissions_affiliate',
    { foreignKeys: { columns: 'affiliate_id', references: 'affiliates(id)' } }
  ));

  // === Índices ===
  safe(() => pgm.createIndex(
    'operations', 'idx_operations_user_id',
    { columns: ['user_id'] }
  ));
  safe(() => pgm.createIndex(
    'operations', 'idx_operations_status',
    { columns: ['status'] }
  ));
  safe(() => pgm.createIndex(
    'subscriptions', 'idx_subscriptions_user',
    { columns: ['user_id'] }
  ));
  safe(() => pgm.createIndex(
    'orders', 'idx_orders_user',
    { columns: ['user_id'] }
  ));
  safe(() => pgm.createIndex(
    'market_metrics', 'idx_metrics_time',
    { columns: ['captured_at'] }
  ));
}

export function down(pgm) {
  const safe = fn => { try { fn(); } catch {} };

  // === Remover Constraints ===
  safe(() => pgm.dropConstraint('operations', 'fk_operations_subscription'));
  safe(() => pgm.dropConstraint('operations', 'fk_operations_user'));
  safe(() => pgm.dropConstraint('commissions', 'fk_commissions_affiliate'));

  // === Remover Índices ===
  safe(() => pgm.dropIndex('operations', 'idx_operations_status'));
  safe(() => pgm.dropIndex('operations', 'idx_operations_user_id'));
  safe(() => pgm.dropIndex('subscriptions', 'idx_subscriptions_user'));
  safe(() => pgm.dropIndex('orders', 'idx_orders_user'));
  safe(() => pgm.dropIndex('market_metrics', 'idx_metrics_time'));
}
