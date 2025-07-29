-- 🗄️ ESQUEMA COMPLETO DO BANCO DE DADOS COINBITCLUB
-- Versão final com todas as funcionalidades implementadas

-- ===== EXTENSÕES =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== 1. TABELA DE USUÁRIOS (ATUALIZADA) =====
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'affiliate')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    
    -- Informações de assinatura
    subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'premium', 'vip')),
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
    subscription_updated_at TIMESTAMP,
    
    -- Saldos
    prepaid_balance DECIMAL(10,2) DEFAULT 0.00,
    
    -- Informações pessoais
    full_name VARCHAR(255),
    phone VARCHAR(20),
    country VARCHAR(10) DEFAULT 'BR',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    
    -- Verificações
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    
    -- Controle de sessão
    session_token VARCHAR(255),
    session_expires_at TIMESTAMP
);

-- ===== 2. CHAVES API DOS USUÁRIOS =====
CREATE TABLE IF NOT EXISTS user_api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exchange_name VARCHAR(50) NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    api_secret_encrypted TEXT NOT NULL,
    testnet BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    permissions JSONB DEFAULT '[]',
    last_validated TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, exchange_name)
);

-- ===== 3. PARAMETRIZAÇÕES DE TRADING =====
CREATE TABLE IF NOT EXISTS user_trading_params (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    parameters JSONB NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== 4. OPERAÇÕES DE TRADING =====
CREATE TABLE IF NOT EXISTS trading_operations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Dados da operação
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL', 'LONG', 'SHORT')),
    entry_price DECIMAL(20,8) NOT NULL,
    exit_price DECIMAL(20,8),
    quantity DECIMAL(20,8) NOT NULL,
    leverage DECIMAL(5,2) DEFAULT 1.0,
    
    -- Stop Loss e Take Profit
    take_profit DECIMAL(20,8),
    stop_loss DECIMAL(20,8),
    
    -- Resultado
    profit_loss DECIMAL(15,2),
    profit_loss_percentage DECIMAL(8,4),
    
    -- Controle
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled', 'pending')),
    exchange_name VARCHAR(50) NOT NULL,
    order_id VARCHAR(100),
    
    -- Fechamento
    close_reason VARCHAR(50),
    auto_closed BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP,
    
    -- Metadados
    metadata JSONB DEFAULT '{}'
);

-- ===== 5. SALDOS DOS USUÁRIOS =====
CREATE TABLE IF NOT EXISTS user_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset VARCHAR(20) NOT NULL,
    free_balance DECIMAL(20,8) DEFAULT 0,
    locked_balance DECIMAL(20,8) DEFAULT 0,
    
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, asset)
);

-- ===== 6. TRANSAÇÕES FINANCEIRAS =====
CREATE TABLE IF NOT EXISTS financial_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'deposit', 'withdrawal', 'trading_profit', 'trading_loss', 
        'trading_investment', 'subscription_upgrade', 'subscription_downgrade',
        'affiliate_commission', 'prepaid_debit', 'credit_usage'
    )),
    
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    
    -- Referências
    transaction_id VARCHAR(100),
    operation_id INTEGER REFERENCES trading_operations(id),
    
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== 7. SISTEMA DE AFILIADOS =====
CREATE TABLE IF NOT EXISTS affiliates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    commission_rate DECIMAL(5,4) DEFAULT 0.015, -- 1.5%
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Estatísticas
    total_commissions DECIMAL(15,2) DEFAULT 0,
    pending_commissions DECIMAL(15,2) DEFAULT 0,
    confirmed_commissions DECIMAL(15,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_commission_at TIMESTAMP
);

-- ===== 8. VINCULAÇÕES DE USUÁRIOS E AFILIADOS =====
CREATE TABLE IF NOT EXISTS user_affiliations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    affiliate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    commission_eligible BOOLEAN DEFAULT true,
    reference_code VARCHAR(50),
    
    linked_at TIMESTAMP DEFAULT NOW()
);

-- ===== 9. SOLICITAÇÕES DE VINCULAÇÃO (48H) =====
CREATE TABLE IF NOT EXISTS affiliate_link_requests (
    id SERIAL PRIMARY KEY,
    affiliate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    reference_code VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    
    requested_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP,
    processed_by INTEGER REFERENCES users(id),
    rejection_reason TEXT
);

-- ===== 10. COMISSÕES DE AFILIADOS =====
CREATE TABLE IF NOT EXISTS affiliate_commissions (
    id SERIAL PRIMARY KEY,
    affiliate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    commission_amount DECIMAL(15,2) NOT NULL,
    commission_rate DECIMAL(5,4) NOT NULL,
    source_operation_profit DECIMAL(15,2) NOT NULL,
    source_operation_id INTEGER REFERENCES trading_operations(id),
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
    
    -- Compensação
    compensation_status VARCHAR(20) CHECK (compensation_status IN ('available', 'reserved', 'completed')),
    compensation_id INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP,
    paid_at TIMESTAMP
);

-- ===== 11. COMPENSAÇÕES DE COMISSÕES =====
CREATE TABLE IF NOT EXISTS commission_compensations (
    id SERIAL PRIMARY KEY,
    affiliate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    requested_amount DECIMAL(15,2) NOT NULL,
    compensation_type VARCHAR(20) NOT NULL CHECK (compensation_type IN ('credit', 'cash', 'discount')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    
    reason TEXT,
    
    requested_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    completed_at TIMESTAMP
);

-- ===== 12. SISTEMA DE CRÉDITOS =====
CREATE TABLE IF NOT EXISTS user_credits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    credit_amount DECIMAL(15,2) NOT NULL,
    credit_type VARCHAR(50) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id INTEGER,
    
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    used_at TIMESTAMP,
    used_description TEXT
);

-- ===== 13. LOG DE USO DE CRÉDITOS =====
CREATE TABLE IF NOT EXISTS credit_usage_log (
    id SERIAL PRIMARY KEY,
    credit_id INTEGER NOT NULL REFERENCES user_credits(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    amount_used DECIMAL(15,2) NOT NULL,
    description TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== 14. NOTIFICAÇÕES DO SISTEMA =====
CREATE TABLE IF NOT EXISTS user_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    
    status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
    
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

-- ===== 15. NOTIFICAÇÕES ADMINISTRATIVAS =====
CREATE TABLE IF NOT EXISTS admin_notifications (
    id SERIAL PRIMARY KEY,
    
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    created_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP,
    acknowledged_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP
);

-- ===== 16. LOGS FINANCEIROS =====
CREATE TABLE IF NOT EXISTS financial_logs (
    id SERIAL PRIMARY KEY,
    
    timestamp TIMESTAMP DEFAULT NOW(),
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== 17. CÓDIGOS DE VERIFICAÇÃO SMS =====
CREATE TABLE IF NOT EXISTS sms_verification_codes (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    
    INDEX(phone, type, expires_at)
);

-- ===== ÍNDICES PARA PERFORMANCE =====

-- Índices para operações de trading
CREATE INDEX IF NOT EXISTS idx_trading_operations_user_status ON trading_operations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trading_operations_created_at ON trading_operations(created_at);
CREATE INDEX IF NOT EXISTS idx_trading_operations_symbol ON trading_operations(symbol);

-- Índices para transações financeiras
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_type ON financial_transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_created_at ON financial_transactions(created_at);

-- Índices para comissões de afiliados
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_status ON affiliate_commissions(affiliate_id, status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_user ON affiliate_commissions(user_id);

-- Índices para chaves API
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_status ON user_api_keys(user_id, status);

-- Índices para saldos
CREATE INDEX IF NOT EXISTS idx_user_balances_user_asset ON user_balances(user_id, asset);

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_status ON user_notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON admin_notifications(status, priority);

-- ===== TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA =====

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas necessárias
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_api_keys_updated_at BEFORE UPDATE ON user_api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_trading_params_updated_at BEFORE UPDATE ON user_trading_params FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== DADOS INICIAIS =====

-- Usuário administrador
INSERT INTO users (username, email, password_hash, role, status, subscription_plan) 
VALUES ('admin', 'admin@coinbitclub.com', '$2b$10$hashedpassword', 'admin', 'active', 'vip')
ON CONFLICT (email) DO NOTHING;

-- Usuário de teste Mauro com chaves reais Bybit
INSERT INTO users (username, email, password_hash, role, status, subscription_plan, country) 
VALUES ('mauro', 'mauro@coinbitclub.com', '$2b$10$hashedpassword', 'user', 'active', 'premium', 'BR')
ON CONFLICT (email) DO NOTHING;

-- Configurar chaves do Mauro (serão atualizadas com chaves reais)
INSERT INTO user_api_keys (user_id, exchange_name, api_key_encrypted, api_secret_encrypted, testnet, status)
SELECT u.id, 'bybit', 'ENCRYPTED_REAL_TESTNET_KEY', 'ENCRYPTED_REAL_TESTNET_SECRET', true, 'active'
FROM users u WHERE u.username = 'mauro'
ON CONFLICT (user_id, exchange_name) DO UPDATE SET
    api_key_encrypted = EXCLUDED.api_key_encrypted,
    api_secret_encrypted = EXCLUDED.api_secret_encrypted,
    updated_at = NOW();

-- Saldos iniciais para Mauro
INSERT INTO user_balances (user_id, asset, free_balance)
SELECT u.id, 'USDT', 1000.00
FROM users u WHERE u.username = 'mauro'
ON CONFLICT (user_id, asset) DO UPDATE SET
    free_balance = EXCLUDED.free_balance,
    updated_at = NOW();

-- ===== VIEWS ÚTEIS =====

-- View para dashboard do usuário
CREATE OR REPLACE VIEW user_dashboard_data AS
SELECT 
    u.id, u.username, u.email, u.subscription_plan,
    COUNT(DISTINCT uak.id) as active_api_keys,
    COUNT(DISTINCT to_open.id) as open_operations,
    COUNT(DISTINCT to_all.id) as total_operations,
    COALESCE(SUM(CASE WHEN to_all.profit_loss > 0 THEN to_all.profit_loss ELSE 0 END), 0) as total_profits,
    COALESCE(SUM(CASE WHEN to_all.profit_loss < 0 THEN to_all.profit_loss ELSE 0 END), 0) as total_losses,
    COALESCE(SUM(ub.free_balance), 0) as total_balance
FROM users u
LEFT JOIN user_api_keys uak ON u.id = uak.user_id AND uak.status = 'active'
LEFT JOIN trading_operations to_open ON u.id = to_open.user_id AND to_open.status = 'open'
LEFT JOIN trading_operations to_all ON u.id = to_all.user_id
LEFT JOIN user_balances ub ON u.id = ub.user_id
WHERE u.role = 'user'
GROUP BY u.id, u.username, u.email, u.subscription_plan;

-- View para dashboard do afiliado
CREATE OR REPLACE VIEW affiliate_dashboard_data AS
SELECT 
    a.user_id as affiliate_id,
    u.username, u.email,
    a.commission_rate,
    a.total_commissions,
    a.pending_commissions,
    a.confirmed_commissions,
    COUNT(DISTINCT ua.user_id) as linked_users,
    COUNT(DISTINCT ac.id) as total_commission_records
FROM affiliates a
JOIN users u ON a.user_id = u.id
LEFT JOIN user_affiliations ua ON a.user_id = ua.affiliate_id AND ua.status = 'active'
LEFT JOIN affiliate_commissions ac ON a.user_id = ac.affiliate_id
GROUP BY a.user_id, u.username, u.email, a.commission_rate, a.total_commissions, a.pending_commissions, a.confirmed_commissions;

-- ===== COMENTÁRIOS FINAIS =====
COMMENT ON TABLE users IS 'Tabela principal de usuários com assinaturas e saldos';
COMMENT ON TABLE trading_operations IS 'Operações de trading com controle de intervalo de 2h';
COMMENT ON TABLE affiliate_link_requests IS 'Solicitações de vinculação de afiliados com prazo de 48h';
COMMENT ON TABLE commission_compensations IS 'Sistema de compensação de comissões por créditos';
COMMENT ON TABLE user_credits IS 'Sistema de créditos separado da receita';

-- Banco de dados configurado com sucesso! 🎉
