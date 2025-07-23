-- MIGRATION: 0001_create_users.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0002_create_plans.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0002_create_raw_webhook.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0003_create_cointars.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0003_create_subscriptions.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0004_create_signals.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0005_create_user_financial.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0006_create_affiliates.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0007_create_credentials.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0008_create_orders.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0009_create_plans.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0010_create_subscriptions.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0011_create_ai_decisions.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0012_create_audit_logs.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0013_create_notifications.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0014_add_affiliate_foreign_keys.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0015_enhance_tables.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0016_enhanced_user_features.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0017_user_settings_tables.js
-- (Lógica JS original omitida para migração manual)

-- MIGRATION: 0018_create_ai_reports.js
-- (Lógica JS original omitida para migração manual)


-- CRIAÇÃO DO USUÁRIO INICIAL

INSERT INTO users (email, password_hash, name, created_at)
SELECT 'erica.andrade.santos@hotmail.com', '13d547766fc3d68c34ae98d0658e2b07f4413087897b01503e2d11e62e1a6842', 'ERICA ANDRADE', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'erica.andrade.santos@hotmail.com');

