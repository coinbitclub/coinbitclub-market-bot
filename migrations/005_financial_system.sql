-- ========================================
-- MARKETBOT - SISTEMA FINANCEIRO
-- Migration para sistema de pagamentos Stripe
-- FASE 3 - Estrutura completa de pagamentos
-- ========================================

BEGIN;

-- ========================================
-- TABELA DE PLANOS DE ASSINATURA
-- ========================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_price_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('MONTHLY', 'PREPAID')),
  price_usd DECIMAL(10,2) NOT NULL,
  price_brl DECIMAL(10,2) NOT NULL,
  features JSONB DEFAULT '[]',
  commission_rate DECIMAL(5,4) DEFAULT 0.1000, -- 10% padrão
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_plans_stripe_product ON subscription_plans(stripe_product_id);
CREATE INDEX idx_subscription_plans_type ON subscription_plans(type);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);

-- ========================================
-- TABELA DE SESSÕES DE PAGAMENTO
-- ========================================

CREATE TABLE IF NOT EXISTS payment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL, -- Stripe session ID
  user_id UUID NOT NULL,
  plan_id VARCHAR(255) NOT NULL, -- Stripe product ID
  price_id VARCHAR(255) NOT NULL, -- Stripe price ID
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED')),
  payment_intent_id VARCHAR(255),
  subscription_id VARCHAR(255),
  affiliate_code VARCHAR(100),
  coupon_code VARCHAR(100),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_payment_sessions_user ON payment_sessions(user_id);
CREATE INDEX idx_payment_sessions_status ON payment_sessions(status);
CREATE INDEX idx_payment_sessions_session_id ON payment_sessions(session_id);
CREATE INDEX idx_payment_sessions_created_at ON payment_sessions(created_at);

-- ========================================
-- TABELA DE TRANSAÇÕES FINANCEIRAS
-- ========================================

CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  payment_session_id UUID,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('PAYMENT', 'REFUND', 'COMMISSION', 'WITHDRAWAL', 'ADJUSTMENT')),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  stripe_transaction_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_session_id) REFERENCES payment_sessions(id) ON DELETE SET NULL
);

CREATE INDEX idx_financial_transactions_user ON financial_transactions(user_id);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX idx_financial_transactions_created_at ON financial_transactions(created_at);

-- ========================================
-- TABELA DE CUPONS DE DESCONTO
-- ========================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
  discount_percent DECIMAL(5,2), -- Para desconto percentual (0-100)
  discount_amount DECIMAL(10,2), -- Para desconto fixo
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  max_uses_per_user INTEGER DEFAULT 1,
  total_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);
CREATE INDEX idx_coupons_expires_at ON coupons(expires_at);

-- ========================================
-- TABELA DE USO DE CUPONS
-- ========================================

CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL,
  user_id UUID NOT NULL,
  payment_session_id UUID,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_session_id) REFERENCES payment_sessions(id) ON DELETE SET NULL,
  
  UNIQUE(coupon_id, user_id, payment_session_id)
);

CREATE INDEX idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user ON coupon_usage(user_id);
CREATE INDEX idx_coupon_usage_used_at ON coupon_usage(used_at);

-- ========================================
-- TABELA DE ASSINATURAS ATIVAS
-- ========================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAUSED')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT
);

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_stripe_sub ON user_subscriptions(stripe_subscription_id);

-- ========================================
-- TABELA DE COMISSÕES DE AFILIADOS
-- ========================================

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  payment_session_id UUID NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL, -- Taxa aplicada (ex: 0.1000 = 10%)
  commission_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (affiliate_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_session_id) REFERENCES payment_sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_affiliate_commissions_affiliate ON affiliate_commissions(affiliate_user_id);
CREATE INDEX idx_affiliate_commissions_referred ON affiliate_commissions(referred_user_id);
CREATE INDEX idx_affiliate_commissions_status ON affiliate_commissions(status);

-- ========================================
-- ADIÇÃO DE CAMPOS À TABELA USERS
-- ========================================

-- Adicionar campos relacionados a planos e pagamentos
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'FREE' CHECK (plan_type IN ('FREE', 'MONTHLY', 'PREPAID')),
ADD COLUMN IF NOT EXISTS plan_status VARCHAR(50) DEFAULT 'INACTIVE' CHECK (plan_status IN ('INACTIVE', 'ACTIVE', 'EXPIRED', 'CANCELLED')),
ADD COLUMN IF NOT EXISTS plan_activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS affiliate_code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(50);

-- Índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);
CREATE INDEX IF NOT EXISTS idx_users_plan_status ON users(plan_status);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_affiliate_code ON users(affiliate_code);

-- ========================================
-- TRIGGERS PARA UPDATED_AT
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers nas tabelas relevantes
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at 
  BEFORE UPDATE ON subscription_plans 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_sessions_updated_at ON payment_sessions;
CREATE TRIGGER update_payment_sessions_updated_at 
  BEFORE UPDATE ON payment_sessions 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at 
  BEFORE UPDATE ON coupons 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON user_subscriptions 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ========================================
-- INSERIR PLANOS PADRÃO
-- ========================================

INSERT INTO subscription_plans (stripe_product_id, stripe_price_id, name, description, type, price_usd, price_brl, features, commission_rate)
VALUES 
  ('marketbot_monthly', 'price_monthly_brl', 'MarketBot - Plano Mensal', 'Acesso completo ao MarketBot com trading automático por 30 dias', 'MONTHLY', 149.00, 497.00, '["trading_real", "signals_unlimited", "support_24_7"]', 0.1000),
  ('marketbot_prepaid', 'price_prepaid_brl', 'MarketBot - Plano Pré-pago', 'Créditos pré-pagos para trading automático com desconto especial', 'PREPAID', 599.00, 1997.00, '["trading_real", "signals_unlimited", "no_expiry"]', 0.2000)
ON CONFLICT (stripe_product_id) DO NOTHING;

-- ========================================
-- INSERIR CUPONS DE EXEMPLO
-- ========================================

INSERT INTO coupons (code, name, description, discount_type, discount_percent, max_uses, max_uses_per_user, expires_at)
VALUES 
  ('LANCAMENTO50', 'Desconto de Lançamento', '50% de desconto para os primeiros usuários', 'PERCENTAGE', 50.00, 100, 1, CURRENT_TIMESTAMP + INTERVAL '30 days'),
  ('BLACKFRIDAY', 'Black Friday 2024', '30% de desconto especial Black Friday', 'PERCENTAGE', 30.00, 500, 1, CURRENT_TIMESTAMP + INTERVAL '7 days'),
  ('WELCOME10', 'Boas-vindas', '10% de desconto para novos usuários', 'PERCENTAGE', 10.00, NULL, 1, CURRENT_TIMESTAMP + INTERVAL '90 days')
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- VIEWS PARA RELATÓRIOS
-- ========================================

-- View para relatório de receita
CREATE OR REPLACE VIEW revenue_report AS
SELECT 
  DATE_TRUNC('month', ps.completed_at) as month,
  sp.type as plan_type,
  COUNT(*) as total_payments,
  SUM(ps.amount) as total_revenue,
  AVG(ps.amount) as avg_payment_value
FROM payment_sessions ps
JOIN subscription_plans sp ON ps.plan_id = sp.stripe_product_id
WHERE ps.status = 'COMPLETED'
  AND ps.completed_at IS NOT NULL
GROUP BY DATE_TRUNC('month', ps.completed_at), sp.type
ORDER BY month DESC, plan_type;

-- View para relatório de afiliados
CREATE OR REPLACE VIEW affiliate_report AS
SELECT 
  u.id as affiliate_id,
  u.email as affiliate_email,
  u.affiliate_code,
  COUNT(DISTINCT ac.referred_user_id) as total_referrals,
  SUM(ac.commission_amount) as total_commissions,
  COUNT(CASE WHEN ac.status = 'PAID' THEN 1 END) as paid_commissions,
  COUNT(CASE WHEN ac.status = 'PENDING' THEN 1 END) as pending_commissions
FROM users u
LEFT JOIN affiliate_commissions ac ON u.id = ac.affiliate_user_id
WHERE u.affiliate_code IS NOT NULL
GROUP BY u.id, u.email, u.affiliate_code
ORDER BY total_commissions DESC NULLS LAST;

-- ========================================
-- FUNÇÕES AUXILIARES
-- ========================================

-- Função para gerar código de afiliado único
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar código aleatório de 8 caracteres
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM users WHERE affiliate_code = new_code) INTO code_exists;
    
    -- Se não existe, usar este código
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular comissão de afiliado
CREATE OR REPLACE FUNCTION calculate_affiliate_commission(
  payment_amount DECIMAL(10,2),
  commission_rate DECIMAL(5,4)
)
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN ROUND(payment_amount * commission_rate, 2);
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ========================================
-- COMENTÁRIOS DA MIGRATION
-- ========================================

COMMENT ON TABLE subscription_plans IS 'Planos de assinatura disponíveis no sistema';
COMMENT ON TABLE payment_sessions IS 'Sessões de pagamento do Stripe com status e metadados';
COMMENT ON TABLE financial_transactions IS 'Histórico completo de transações financeiras';
COMMENT ON TABLE coupons IS 'Sistema de cupons de desconto';
COMMENT ON TABLE coupon_usage IS 'Registro de uso de cupons por usuários';
COMMENT ON TABLE user_subscriptions IS 'Assinaturas ativas dos usuários';
COMMENT ON TABLE affiliate_commissions IS 'Sistema de comissões para afiliados';

COMMENT ON FUNCTION generate_affiliate_code() IS 'Gera código único de afiliado';
COMMENT ON FUNCTION calculate_affiliate_commission(DECIMAL, DECIMAL) IS 'Calcula valor da comissão do afiliado';

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

SELECT 'Sistema financeiro instalado com sucesso!' as status,
       COUNT(*) as total_plans
FROM subscription_plans
WHERE is_active = true;
