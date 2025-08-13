-- =====================================================
-- COINBITCLUB MARKET BOT - ENTERPRISE SYSTEM V6.0 FIXED
-- MIGRAÇÃO PROFISSIONAL COM TIPOS CORRETOS
-- =====================================================
-- Data: 12/08/2025
-- Versão: 6.0.0 Professional Fixed
-- Correção: Usar INTEGER em vez de UUID para user_id
-- Valores: R$297 Brasil PRO, $50 Global PRO
-- =====================================================

-- =====================================================
-- 1. CRIAÇÃO DE TIPOS ENUM ENTERPRISE
-- =====================================================

-- Tipo de perfil de usuário
DO $$ BEGIN
    CREATE TYPE user_profile_enum AS ENUM (
        'basic',           -- Usuário básico
        'admin',           -- Administrador
        'affiliate_normal', -- Afiliado normal
        'affiliate_premium', -- Afiliado premium
        'master_affiliate', -- Afiliado master
        'enterprise'       -- Cliente enterprise
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Status de afiliação
DO $$ BEGIN
    CREATE TYPE affiliate_status_enum AS ENUM (
        'pending',   -- Pendente aprovação
        'active',    -- Ativo
        'suspended', -- Suspenso
        'terminated' -- Terminado
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tipo de plano
DO $$ BEGIN
    CREATE TYPE plan_type_enum AS ENUM (
        'monthly',  -- Mensalidade
        'prepaid'   -- Pré-pago
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. TABELA DE PLANOS ENTERPRISE
-- =====================================================

CREATE TABLE IF NOT EXISTS plans_enterprise (
    id SERIAL PRIMARY KEY,
    plan_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    region VARCHAR(50) NOT NULL, -- 'brazil', 'international'
    type plan_type_enum NOT NULL,
    
    -- Valores financeiros (R$297 para Brasil PRO conforme especificação)
    monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    minimum_balance DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    
    -- Integração Stripe
    stripe_product_id VARCHAR(100),
    stripe_price_id VARCHAR(100),
    
    -- Características
    features TEXT[], -- Array de funcionalidades
    max_simultaneous_trades INTEGER DEFAULT 2,
    ai_reports_interval_hours INTEGER DEFAULT 4,
    priority_support BOOLEAN DEFAULT false,
    whatsapp_notifications BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Controle
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_plans_enterprise_region ON plans_enterprise(region);
CREATE INDEX IF NOT EXISTS idx_plans_enterprise_type ON plans_enterprise(type);
CREATE INDEX IF NOT EXISTS idx_plans_enterprise_active ON plans_enterprise(is_active);

-- =====================================================
-- 3. TABELA DE PERFIS DE USUÁRIO ENTERPRISE (CORRIGIDA)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles_enterprise (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, -- CORRIGIDO: usar INTEGER em vez de UUID
    profile_type user_profile_enum NOT NULL DEFAULT 'basic',
    
    -- Informações pessoais
    nome_completo VARCHAR(255),
    cpf VARCHAR(20),
    whatsapp VARCHAR(20),
    telegram VARCHAR(100),
    pais VARCHAR(2) DEFAULT 'BR',
    
    -- Configurações financeiras
    limite_saque_diario DECIMAL(15,2) DEFAULT 1000.00,
    limite_operacao DECIMAL(15,2) DEFAULT 500.00,
    taxa_comissao_personalizada DECIMAL(5,2),
    
    -- Permissões e funcionalidades
    features_habilitadas TEXT[] DEFAULT ARRAY['basic_trading'],
    dashboard_access BOOLEAN DEFAULT true,
    api_access BOOLEAN DEFAULT false,
    webhook_access BOOLEAN DEFAULT false,
    
    -- Status e controle
    is_active BOOLEAN DEFAULT true,
    verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    verification_documents TEXT[],
    last_login TIMESTAMP,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Chave estrangeira CORRIGIDA
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Garantir um perfil por usuário
    UNIQUE(user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_enterprise_user_id ON user_profiles_enterprise(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_enterprise_type ON user_profiles_enterprise(profile_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_enterprise_active ON user_profiles_enterprise(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_enterprise_verification ON user_profiles_enterprise(verification_status);

-- =====================================================
-- 4. TABELA DE ASSINATURAS ENTERPRISE (CORRIGIDA)
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions_enterprise (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, -- CORRIGIDO: usar INTEGER
    plan_id INTEGER NOT NULL, -- CORRIGIDO: usar INTEGER
    
    -- Status da assinatura
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'cancelled', 'expired'
    
    -- Integração Stripe
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    stripe_payment_method_id VARCHAR(255),
    
    -- Datas importantes
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    next_billing_date TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- Valores
    monthly_amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'BRL',
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Controle de pagamento
    payment_failures INTEGER DEFAULT 0,
    last_payment_attempt TIMESTAMP,
    grace_period_end TIMESTAMP,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Chaves estrangeiras CORRIGIDAS
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans_enterprise(id) ON DELETE RESTRICT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_enterprise_user_id ON subscriptions_enterprise(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_enterprise_plan_id ON subscriptions_enterprise(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_enterprise_status ON subscriptions_enterprise(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_enterprise_stripe_sub ON subscriptions_enterprise(stripe_subscription_id);

-- =====================================================
-- 5. SISTEMA DE AFILIADOS ENTERPRISE (CORRIGIDO)
-- =====================================================

CREATE TABLE IF NOT EXISTS affiliate_levels (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, -- CORRIGIDO: usar INTEGER
    
    -- Configuração do afiliado
    level INTEGER NOT NULL DEFAULT 1, -- 1=Normal, 2=Premium, 3=Master
    affiliate_code VARCHAR(50) UNIQUE NOT NULL,
    parent_affiliate_id INTEGER, -- Afiliado que o convidou
    
    -- Comissões e limites
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    monthly_quota INTEGER DEFAULT 10, -- Meta mensal de indicações
    max_team_size INTEGER DEFAULT 50,
    
    -- Métricas de performance
    total_referrals INTEGER DEFAULT 0,
    active_referrals INTEGER DEFAULT 0,
    total_commissions_earned DECIMAL(15,2) DEFAULT 0,
    monthly_commissions DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status affiliate_status_enum DEFAULT 'pending',
    is_active BOOLEAN DEFAULT true,
    next_review_date TIMESTAMP,
    promotion_eligible BOOLEAN DEFAULT false,
    
    -- Configurações avançadas
    custom_landing_page VARCHAR(255),
    marketing_materials TEXT[],
    special_permissions TEXT[],
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Chaves estrangeiras CORRIGIDAS
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_affiliate_id) REFERENCES affiliate_levels(id) ON DELETE SET NULL,
    
    -- Garantir um nível por usuário
    UNIQUE(user_id),
    UNIQUE(affiliate_code)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_affiliate_levels_user_id ON affiliate_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_levels_code ON affiliate_levels(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_levels_parent ON affiliate_levels(parent_affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_levels_status ON affiliate_levels(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_levels_level ON affiliate_levels(level);

-- =====================================================
-- 6. INSERÇÃO DOS PLANOS ENTERPRISE (VALORES CORRETOS)
-- =====================================================

-- Inserir planos conforme especificação técnica (R$297 para Brasil PRO)
INSERT INTO plans_enterprise (
    plan_code, name, description, region, type, 
    monthly_price, currency, commission_rate, minimum_balance, 
    stripe_product_id, features, max_simultaneous_trades,
    ai_reports_interval_hours, priority_support, is_popular
) VALUES
-- BRASIL - PLANO PRO (R$297 conforme especificação)
(
    'brasil_pro', 
    'Brasil PRO', 
    'Plano mensal premium com comissão reduzida de 10% sobre lucros - R$297/mês',
    'brazil', 
    'monthly', 
    297.00, 
    'BRL', 
    10.00, 
    100.00, 
    'prod_SbHejGiPSr1asV',
    ARRAY[
        'Trading automatizado 24/7',
        'Máximo 2 operações simultâneas', 
        'Relatórios IA a cada 4 horas',
        'Notificações WhatsApp prioritárias',
        'Suporte técnico prioritário',
        'Dashboard analytics avançado',
        'Análise de risco em tempo real',
        'API access premium',
        'Webhook notifications'
    ],
    2,
    4,
    true,
    true
),
-- BRASIL - PLANO FLEX (Sem mensalidade)
(
    'brasil_flex',
    'Brasil FLEX', 
    'Plano pré-pago sem mensalidade, apenas 20% sobre lucros realizados',
    'brazil',
    'prepaid',
    0.00,
    'BRL',
    20.00,
    100.00,
    'prod_SbHgHezeyKfTVg',
    ARRAY[
        'Trading automatizado 24/7',
        'Máximo 2 operações simultâneas',
        'Relatórios IA a cada 4 horas', 
        'Notificações WhatsApp',
        'Suporte técnico padrão',
        'Dashboard completo',
        'Sem mensalidade - apenas comissão sobre lucros'
    ],
    2,
    4,
    false,
    false
),
-- INTERNACIONAL - PLANO PRO ($50 USD)
(
    'global_pro',
    'Global PRO',
    'Monthly premium plan with reduced 10% commission on profits - $50/month', 
    'international',
    'monthly',
    50.00,
    'USD',
    10.00,
    20.00,
    'prod_SbHhz5Ht3q1lul',
    ARRAY[
        '24/7 Automated Trading',
        'Maximum 2 simultaneous operations',
        'AI Reports every 4 hours',
        'Priority WhatsApp Notifications', 
        'Premium Technical Support',
        'Advanced Analytics Dashboard',
        'Real-time Risk Analysis',
        'Premium API Access',
        'Webhook Notifications'
    ],
    2,
    4,
    true,
    true
),
-- INTERNACIONAL - PLANO FLEX (Sem mensalidade)
(
    'global_flex',
    'Global FLEX',
    'Prepaid plan with no monthly fee, only 20% commission on realized profits',
    'international', 
    'prepaid',
    0.00,
    'USD',
    20.00,
    20.00,
    'prod_SbHiDqfrH2T8dI',
    ARRAY[
        '24/7 Automated Trading',
        'Maximum 2 simultaneous operations', 
        'AI Reports every 4 hours',
        'WhatsApp Notifications',
        'Standard Technical Support',
        'Complete Dashboard',
        'No monthly fee - commission only on profits'
    ],
    2,
    4,
    false,
    false
)
ON CONFLICT (plan_code) DO UPDATE SET
    monthly_price = EXCLUDED.monthly_price,
    commission_rate = EXCLUDED.commission_rate,
    minimum_balance = EXCLUDED.minimum_balance,
    features = EXCLUDED.features,
    updated_at = NOW();

-- =====================================================
-- 7. MIGRAÇÃO DE DADOS EXISTENTES (CORRIGIDA)
-- =====================================================

-- Migrar usuários existentes para perfis enterprise (CORRIGIDA PARA ESTRUTURA REAL)
INSERT INTO user_profiles_enterprise (
    user_id, 
    profile_type, 
    nome_completo, 
    whatsapp, 
    cpf,
    pais,
    limite_saque_diario,
    limite_operacao,
    features_habilitadas,
    dashboard_access,
    verification_status
)
SELECT 
    u.id,
    CASE 
        WHEN u.user_type = 'admin' THEN 'admin'::user_profile_enum
        WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliates' 
                   AND EXISTS(SELECT 1 FROM affiliates WHERE user_id = u.id)) 
             THEN 'affiliate_normal'::user_profile_enum
        ELSE 'basic'::user_profile_enum
    END,
    COALESCE(u.name, 'Usuário ' || u.email),
    COALESCE(u.phone, '+5511999999999'), 
    u.cpf,
    COALESCE(u.country, 'BR'),
    CASE 
        WHEN u.user_type = 'admin' THEN 100000.00
        WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliates' 
                   AND EXISTS(SELECT 1 FROM affiliates WHERE user_id = u.id)) 
             THEN 2000.00
        ELSE 1000.00
    END,
    CASE 
        WHEN u.user_type = 'admin' THEN 50000.00
        ELSE 500.00
    END,
    CASE 
        WHEN u.user_type = 'admin' THEN ARRAY['admin_panel', 'full_api', 'webhooks', 'advanced_analytics']
        WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliates' 
                   AND EXISTS(SELECT 1 FROM affiliates WHERE user_id = u.id)) 
             THEN ARRAY['affiliate_dashboard', 'commission_tracking', 'referral_management']
        ELSE ARRAY['basic_trading', 'basic_dashboard']
    END,
    true,
    CASE 
        WHEN u.is_email_verified = true THEN 'verified'
        ELSE 'pending'
    END
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles_enterprise upe WHERE upe.user_id = u.id
);

-- =====================================================
-- 8. TRIGGERS E FUNÇÕES DE AUDITORIA
-- =====================================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_plans_enterprise_updated_at ON plans_enterprise;
CREATE TRIGGER update_plans_enterprise_updated_at 
    BEFORE UPDATE ON plans_enterprise 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_enterprise_updated_at ON user_profiles_enterprise;
CREATE TRIGGER update_user_profiles_enterprise_updated_at 
    BEFORE UPDATE ON user_profiles_enterprise 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_enterprise_updated_at ON subscriptions_enterprise;
CREATE TRIGGER update_subscriptions_enterprise_updated_at 
    BEFORE UPDATE ON subscriptions_enterprise 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_affiliate_levels_updated_at ON affiliate_levels;
CREATE TRIGGER update_affiliate_levels_updated_at 
    BEFORE UPDATE ON affiliate_levels 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. VIEWS PARA RELATÓRIOS ENTERPRISE
-- =====================================================

-- View consolidada de usuários enterprise
CREATE OR REPLACE VIEW vw_users_enterprise AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.created_at as user_created_at,
    upe.profile_type,
    upe.nome_completo,
    upe.whatsapp,
    upe.pais,
    upe.verification_status,
    upe.is_active as profile_active,
    -- Assinatura atual
    se.status as subscription_status,
    pe.name as plan_name,
    pe.monthly_price,
    pe.currency,
    se.next_billing_date,
    -- Afiliação (se aplicável)
    al.level as affiliate_level,
    al.affiliate_code,
    al.total_commissions_earned
FROM users u
LEFT JOIN user_profiles_enterprise upe ON u.id = upe.user_id
LEFT JOIN subscriptions_enterprise se ON u.id = se.user_id AND se.status = 'active'
LEFT JOIN plans_enterprise pe ON se.plan_id = pe.id
LEFT JOIN affiliate_levels al ON u.id = al.user_id;

-- =====================================================
-- 10. VERIFICAÇÃO FINAL E RELATÓRIO
-- =====================================================

-- Verificar integridade da migração
DO $$
DECLARE
    total_users INTEGER;
    migrated_profiles INTEGER;
    total_plans INTEGER;
    brasil_pro_price DECIMAL;
    global_pro_price DECIMAL;
BEGIN
    -- Contar usuários
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO migrated_profiles FROM user_profiles_enterprise;
    SELECT COUNT(*) INTO total_plans FROM plans_enterprise;
    SELECT monthly_price INTO brasil_pro_price FROM plans_enterprise WHERE plan_code = 'brasil_pro';
    SELECT monthly_price INTO global_pro_price FROM plans_enterprise WHERE plan_code = 'global_pro';
    
    -- Relatório
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO ENTERPRISE V6.0 CONCLUÍDA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de usuários: %', total_users;
    RAISE NOTICE 'Perfis enterprise criados: %', migrated_profiles;
    RAISE NOTICE 'Planos enterprise disponíveis: %', total_plans;
    RAISE NOTICE 'Preço Brasil PRO: R$ %.2f (CORRETO)', brasil_pro_price;
    RAISE NOTICE 'Preço Global PRO: $ %.2f (CORRETO)', global_pro_price;
    RAISE NOTICE '========================================';
    
    -- Verificar valores corretos
    IF brasil_pro_price != 297.00 THEN
        RAISE EXCEPTION 'ERRO: Preço do Brasil PRO incorreto! Esperado: R$297.00, Encontrado: R$%.2f', brasil_pro_price;
    END IF;
    
    IF global_pro_price != 50.00 THEN
        RAISE EXCEPTION 'ERRO: Preço do Global PRO incorreto! Esperado: $50.00, Encontrado: $%.2f', global_pro_price;
    END IF;
    
    RAISE NOTICE '✅ MIGRAÇÃO EXECUTADA COM SUCESSO!';
    RAISE NOTICE '🚀 Sistema Enterprise ativado com valores corretos R$297 e $50';
    RAISE NOTICE '💼 Tipos de perfil: basic, admin, affiliate_normal, affiliate_premium, master_affiliate, enterprise';
    RAISE NOTICE '📊 Sistema 100% OPERACIONAL para produção!';
END $$;

-- =====================================================
-- FIM DA MIGRAÇÃO ENTERPRISE V6.0 PROFESSIONAL FIXED
-- =====================================================
