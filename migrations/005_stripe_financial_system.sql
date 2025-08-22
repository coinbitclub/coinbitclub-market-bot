-- ========================================
-- MARKETBOT - STRIPE FINANCIAL SYSTEM
-- Sistema Financeiro Completo com Stripe
-- ========================================
-- Data: 21/08/2025
-- Funcionalidades: Cupons, Afiliados, Pagamentos

-- ========================================
-- TABELA DE CUPONS
-- ========================================

CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    max_uses INTEGER NOT NULL DEFAULT 100,
    current_uses INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by_user_id INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON coupons(created_by_user_id);

-- ========================================
-- TABELA DE USO DE CUPONS
-- ========================================

CREATE TABLE IF NOT EXISTS coupon_usage (
    id SERIAL PRIMARY KEY,
    coupon_id INTEGER NOT NULL REFERENCES coupons(id),
    user_id INTEGER NOT NULL,
    order_id VARCHAR(255),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(coupon_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON coupon_usage(user_id);

-- ========================================
-- TABELA DE AFILIADOS
-- ========================================

CREATE TABLE IF NOT EXISTS affiliates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    affiliate_code VARCHAR(20) UNIQUE NOT NULL,
    affiliate_link TEXT NOT NULL,
    commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.015, -- 1.5% padrão
    total_referrals INTEGER NOT NULL DEFAULT 0,
    total_commission_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    commission_pending DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    commission_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    tier VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (tier IN ('normal', 'vip')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_affiliates_user ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_active ON affiliates(is_active);
CREATE INDEX IF NOT EXISTS idx_affiliates_tier ON affiliates(tier);

-- ========================================
-- TABELA DE REFERRALS
-- ========================================

CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    affiliate_id INTEGER NOT NULL REFERENCES affiliates(id),
    referred_user_id INTEGER NOT NULL,
    order_id VARCHAR(255),
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,4) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referrals_user ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_order ON referrals(order_id);

-- ========================================
-- TABELA DE PAGAMENTOS DE COMISSÃO
-- ========================================

CREATE TABLE IF NOT EXISTS commission_payments (
    id SERIAL PRIMARY KEY,
    affiliate_id INTEGER NOT NULL REFERENCES affiliates(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_commission_payments_affiliate ON commission_payments(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_date ON commission_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_commission_payments_status ON commission_payments(status);

-- ========================================
-- TABELA DE ASSINATURAS DE USUÁRIOS
-- ========================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('monthly', 'prepaid')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    stripe_order_id VARCHAR(255),
    amount_paid DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'BRL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires ON user_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);

-- ========================================
-- TABELA DE HISTÓRICO DE PAGAMENTOS
-- ========================================

CREATE TABLE IF NOT EXISTS payment_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    stripe_payment_intent_id VARCHAR(255),
    stripe_session_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    status VARCHAR(20) NOT NULL,
    plan_type VARCHAR(20),
    coupon_code VARCHAR(20),
    affiliate_code VARCHAR(20),
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_intent ON payment_history(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_affiliate ON payment_history(affiliate_code);

-- ========================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ========================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- INSERÇÕES INICIAIS DE EXEMPLO
-- ========================================

-- Cupons de exemplo (apenas se não existirem)
INSERT INTO coupons (code, discount_type, discount_value, max_uses, expires_at, created_by_user_id, metadata) 
SELECT 
    'WELCOME10', 'percentage', 10.00, 1000, 
    NOW() + INTERVAL '60 days', 1,
    '{"type": "welcome", "auto_generated": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'WELCOME10');

INSERT INTO coupons (code, discount_type, discount_value, max_uses, expires_at, created_by_user_id, metadata) 
SELECT 
    'VIP15', 'percentage', 15.00, 500, 
    NOW() + INTERVAL '30 days', 1,
    '{"type": "vip", "auto_generated": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'VIP15');

INSERT INTO coupons (code, discount_type, discount_value, max_uses, expires_at, created_by_user_id, metadata) 
SELECT 
    'BLACKFRIDAY25', 'percentage', 25.00, 2000, 
    NOW() + INTERVAL '7 days', 1,
    '{"type": "black_friday", "auto_generated": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'BLACKFRIDAY25');

-- ========================================
-- VIEWS PARA RELATÓRIOS
-- ========================================

-- View de estatísticas de afiliados
CREATE OR REPLACE VIEW affiliate_stats AS
SELECT 
    a.id,
    a.user_id,
    a.affiliate_code,
    a.tier,
    a.commission_rate,
    a.total_referrals,
    a.total_commission_earned,
    a.commission_pending,
    a.commission_paid,
    COUNT(r.id) as referrals_count,
    COALESCE(SUM(r.commission_amount), 0) as total_commissions,
    COUNT(CASE WHEN r.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as referrals_last_30_days,
    COUNT(CASE WHEN r.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as referrals_last_7_days,
    a.created_at,
    a.is_active
FROM affiliates a
LEFT JOIN referrals r ON a.id = r.affiliate_id
GROUP BY a.id;

-- View de estatísticas de cupons
CREATE OR REPLACE VIEW coupon_stats AS
SELECT 
    c.id,
    c.code,
    c.discount_type,
    c.discount_value,
    c.max_uses,
    c.current_uses,
    c.expires_at,
    c.is_active,
    COUNT(cu.id) as usage_count,
    COUNT(CASE WHEN cu.used_at >= NOW() - INTERVAL '30 days' THEN 1 END) as uses_last_30_days,
    COUNT(CASE WHEN cu.used_at >= NOW() - INTERVAL '7 days' THEN 1 END) as uses_last_7_days,
    c.created_at
FROM coupons c
LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
GROUP BY c.id;

-- ========================================
-- COMENTÁRIOS FINAIS
-- ========================================

COMMENT ON TABLE coupons IS 'Sistema de cupons de desconto com controle de uso e expiração';
COMMENT ON TABLE affiliates IS 'Sistema de afiliados com comissões automáticas';
COMMENT ON TABLE referrals IS 'Registro de indicações e comissões geradas';
COMMENT ON TABLE user_subscriptions IS 'Controle de assinaturas e planos dos usuários';
COMMENT ON TABLE payment_history IS 'Histórico completo de pagamentos via Stripe';

COMMENT ON COLUMN affiliates.commission_rate IS 'Taxa de comissão (ex: 0.015 = 1.5%)';
COMMENT ON COLUMN coupons.discount_value IS 'Valor do desconto (% para percentage, valor fixo para fixed)';

-- Finalização
SELECT 
    'Sistema Financeiro Stripe criado com sucesso!' as status,
    COUNT(*) as total_tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('coupons', 'coupon_usage', 'affiliates', 'referrals', 'commission_payments', 'user_subscriptions', 'payment_history');
