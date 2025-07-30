CREATE TABLE IF NOT EXISTS raw_webhook (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'received',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO system_config (config_key, config_value) VALUES
('migration_date', NOW()::text),
('version', '3.0.0-migrated')
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;
