-- ========================================
-- MIGRATION 008: WITHDRAWAL SYSTEM
-- Sistema completo de saques e retiradas
-- ========================================

-- Tabela de solicitações de saque
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('BRL', 'USD')),
    bank_account JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    admin_notes TEXT,
    transaction_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    final_amount DECIMAL(15,2) NOT NULL CHECK (final_amount > 0),
    pix_key VARCHAR(255),
    bank_receipt_url TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_requested_at ON withdrawal_requests(requested_at);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_currency ON withdrawal_requests(currency);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_status ON withdrawal_requests(user_id, status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_withdrawal_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_withdrawal_requests_updated_at
    BEFORE UPDATE ON withdrawal_requests
    FOR EACH ROW EXECUTE FUNCTION update_withdrawal_requests_updated_at();

-- Adicionar colunas de saldo aos usuários se não existirem
DO $$ 
BEGIN
    -- Saldos reais (podem ser sacados)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'balance_brl_real') THEN
        ALTER TABLE users ADD COLUMN balance_brl_real DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'balance_usd_real') THEN
        ALTER TABLE users ADD COLUMN balance_usd_real DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Saldos administrativos/cupons (não podem ser sacados)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'balance_brl_admin') THEN
        ALTER TABLE users ADD COLUMN balance_brl_admin DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'balance_usd_admin') THEN
        ALTER TABLE users ADD COLUMN balance_usd_admin DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Saldos de comissão (podem ser sacados ou convertidos)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'balance_brl_commission') THEN
        ALTER TABLE users ADD COLUMN balance_brl_commission DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'balance_usd_commission') THEN
        ALTER TABLE users ADD COLUMN balance_usd_commission DECIMAL(15,2) DEFAULT 0;
    END IF;
END $$;

-- Validações de saldo
ALTER TABLE users ADD CONSTRAINT chk_users_balance_brl_real CHECK (balance_brl_real >= 0);
ALTER TABLE users ADD CONSTRAINT chk_users_balance_usd_real CHECK (balance_usd_real >= 0);
ALTER TABLE users ADD CONSTRAINT chk_users_balance_brl_admin CHECK (balance_brl_admin >= 0);
ALTER TABLE users ADD CONSTRAINT chk_users_balance_usd_admin CHECK (balance_usd_admin >= 0);
ALTER TABLE users ADD CONSTRAINT chk_users_balance_brl_commission CHECK (balance_brl_commission >= 0);
ALTER TABLE users ADD CONSTRAINT chk_users_balance_usd_commission CHECK (balance_usd_commission >= 0);

-- Índices para consultas de saldo
CREATE INDEX IF NOT EXISTS idx_users_balance_brl_real ON users(balance_brl_real);
CREATE INDEX IF NOT EXISTS idx_users_balance_usd_real ON users(balance_usd_real);

-- Tabela de configurações de saque (admin pode alterar)
CREATE TABLE IF NOT EXISTS withdrawal_settings (
    id SERIAL PRIMARY KEY,
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('BRL', 'USD')),
    min_amount DECIMAL(10,2) NOT NULL CHECK (min_amount > 0),
    max_daily_amount DECIMAL(15,2),
    max_monthly_amount DECIMAL(15,2),
    transaction_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_daily_requests INTEGER DEFAULT 3,
    allowed_days INTEGER[] DEFAULT ARRAY[5, 20], -- dias 5 e 20
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(currency)
);

-- Inserir configurações padrão
INSERT INTO withdrawal_settings (currency, min_amount, max_monthly_amount, transaction_fee) 
VALUES 
    ('BRL', 50.00, 50000.00, 10.00),
    ('USD', 10.00, 10000.00, 2.00)
ON CONFLICT (currency) DO NOTHING;

-- View para relatórios de saque
CREATE OR REPLACE VIEW withdrawal_reports AS
SELECT 
    wr.id,
    wr.user_id,
    u.email,
    u.full_name,
    wr.amount,
    wr.currency,
    wr.transaction_fee,
    wr.final_amount,
    wr.status,
    wr.requested_at,
    wr.processed_at,
    wr.completed_at,
    CASE 
        WHEN wr.completed_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (wr.completed_at - wr.requested_at))/3600
        ELSE NULL 
    END as processing_time_hours,
    wr.bank_account->>'account_type' as account_type,
    wr.bank_account->>'pix_key' as pix_key,
    wr.ip_address,
    DATE_TRUNC('month', wr.requested_at) as request_month
FROM withdrawal_requests wr
JOIN users u ON wr.user_id = u.id;

-- View para estatísticas de usuário
CREATE OR REPLACE VIEW user_withdrawal_stats AS
SELECT 
    user_id,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_requests,
    COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_requests,
    COALESCE(SUM(CASE WHEN status = 'COMPLETED' AND currency = 'BRL' THEN final_amount ELSE 0 END), 0) as total_withdrawn_brl,
    COALESCE(SUM(CASE WHEN status = 'COMPLETED' AND currency = 'USD' THEN final_amount ELSE 0 END), 0) as total_withdrawn_usd,
    MAX(CASE WHEN status = 'COMPLETED' THEN completed_at END) as last_withdrawal_date
FROM withdrawal_requests
GROUP BY user_id;

-- Função para validar horário de saque
CREATE OR REPLACE FUNCTION is_withdrawal_day()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXTRACT(DAY FROM NOW()) IN (5, 20);
END;
$$ LANGUAGE plpgsql;

-- Função para próxima data de saque
CREATE OR REPLACE FUNCTION next_withdrawal_date()
RETURNS DATE AS $$
DECLARE
    current_day INTEGER;
    current_date DATE;
BEGIN
    current_date := CURRENT_DATE;
    current_day := EXTRACT(DAY FROM current_date);
    
    IF current_day < 5 THEN
        RETURN DATE_TRUNC('month', current_date) + INTERVAL '4 days';
    ELSIF current_day < 20 THEN
        RETURN DATE_TRUNC('month', current_date) + INTERVAL '19 days';
    ELSE
        RETURN DATE_TRUNC('month', current_date + INTERVAL '1 month') + INTERVAL '4 days';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar regras de negócio
CREATE OR REPLACE FUNCTION validate_withdrawal_request()
RETURNS TRIGGER AS $$
DECLARE
    daily_count INTEGER;
    monthly_amount DECIMAL;
    settings RECORD;
    user_balance DECIMAL;
BEGIN
    -- Buscar configurações
    SELECT * INTO settings FROM withdrawal_settings WHERE currency = NEW.currency;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Configurações de saque não encontradas para moeda %', NEW.currency;
    END IF;
    
    -- Validar valor mínimo
    IF NEW.amount < settings.min_amount THEN
        RAISE EXCEPTION 'Valor mínimo de saque: % %', NEW.currency, settings.min_amount;
    END IF;
    
    -- Validar dia de saque (apenas para novos saques)
    IF TG_OP = 'INSERT' AND NOT is_withdrawal_day() THEN
        RAISE EXCEPTION 'Saques permitidos apenas nos dias 5 e 20 de cada mês. Próxima data: %', next_withdrawal_date();
    END IF;
    
    -- Validar limite diário de solicitações
    IF TG_OP = 'INSERT' THEN
        SELECT COUNT(*) INTO daily_count 
        FROM withdrawal_requests 
        WHERE user_id = NEW.user_id 
        AND DATE_TRUNC('day', requested_at) = DATE_TRUNC('day', NOW())
        AND status NOT IN ('REJECTED', 'CANCELLED');
        
        IF daily_count >= settings.max_daily_requests THEN
            RAISE EXCEPTION 'Limite diário de % solicitações de saque atingido', settings.max_daily_requests;
        END IF;
    END IF;
    
    -- Validar limite mensal
    IF TG_OP = 'INSERT' AND settings.max_monthly_amount IS NOT NULL THEN
        SELECT COALESCE(SUM(amount), 0) INTO monthly_amount
        FROM withdrawal_requests 
        WHERE user_id = NEW.user_id 
        AND currency = NEW.currency
        AND DATE_TRUNC('month', requested_at) = DATE_TRUNC('month', NOW())
        AND status IN ('APPROVED', 'PROCESSING', 'COMPLETED');
        
        IF monthly_amount + NEW.amount > settings.max_monthly_amount THEN
            RAISE EXCEPTION 'Limite mensal de % % seria excedido', NEW.currency, settings.max_monthly_amount;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_withdrawal_request
    BEFORE INSERT OR UPDATE ON withdrawal_requests
    FOR EACH ROW EXECUTE FUNCTION validate_withdrawal_request();

-- Comentários para documentação
COMMENT ON TABLE withdrawal_requests IS 'Solicitações de saque dos usuários';
COMMENT ON COLUMN withdrawal_requests.bank_account IS 'Dados bancários em formato JSON (PIX, conta bancária, internacional)';
COMMENT ON COLUMN withdrawal_requests.transaction_fee IS 'Taxa cobrada pela transação';
COMMENT ON COLUMN withdrawal_requests.final_amount IS 'Valor final que o usuário receberá (amount - transaction_fee)';

COMMENT ON TABLE withdrawal_settings IS 'Configurações administrativas para saques';
COMMENT ON COLUMN withdrawal_settings.allowed_days IS 'Array com os dias do mês permitidos para saque';

COMMENT ON VIEW withdrawal_reports IS 'View para relatórios administrativos de saques';
COMMENT ON VIEW user_withdrawal_stats IS 'View com estatísticas de saque por usuário';

-- Log da migration
INSERT INTO schema_migrations (version, description) 
VALUES ('008', 'Withdrawal System - Sistema completo de saques')
ON CONFLICT (version) DO NOTHING;
