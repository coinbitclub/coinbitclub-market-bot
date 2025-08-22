-- ========================================
-- MARKETBOT DATABASE SCHEMA - FASE 2
-- Sistema de Usuários e Autenticação
-- ========================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- 1. CRIAÇÃO DE TIPOS ENUM (COM PROTEÇÃO)
-- ========================================

-- Enum para tipo de usuário
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
        CREATE TYPE user_type AS ENUM ('ADMIN', 'GESTOR', 'OPERADOR', 'AFFILIATE_VIP', 'AFFILIATE');
    END IF;
END
$$;

-- Enum para status de usuário
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');
    END IF;
END
$$;

-- Enum para tipo de plano
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
        CREATE TYPE plan_type AS ENUM ('MONTHLY', 'PREPAID', 'NONE');
    END IF;
END
$$;

-- ========================================
-- 2. TABELA DE USUÁRIOS
-- ========================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    country_code VARCHAR(3) DEFAULT 'BR', -- BR, US, etc
    user_type user_type DEFAULT 'OPERADOR',
    status user_status DEFAULT 'PENDING_VERIFICATION',
    plan_type plan_type DEFAULT 'NONE',
    
    -- Saldos financeiros
    balance_real_brl DECIMAL(15,2) DEFAULT 0.00,
    balance_real_usd DECIMAL(15,2) DEFAULT 0.00,
    balance_admin_brl DECIMAL(15,2) DEFAULT 0.00,
    balance_admin_usd DECIMAL(15,2) DEFAULT 0.00,
    balance_commission_brl DECIMAL(15,2) DEFAULT 0.00,
    balance_commission_usd DECIMAL(15,2) DEFAULT 0.00,
    
    -- Configurações de trading
    max_concurrent_positions INTEGER DEFAULT 2,
    daily_loss_limit_usd DECIMAL(10,2) DEFAULT 1000.00,
    max_position_size_percent INTEGER DEFAULT 30, -- 30% do saldo
    default_leverage INTEGER DEFAULT 5,
    default_stop_loss_multiplier DECIMAL(3,1) DEFAULT 2.0, -- 2x leverage
    default_take_profit_multiplier DECIMAL(3,1) DEFAULT 3.0, -- 3x leverage
    
    -- Verificações
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(32),
    
    -- Dados bancários para saque
    bank_name VARCHAR(100),
    bank_agency VARCHAR(10),
    bank_account VARCHAR(20),
    bank_account_type VARCHAR(20), -- corrente, poupanca
    bank_cpf VARCHAR(14),
    pix_key VARCHAR(100),
    pix_type VARCHAR(20), -- cpf, email, phone, random
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Índices
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_password_length CHECK (length(password_hash) >= 60), -- bcrypt hash
    CONSTRAINT chk_leverage_range CHECK (default_leverage BETWEEN 1 AND 10),
    CONSTRAINT chk_position_size CHECK (max_position_size_percent BETWEEN 10 AND 50)
);

-- ========================================
-- 2. TABELA DE AFILIADOS
-- ========================================
CREATE TABLE IF NOT EXISTS affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    affiliate_code VARCHAR(12) UNIQUE NOT NULL, -- CBC + 6 chars
    referral_code_used VARCHAR(12), -- Código usado no cadastro
    referred_by_user_id UUID REFERENCES users(id),
    commission_rate DECIMAL(4,2) NOT NULL, -- 1.5% or 5%
    status VARCHAR(20) DEFAULT 'ACTIVE',
    total_referrals INTEGER DEFAULT 0,
    total_earnings_brl DECIMAL(15,2) DEFAULT 0.00,
    total_earnings_usd DECIMAL(15,2) DEFAULT 0.00,
    pending_payments_brl DECIMAL(15,2) DEFAULT 0.00,
    pending_payments_usd DECIMAL(15,2) DEFAULT 0.00,
    total_paid_brl DECIMAL(15,2) DEFAULT 0.00,
    total_paid_usd DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_commission_rate CHECK (commission_rate IN (1.5, 5.0)),
    CONSTRAINT chk_affiliate_code_format CHECK (affiliate_code ~ '^CBC[A-Z0-9]{6}$')
);

-- ========================================
-- 3. TABELA DE SESSÕES JWT
-- ========================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    access_token_jti VARCHAR(100) NOT NULL, -- JWT ID for access token
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT chk_expires_future CHECK (expires_at > created_at)
);

-- ========================================
-- 4. TABELA DE TOKENS DE VERIFICAÇÃO
-- ========================================
CREATE TYPE token_type AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'PHONE_VERIFICATION');

CREATE TABLE IF NOT EXISTS verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(6) NOT NULL, -- 6 digit code
    token_type token_type NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    CONSTRAINT chk_token_format CHECK (token ~ '^[0-9]{6}$'),
    CONSTRAINT chk_max_attempts CHECK (max_attempts > 0)
);

-- ========================================
-- 5. TABELA DE LOGS DE AUDITORIA
-- ========================================
CREATE TYPE audit_action AS ENUM (
    'USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTER', 'USER_UPDATE',
    'PASSWORD_CHANGE', 'EMAIL_VERIFICATION', 'PHONE_VERIFICATION',
    'TWO_FACTOR_ENABLE', 'TWO_FACTOR_DISABLE', 'FAILED_LOGIN',
    'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'BALANCE_UPDATE',
    'WITHDRAWAL_REQUEST', 'WITHDRAWAL_APPROVED', 'COMMISSION_PAID'
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action audit_action NOT NULL,
    description TEXT,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Índice para performance
    CONSTRAINT chk_metadata_valid CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object')
);

-- ========================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ========================================

-- Usuários
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_plan_type ON users(plan_type);
CREATE INDEX idx_users_last_login ON users(last_login_at);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Afiliados
CREATE INDEX idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX idx_affiliates_referral_code ON affiliates(referral_code_used);
CREATE INDEX idx_affiliates_referred_by ON affiliates(referred_by_user_id);
CREATE INDEX idx_affiliates_status ON affiliates(status);

-- Sessões
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_sessions_revoked ON user_sessions(is_revoked);

-- Tokens de verificação
CREATE INDEX idx_verification_user_id ON verification_tokens(user_id);
CREATE INDEX idx_verification_token ON verification_tokens(token);
CREATE INDEX idx_verification_type ON verification_tokens(token_type);
CREATE INDEX idx_verification_expires ON verification_tokens(expires_at);

-- Auditoria
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_ip ON audit_logs(ip_address);

-- ========================================
-- 7. TRIGGERS PARA UPDATED_AT
-- ========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 8. FUNÇÕES AUXILIARES
-- ========================================

-- Função para gerar código de afiliado único
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS VARCHAR(12) AS $$
DECLARE
    code VARCHAR(12);
    exists_code BOOLEAN;
BEGIN
    LOOP
        -- Gera código CBC + 6 caracteres aleatórios
        code := 'CBC' || upper(substring(md5(random()::text) from 1 for 6));
        
        -- Verifica se já existe
        SELECT EXISTS(SELECT 1 FROM affiliates WHERE affiliate_code = code) INTO exists_code;
        
        -- Se não existe, retorna o código
        IF NOT exists_code THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Remove sessões expiradas ou revogadas há mais de 7 dias
    DELETE FROM user_sessions 
    WHERE (expires_at < CURRENT_TIMESTAMP OR is_revoked = TRUE)
    AND created_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar tokens de verificação expirados
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Remove tokens expirados há mais de 24 horas
    DELETE FROM verification_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 9. DADOS INICIAIS - USUÁRIO ADMIN
-- ========================================

-- Insere usuário admin padrão (senha: admin123456)
INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    user_type, 
    status,
    email_verified,
    phone_verified
) VALUES (
    'admin@marketbot.com',
    '$2b$12$LQv3c1yqBwEHFNj7XkqwEe.I4J5CkE5rV8YXO8KJ1qA2Nx4v6Z7H2', -- admin123456
    'Admin',
    'System',
    'ADMIN',
    'ACTIVE',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- ========================================
-- 10. VIEWS PARA RELATÓRIOS
-- ========================================

-- View para usuários com informações de afiliado
CREATE VIEW v_users_with_affiliate AS
SELECT 
    u.*,
    a.affiliate_code,
    a.commission_rate,
    a.total_referrals,
    a.total_earnings_brl + a.total_earnings_usd AS total_earnings,
    ref.first_name || ' ' || ref.last_name AS referred_by_name
FROM users u
LEFT JOIN affiliates a ON u.id = a.user_id
LEFT JOIN users ref ON a.referred_by_user_id = ref.id;

-- View para estatísticas de usuários
CREATE VIEW v_user_statistics AS
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_users,
    COUNT(*) FILTER (WHERE user_type = 'AFFILIATE') as total_affiliates,
    COUNT(*) FILTER (WHERE user_type = 'AFFILIATE_VIP') as vip_affiliates,
    COUNT(*) FILTER (WHERE plan_type = 'MONTHLY') as monthly_subscribers,
    COUNT(*) FILTER (WHERE plan_type = 'PREPAID') as prepaid_users,
    SUM(balance_real_brl + balance_admin_brl) as total_balance_brl,
    SUM(balance_real_usd + balance_admin_usd) as total_balance_usd,
    AVG(login_attempts) as avg_login_attempts
FROM users;

-- ========================================
-- SCHEMA CRIADO COM SUCESSO
-- ========================================

-- Verifica se todas as tabelas foram criadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'affiliates', 'user_sessions', 'verification_tokens', 'audit_logs')
ORDER BY tablename;
