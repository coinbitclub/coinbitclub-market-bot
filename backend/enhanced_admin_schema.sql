-- Enhanced database schema for admin functionality

-- User profiles table for additional user data
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cpf VARCHAR(14),
    phone VARCHAR(20),
    pix_key VARCHAR(255),
    bank_name VARCHAR(100),
    bank_agency VARCHAR(20),
    bank_account VARCHAR(30),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'Brasil',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- User balances table for financial tracking
CREATE TABLE IF NOT EXISTS user_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance_usd DECIMAL(15,8) DEFAULT 0,
    balance_brl DECIMAL(15,2) DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_losses DECIMAL(15,2) DEFAULT 0,
    total_deposits DECIMAL(15,2) DEFAULT 0,
    total_withdrawals DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Enhanced affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    referral_code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) DEFAULT 'common' CHECK (type IN ('common', 'vip')),
    commission_rate DECIMAL(5,2) DEFAULT 1.5,
    is_active BOOLEAN DEFAULT true,
    total_referrals INTEGER DEFAULT 0,
    total_commissions DECIMAL(15,2) DEFAULT 0,
    bank_name VARCHAR(100),
    bank_agency VARCHAR(20),
    bank_account VARCHAR(30),
    pix_key VARCHAR(255),
    cpf VARCHAR(14),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Commissions table for affiliate management
CREATE TABLE IF NOT EXISTS commissions (
    id SERIAL PRIMARY KEY,
    affiliate_id INTEGER NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES plans(id),
    type VARCHAR(30) NOT NULL CHECK (type IN ('SUBSCRIPTION', 'RENEWAL', 'UPGRADE', 'TRADING', 'DEPOSIT')),
    base_amount DECIMAL(15,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PAID', 'REJECTED')),
    payment_method VARCHAR(30),
    payment_details TEXT,
    notes TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System logs table for monitoring
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(10) NOT NULL CHECK (level IN ('ERROR', 'WARN', 'INFO', 'DEBUG')),
    service VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details TEXT,
    user_id INTEGER REFERENCES users(id),
    ip VARCHAR(45),
    user_agent TEXT,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INTEGER,
    response_time INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System alerts table for real-time monitoring
CREATE TABLE IF NOT EXISTS system_alerts (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('ERROR', 'WARNING', 'INFO', 'SUCCESS', 'CRITICAL')),
    category VARCHAR(30) NOT NULL CHECK (category IN ('SYSTEM', 'TRADING', 'USER', 'FINANCIAL', 'SECURITY', 'API')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    details TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    source VARCHAR(100) NOT NULL,
    acknowledged BOOLEAN DEFAULT false,
    resolved BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP,
    acknowledged_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id),
    resolution_notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System configuration table
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced payments table (if not exists)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES plans(id),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BRL',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(30),
    gateway VARCHAR(30),
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table for trading history (if not exists)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL', 'LONG', 'SHORT')),
    type VARCHAR(20) NOT NULL CHECK (type IN ('MARKET', 'LIMIT', 'STOP')),
    quantity DECIMAL(15,8) NOT NULL,
    price DECIMAL(15,8),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'FILLED', 'CANCELLED', 'REJECTED')),
    exchange VARCHAR(20),
    exchange_order_id VARCHAR(255),
    filled_quantity DECIMAL(15,8) DEFAULT 0,
    filled_price DECIMAL(15,8),
    commission DECIMAL(15,8) DEFAULT 0,
    pnl DECIMAL(15,8) DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reimbursements table
CREATE TABLE IF NOT EXISTS reimbursements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_id INTEGER REFERENCES payments(id),
    amount DECIMAL(15,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PROCESSED', 'REJECTED')),
    processed_by INTEGER REFERENCES users(id),
    processed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON user_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON affiliates(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_type ON affiliates(type);
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_id ON commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_service ON system_logs(service);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_category ON system_alerts(category);
CREATE INDEX IF NOT EXISTS idx_system_alerts_acknowledged ON system_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Insert default system configuration
INSERT INTO system_config (key, value, type, description, category) VALUES
('trading_enabled', 'true', 'boolean', 'Enable/disable trading operations', 'trading'),
('maintenance_mode', 'false', 'boolean', 'System maintenance mode', 'system'),
('max_concurrent_trades', '10', 'number', 'Maximum concurrent trades allowed', 'trading'),
('emergency_stop_enabled', 'false', 'boolean', 'Emergency stop mode', 'system'),
('binance_enabled', 'true', 'boolean', 'Enable Binance API', 'exchanges'),
('bybit_enabled', 'true', 'boolean', 'Enable Bybit API', 'exchanges'),
('notifications_enabled', 'true', 'boolean', 'Enable system notifications', 'notifications'),
('backup_enabled', 'true', 'boolean', 'Enable automatic backups', 'system'),
('log_level', 'INFO', 'string', 'System log level', 'logging'),
('commission_rate_common', '1.5', 'number', 'Commission rate for common affiliates', 'affiliates'),
('commission_rate_vip', '5.0', 'number', 'Commission rate for VIP affiliates', 'affiliates')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- Insert sample data for testing (only if tables are empty)
INSERT INTO user_profiles (user_id, cpf, phone, pix_key, bank_name, bank_agency, bank_account)
SELECT u.id, '123.456.789-00', '+5511999999999', 'usuario@email.com', 'Banco do Brasil', '1234-5', '98765-4'
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = u.id)
LIMIT 5;

INSERT INTO user_balances (user_id, balance_usd, balance_brl, total_revenue)
SELECT u.id, 1000.00, 5000.00, 2500.00
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM user_balances WHERE user_id = u.id)
LIMIT 5;

-- Insert sample affiliates
INSERT INTO affiliates (name, email, referral_code, type, commission_rate, pix_key, bank_name)
VALUES 
('João Afiliado VIP', 'joao.vip@email.com', 'JOAO_VIP', 'vip', 5.0, 'joao.vip@email.com', 'Itaú'),
('Maria Afiliada Comum', 'maria.comum@email.com', 'MARIA_COM', 'common', 1.5, 'maria.comum@email.com', 'Bradesco')
ON CONFLICT (email) DO NOTHING;

-- Insert sample system logs
INSERT INTO system_logs (level, service, message, details, created_at)
VALUES 
('INFO', 'api-gateway', 'Sistema iniciado com sucesso', 'API Gateway rodando na porta 8080', NOW() - INTERVAL '1 hour'),
('WARN', 'trading-engine', 'Alto volume de trades detectado', 'Processando mais de 100 trades por minuto', NOW() - INTERVAL '30 minutes'),
('ERROR', 'binance-api', 'Rate limit atingido', 'API retornou erro 429', NOW() - INTERVAL '15 minutes'),
('DEBUG', 'scheduler', 'Executando limpeza de cache', 'Cache Redis limpo com sucesso', NOW() - INTERVAL '5 minutes');

-- Insert sample alerts
INSERT INTO system_alerts (type, category, title, message, priority, source, metadata)
VALUES 
('WARNING', 'SYSTEM', 'Alto uso de CPU', 'CPU acima de 80% por mais de 5 minutos', 'HIGH', 'System Monitor', '{"cpu_usage": 85, "threshold": 80}'),
('ERROR', 'TRADING', 'Falha na conexão com Binance', 'Timeout na conexão WebSocket', 'CRITICAL', 'Trading Engine', '{"exchange": "binance", "error": "connection_timeout"}'),
('INFO', 'FINANCIAL', 'Meta diária atingida', 'Receita diária superou R$ 5.000', 'LOW', 'Revenue Monitor', '{"target": 5000, "current": 5247.80}');
