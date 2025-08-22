-- ========================================
-- MARKETBOT - STRIPE WEBHOOKS MIGRATION
-- Sistema completo de webhooks e integração Stripe
-- ========================================

-- Tabela para logs de webhooks do Stripe
CREATE TABLE stripe_webhook_events (
    id SERIAL PRIMARY KEY,
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar colunas relacionadas ao Stripe na tabela users (se não existirem)
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_current_period_start TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP;

-- Adicionar colunas para dados do Stripe na tabela payment_history (se não existirem)
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS stripe_invoice_id VARCHAR(255);
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255);
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Tabela para configurações de produtos/preços do Stripe
CREATE TABLE stripe_products (
    id SERIAL PRIMARY KEY,
    stripe_product_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_price_id VARCHAR(255) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50) NOT NULL,
    billing_interval VARCHAR(20), -- 'month', 'year', null para one-time
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    credits_amount DECIMAL(15,6), -- Para compras de crédito
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela para rastreamento de assinaturas
CREATE TABLE subscription_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    stripe_subscription_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'canceled', 'renewed'
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    old_plan VARCHAR(50),
    new_plan VARCHAR(50),
    amount_cents INTEGER,
    currency VARCHAR(3),
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed ON stripe_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_created ON stripe_webhook_events(created_at);

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_payment ON payment_history(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_invoice ON payment_history(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_checkout ON payment_history(stripe_checkout_session_id);

CREATE INDEX IF NOT EXISTS idx_stripe_products_product_id ON stripe_products(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_stripe_products_price_id ON stripe_products(stripe_price_id);
CREATE INDEX IF NOT EXISTS idx_stripe_products_active ON stripe_products(is_active);

CREATE INDEX IF NOT EXISTS idx_subscription_history_user ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription ON subscription_history(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event ON subscription_history(event_type);

-- Foreign Keys
ALTER TABLE subscription_history 
    ADD CONSTRAINT fk_subscription_history_user 
    FOREIGN KEY (user_id) REFERENCES users(id);

-- ========================================
-- FUNÇÕES E TRIGGERS
-- ========================================

-- Função para registrar mudanças de assinatura automaticamente
CREATE OR REPLACE FUNCTION log_subscription_change() RETURNS TRIGGER AS $$
BEGIN
    -- Só registra se houve mudança real nos campos de assinatura
    IF (OLD.stripe_subscription_id IS DISTINCT FROM NEW.stripe_subscription_id) OR
       (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status) OR
       (OLD.subscription_plan IS DISTINCT FROM NEW.subscription_plan) THEN
        
        INSERT INTO subscription_history (
            user_id,
            stripe_subscription_id,
            event_type,
            old_status,
            new_status,
            old_plan,
            new_plan,
            created_at
        ) VALUES (
            NEW.id,
            COALESCE(NEW.stripe_subscription_id, OLD.stripe_subscription_id),
            CASE 
                WHEN OLD.stripe_subscription_id IS NULL AND NEW.stripe_subscription_id IS NOT NULL THEN 'created'
                WHEN OLD.stripe_subscription_id IS NOT NULL AND NEW.stripe_subscription_id IS NULL THEN 'canceled'
                ELSE 'updated'
            END,
            OLD.subscription_status,
            NEW.subscription_status,
            OLD.subscription_plan,
            NEW.subscription_plan,
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para capturar mudanças de assinatura
CREATE TRIGGER subscription_change_log
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_subscription_change();

-- Função para limpeza automática de webhooks antigos
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Deletar eventos processados com mais de 30 dias
    DELETE FROM stripe_webhook_events 
    WHERE processed = true 
    AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VIEWS DE RELATÓRIOS
-- ========================================

-- View de estatísticas de webhooks
CREATE OR REPLACE VIEW webhook_stats AS
SELECT 
    event_type,
    COUNT(*) as total_events,
    COUNT(CASE WHEN processed = true THEN 1 END) as processed_events,
    COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as failed_events,
    ROUND(
        (COUNT(CASE WHEN processed = true THEN 1 END)::DECIMAL / COUNT(*)) * 100, 
        2
    ) as success_rate,
    MAX(created_at) as last_event_date,
    MIN(created_at) as first_event_date
FROM stripe_webhook_events
GROUP BY event_type
ORDER BY total_events DESC;

-- View de receita por assinaturas
CREATE OR REPLACE VIEW subscription_revenue AS
SELECT 
    DATE_TRUNC('month', sh.created_at) as month,
    COUNT(CASE WHEN sh.event_type = 'created' THEN 1 END) as new_subscriptions,
    COUNT(CASE WHEN sh.event_type = 'canceled' THEN 1 END) as canceled_subscriptions,
    COUNT(CASE WHEN sh.event_type = 'renewed' THEN 1 END) as renewals,
    SUM(CASE WHEN sh.event_type IN ('created', 'renewed') THEN sh.amount_cents ELSE 0 END) / 100.0 as total_revenue,
    AVG(CASE WHEN sh.event_type IN ('created', 'renewed') THEN sh.amount_cents ELSE NULL END) / 100.0 as avg_revenue_per_subscription
FROM subscription_history sh
WHERE sh.amount_cents IS NOT NULL
GROUP BY DATE_TRUNC('month', sh.created_at)
ORDER BY month DESC;

-- View de usuários ativos por plano
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
    subscription_plan,
    subscription_status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN subscription_current_period_end > NOW() THEN 1 END) as active_users,
    MIN(subscription_current_period_start) as oldest_subscription,
    MAX(subscription_current_period_end) as latest_expiry
FROM users 
WHERE stripe_subscription_id IS NOT NULL
GROUP BY subscription_plan, subscription_status
ORDER BY subscription_plan, subscription_status;

-- ========================================
-- DADOS INICIAIS
-- ========================================

-- Inserir produtos/preços padrão do Stripe (exemplo)
INSERT INTO stripe_products (
    stripe_product_id, stripe_price_id, product_name, plan_type, 
    billing_interval, amount_cents, currency, description
) VALUES 
('prod_basic_monthly', 'price_basic_monthly', 'Plano Básico Mensal', 'MONTHLY', 'month', 2900, 'usd', 'Acesso básico ao MarketBot com sinais mensais'),
('prod_premium_monthly', 'price_premium_monthly', 'Plano Premium Mensal', 'MONTHLY_PREMIUM', 'month', 4900, 'usd', 'Acesso premium com sinais avançados e suporte prioritário'),
('prod_basic_annual', 'price_basic_annual', 'Plano Básico Anual', 'ANNUAL', 'year', 29900, 'usd', 'Plano básico anual com desconto'),
('prod_premium_annual', 'price_premium_annual', 'Plano Premium Anual', 'ANNUAL_PREMIUM', 'year', 49900, 'usd', 'Plano premium anual com desconto'),
('prod_credits_50', 'price_credits_50', 'Créditos $50', 'CREDIT_PURCHASE', NULL, 5000, 'usd', 'Compra de $50 em créditos para trading'),
('prod_credits_100', 'price_credits_100', 'Créditos $100', 'CREDIT_PURCHASE', NULL, 10000, 'usd', 'Compra de $100 em créditos para trading'),
('prod_credits_250', 'price_credits_250', 'Créditos $250', 'CREDIT_PURCHASE', NULL, 25000, 'usd', 'Compra de $250 em créditos para trading')
ON CONFLICT (stripe_price_id) DO UPDATE SET
    product_name = EXCLUDED.product_name,
    plan_type = EXCLUDED.plan_type,
    amount_cents = EXCLUDED.amount_cents,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Atualizar créditos para produtos de crédito
UPDATE stripe_products SET 
    credits_amount = amount_cents / 100.0
WHERE plan_type = 'CREDIT_PURCHASE';

-- ========================================
-- CONFIGURAÇÕES DO SISTEMA
-- ========================================

-- Inserir configurações relacionadas ao Stripe
INSERT INTO system_settings (key, value, description) VALUES
('stripe_webhook_secret', 'WEBHOOK_SECRET_NOT_SET', 'Secret para validação de webhooks do Stripe'),
('stripe_public_key', 'PUBLIC_KEY_NOT_SET', 'Chave pública do Stripe para frontend'),
('stripe_secret_key', 'SECRET_KEY_NOT_SET', 'Chave secreta do Stripe (criptografada)'),
('stripe_webhook_endpoint', '/api/webhooks/stripe', 'Endpoint para receber webhooks do Stripe'),
('stripe_success_url', 'https://app.marketbot.com/success', 'URL de sucesso após pagamento'),
('stripe_cancel_url', 'https://app.marketbot.com/cancel', 'URL de cancelamento'),
('subscription_trial_days', '7', 'Dias de trial para novas assinaturas'),
('subscription_grace_period_days', '3', 'Dias de tolerância após vencimento'),
('webhook_retry_attempts', '3', 'Tentativas de retry para webhooks falhados'),
('webhook_retention_days', '30', 'Dias para manter logs de webhooks processados')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description;

-- ========================================
-- PERMISSÕES E SEGURANÇA
-- ========================================

-- Revogar permissões públicas
REVOKE ALL ON stripe_webhook_events FROM PUBLIC;
REVOKE ALL ON stripe_products FROM PUBLIC;
REVOKE ALL ON subscription_history FROM PUBLIC;

-- Conceder permissões específicas
GRANT SELECT, INSERT, UPDATE ON stripe_webhook_events TO marketbot_backend;
GRANT SELECT ON stripe_products TO marketbot_backend;
GRANT SELECT, INSERT ON subscription_history TO marketbot_backend;
GRANT USAGE ON SEQUENCE stripe_webhook_events_id_seq TO marketbot_backend;
GRANT USAGE ON SEQUENCE stripe_products_id_seq TO marketbot_backend;
GRANT USAGE ON SEQUENCE subscription_history_id_seq TO marketbot_backend;

-- Permissões para views
GRANT SELECT ON webhook_stats TO marketbot_backend;
GRANT SELECT ON subscription_revenue TO marketbot_backend;
GRANT SELECT ON active_subscriptions TO marketbot_backend;

-- ========================================
-- JOBS DE MANUTENÇÃO (Para implementação futura)
-- ========================================

-- Criar função para job de limpeza semanal
CREATE OR REPLACE FUNCTION weekly_webhook_maintenance() RETURNS TEXT AS $$
DECLARE
    cleaned_webhooks INTEGER;
    cleaned_history INTEGER;
BEGIN
    -- Limpar webhooks antigos
    SELECT cleanup_old_webhook_events() INTO cleaned_webhooks;
    
    -- Limpar histórico de assinaturas muito antigo (mais de 1 ano)
    DELETE FROM subscription_history 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS cleaned_history = ROW_COUNT;
    
    RETURN FORMAT('Limpeza concluída: %s webhooks, %s histórico de assinaturas', 
                  cleaned_webhooks, cleaned_history);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE stripe_webhook_events IS 'Log de todos os eventos de webhook recebidos do Stripe';
COMMENT ON TABLE stripe_products IS 'Catálogo de produtos e preços sincronizados com o Stripe';
COMMENT ON TABLE subscription_history IS 'Histórico de mudanças em assinaturas para auditoria';

COMMENT ON COLUMN stripe_webhook_events.stripe_event_id IS 'ID único do evento no Stripe';
COMMENT ON COLUMN stripe_webhook_events.event_data IS 'Dados completos do evento em formato JSON';
COMMENT ON COLUMN stripe_webhook_events.processed IS 'Indica se o evento foi processado com sucesso';

COMMENT ON COLUMN users.stripe_customer_id IS 'ID do customer no Stripe';
COMMENT ON COLUMN users.stripe_subscription_id IS 'ID da assinatura ativa no Stripe';
COMMENT ON COLUMN users.subscription_status IS 'Status da assinatura: active, past_due, canceled, etc.';

-- Inserir log de migração
INSERT INTO migration_log (version, description, executed_at) 
VALUES ('010', 'Sistema completo de webhooks Stripe e integração de pagamentos', NOW());

-- ========================================
-- SUCESSO!
-- ========================================

SELECT 'Stripe webhooks system migration completed successfully!' as status;
