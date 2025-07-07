// migrations/20250707120000_add_constraints_and_indices.js
export const shorthands = undefined;

export async function up(pgm) {
  await pgm.sql(`
    DO $$
    BEGIN
      -- Operações
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operations') THEN
        ALTER TABLE operations
          ADD CONSTRAINT fk_operations_user FOREIGN KEY (user_id) REFERENCES users(id);
        ALTER TABLE operations
          ADD CONSTRAINT fk_operations_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id);
      END IF;

      -- Comissões
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commissions') THEN
        ALTER TABLE commissions
          ADD CONSTRAINT fk_commissions_affiliate FOREIGN KEY (affiliate_id) REFERENCES affiliates(id);
      END IF;

      -- Índices
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operations') THEN
        CREATE INDEX IF NOT EXISTS idx_operations_user_id ON operations(user_id);
        CREATE INDEX IF NOT EXISTS idx_operations_status  ON operations(status);
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
        CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        CREATE INDEX IF NOT EXISTS idx_orders_user        ON orders(user_id);
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'market_metrics') THEN
        CREATE INDEX IF NOT EXISTS idx_metrics_time       ON market_metrics(captured_at);
      END IF;
    END
    $$;
  `);
}

export async function down(pgm) {
  await pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                 WHERE constraint_name = 'fk_operations_subscription') THEN
        ALTER TABLE operations DROP CONSTRAINT fk_operations_subscription;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                 WHERE constraint_name = 'fk_operations_user') THEN
        ALTER TABLE operations DROP CONSTRAINT fk_operations_user;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                 WHERE constraint_name = 'fk_commissions_affiliate') THEN
        ALTER TABLE commissions DROP CONSTRAINT fk_commissions_affiliate;
      END IF;

      DROP INDEX IF EXISTS idx_operations_user_id;
      DROP INDEX IF EXISTS idx_operations_status;
      DROP INDEX IF EXISTS idx_subscriptions_user;
      DROP INDEX IF EXISTS idx_orders_user;
      DROP INDEX IF EXISTS idx_metrics_time;
    END
    $$;
  `);
}
