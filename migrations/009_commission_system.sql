-- ========================================
-- MARKETBOT - COMMISSION SYSTEM MIGRATION
-- Sistema completo de comissionamento automático
-- ========================================

-- Tabela de pagamentos de comissão
CREATE TABLE commission_payments (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('COMPANY', 'AFFILIATE')),
    amount_usd DECIMAL(15,6) NOT NULL CHECK (amount_usd >= 0),
    amount_brl DECIMAL(15,2) NOT NULL CHECK (amount_brl >= 0),
    source_position_id INTEGER NOT NULL,
    conversion_rate DECIMAL(10,4) NOT NULL CHECK (conversion_rate > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de afiliados com tier system
CREATE TABLE affiliates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    affiliate_code VARCHAR(20) UNIQUE NOT NULL,
    tier VARCHAR(10) NOT NULL DEFAULT 'NORMAL' CHECK (tier IN ('NORMAL', 'VIP')),
    total_referrals INTEGER DEFAULT 0,
    total_earned_usd DECIMAL(15,6) DEFAULT 0,
    total_earned_brl DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de referências/indicações
CREATE TABLE referrals (
    id SERIAL PRIMARY KEY,
    affiliate_id INTEGER NOT NULL,
    referred_user_id INTEGER NOT NULL UNIQUE,
    commission_earned_usd DECIMAL(15,6) DEFAULT 0,
    commission_earned_brl DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar colunas de saldo de comissão para usuários
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance_usd_commission DECIMAL(15,6) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance_brl_commission DECIMAL(15,2) DEFAULT 0;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_commission_payments_recipient ON commission_payments(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_commission_payments_position ON commission_payments(source_position_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_date ON commission_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliates_user ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referrals_user ON referrals(referred_user_id);

-- Foreign Keys
ALTER TABLE commission_payments 
    ADD CONSTRAINT fk_commission_source_position 
    FOREIGN KEY (source_position_id) REFERENCES trading_positions(id);

ALTER TABLE affiliates 
    ADD CONSTRAINT fk_affiliate_user 
    FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE referrals 
    ADD CONSTRAINT fk_referral_affiliate 
    FOREIGN KEY (affiliate_id) REFERENCES affiliates(id);

ALTER TABLE referrals 
    ADD CONSTRAINT fk_referral_user 
    FOREIGN KEY (referred_user_id) REFERENCES users(id);

-- ========================================
-- FUNÇÕES E TRIGGERS
-- ========================================

-- Função para gerar código de afiliado único
CREATE OR REPLACE FUNCTION generate_affiliate_code() RETURNS VARCHAR(20) AS $$
DECLARE
    code VARCHAR(20);
    exists_code BOOLEAN;
BEGIN
    LOOP
        -- Gerar código alfanumérico de 8 caracteres
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
        
        -- Verificar se já existe
        SELECT EXISTS(SELECT 1 FROM affiliates WHERE affiliate_code = code) INTO exists_code;
        
        IF NOT exists_code THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código automático ao criar afiliado
CREATE OR REPLACE FUNCTION trigger_generate_affiliate_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.affiliate_code IS NULL OR NEW.affiliate_code = '' THEN
        NEW.affiliate_code := generate_affiliate_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_affiliate_code
    BEFORE INSERT ON affiliates
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_affiliate_code();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION trigger_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER commission_payments_updated_at
    BEFORE UPDATE ON commission_payments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER affiliates_updated_at
    BEFORE UPDATE ON affiliates
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

-- ========================================
-- VIEWS DE RELATÓRIOS
-- ========================================

-- View de estatísticas de comissão por mês
CREATE OR REPLACE VIEW commission_monthly_stats AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    recipient_type,
    COUNT(*) as total_payments,
    SUM(amount_usd) as total_usd,
    SUM(amount_brl) as total_brl,
    AVG(amount_usd) as avg_usd,
    AVG(conversion_rate) as avg_conversion_rate
FROM commission_payments
WHERE status = 'PAID'
GROUP BY DATE_TRUNC('month', created_at), recipient_type
ORDER BY month DESC, recipient_type;

-- View de performance de afiliados
CREATE OR REPLACE VIEW affiliate_performance AS
SELECT 
    a.id,
    a.affiliate_code,
    u.full_name,
    u.email,
    a.tier,
    a.total_referrals,
    COALESCE(SUM(cp.amount_usd), 0) as total_earned_usd,
    COALESCE(SUM(cp.amount_brl), 0) as total_earned_brl,
    COUNT(cp.id) as total_commissions,
    COALESCE(AVG(cp.amount_usd), 0) as avg_commission_usd,
    MAX(cp.created_at) as last_commission_date,
    a.created_at as joined_date
FROM affiliates a
JOIN users u ON a.user_id = u.id
LEFT JOIN commission_payments cp ON a.id = cp.recipient_id AND cp.recipient_type = 'AFFILIATE'
WHERE a.is_active = true
GROUP BY a.id, a.affiliate_code, u.full_name, u.email, a.tier, a.total_referrals, a.created_at
ORDER BY total_earned_usd DESC;

-- View de comissões pendentes
CREATE OR REPLACE VIEW pending_commissions AS
SELECT 
    cp.id,
    cp.recipient_id,
    cp.recipient_type,
    cp.amount_usd,
    cp.amount_brl,
    cp.source_position_id,
    cp.created_at,
    CASE 
        WHEN cp.recipient_type = 'AFFILIATE' THEN u.full_name
        ELSE 'MarketBot Company'
    END as recipient_name,
    tp.symbol as position_symbol,
    tp.profit_loss as position_profit
FROM commission_payments cp
LEFT JOIN affiliates a ON cp.recipient_id = a.id AND cp.recipient_type = 'AFFILIATE'
LEFT JOIN users u ON a.user_id = u.id
LEFT JOIN trading_positions tp ON cp.source_position_id = tp.id
WHERE cp.status = 'PENDING'
ORDER BY cp.created_at ASC;

-- ========================================
-- DADOS INICIAIS
-- ========================================

-- Inserir usuário empresa (ID 1) se não existir
INSERT INTO users (id, email, full_name, user_type, is_active) 
VALUES (1, 'company@marketbot.com', 'MarketBot Company', 'ADMIN', true)
ON CONFLICT (id) DO NOTHING;

-- Resetar sequence do users se necessário
SELECT setval('users_id_seq', GREATEST(MAX(id), 1)) FROM users;

-- Inserir configurações padrão do sistema
INSERT INTO system_settings (key, value, description) VALUES
('commission_company_monthly_rate', '0.10', 'Taxa de comissão da empresa para planos mensais (10%)'),
('commission_company_prepaid_rate', '0.20', 'Taxa de comissão da empresa para planos pré-pagos (20%)'),
('commission_affiliate_normal_rate', '0.015', 'Taxa de comissão para afiliados normais (1.5%)'),
('commission_affiliate_vip_rate', '0.05', 'Taxa de comissão para afiliados VIP (5%)'),
('commission_affiliate_vip_threshold', '10000', 'Volume mínimo mensal para tier VIP ($10k USD)'),
('commission_auto_process', 'true', 'Processamento automático de comissões'),
('commission_usd_to_brl_rate', '5.2', 'Taxa de conversão USD para BRL padrão')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ========================================
-- PERMISSÕES E SEGURANÇA
-- ========================================

-- Revogar todas as permissões públicas nas tabelas sensíveis
REVOKE ALL ON commission_payments FROM PUBLIC;
REVOKE ALL ON affiliates FROM PUBLIC;
REVOKE ALL ON referrals FROM PUBLIC;

-- Conceder permissões específicas para o backend
GRANT SELECT, INSERT, UPDATE ON commission_payments TO marketbot_backend;
GRANT SELECT, INSERT, UPDATE ON affiliates TO marketbot_backend;
GRANT SELECT, INSERT, UPDATE ON referrals TO marketbot_backend;
GRANT USAGE ON SEQUENCE commission_payments_id_seq TO marketbot_backend;
GRANT USAGE ON SEQUENCE affiliates_id_seq TO marketbot_backend;
GRANT USAGE ON SEQUENCE referrals_id_seq TO marketbot_backend;

-- Permissões de leitura para views
GRANT SELECT ON commission_monthly_stats TO marketbot_backend;
GRANT SELECT ON affiliate_performance TO marketbot_backend;
GRANT SELECT ON pending_commissions TO marketbot_backend;

-- ========================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE commission_payments IS 'Registro de todos os pagamentos de comissão (empresa e afiliados)';
COMMENT ON TABLE affiliates IS 'Cadastro de afiliados com sistema de tiers baseado em volume';
COMMENT ON TABLE referrals IS 'Relacionamento entre afiliados e usuários indicados';

COMMENT ON COLUMN commission_payments.recipient_type IS 'COMPANY para empresa, AFFILIATE para afiliado';
COMMENT ON COLUMN commission_payments.conversion_rate IS 'Taxa USD→BRL usada no momento do cálculo';
COMMENT ON COLUMN affiliates.tier IS 'NORMAL (1.5%) ou VIP (5%) baseado em volume mensal';
COMMENT ON COLUMN affiliates.affiliate_code IS 'Código único de 8 caracteres para links de indicação';

-- Inserir log de migração
INSERT INTO migration_log (version, description, executed_at) 
VALUES ('009', 'Sistema completo de comissionamento automático', NOW());

-- ========================================
-- SUCESSO!
-- ========================================

SELECT 'Commission system migration completed successfully!' as status;
