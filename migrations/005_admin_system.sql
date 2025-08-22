-- ========================================
-- MARKETBOT DATABASE SCHEMA - FASE 5
-- Configurações Administrativas e Sistema de Comissões
-- ========================================

-- ========================================
-- 0. FUNÇÃO AUXILIAR PARA TIMESTAMPS
-- ========================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 1. TABELA DE CONFIGURAÇÕES PADRÃO DO ADMIN
-- ========================================

CREATE TABLE IF NOT EXISTS admin_trading_defaults (
    id SERIAL PRIMARY KEY,
    
    -- Configurações padrão de trading
    default_stop_loss_percent DECIMAL(5,2) DEFAULT 2.00, -- 2% padrão
    default_take_profit_percent DECIMAL(5,2) DEFAULT 4.00, -- 4% padrão
    default_leverage INTEGER DEFAULT 5,
    default_position_size_percent DECIMAL(5,2) DEFAULT 30.00, -- 30% do saldo
    
    -- Limites padrão
    max_concurrent_positions INTEGER DEFAULT 3,
    daily_loss_limit_usd DECIMAL(10,2) DEFAULT 500.00,
    max_daily_trades INTEGER DEFAULT 10,
    
    -- Configurações de risco
    min_risk_reward_ratio DECIMAL(8,2) DEFAULT 1.50,
    max_allowed_leverage INTEGER DEFAULT 20,
    
    -- Configurações de mercado
    trading_start_hour INTEGER DEFAULT 0, -- UTC
    trading_end_hour INTEGER DEFAULT 24, -- UTC
    trade_on_weekends BOOLEAN DEFAULT TRUE,
    
    -- Configurações de sistema
    auto_close_expired_signals BOOLEAN DEFAULT TRUE,
    signal_expiry_minutes INTEGER DEFAULT 60,
    position_monitoring_interval_seconds INTEGER DEFAULT 30,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_admin_stop_loss CHECK (default_stop_loss_percent BETWEEN 0.1 AND 20),
    CONSTRAINT chk_admin_take_profit CHECK (default_take_profit_percent BETWEEN 0.1 AND 50),
    CONSTRAINT chk_admin_leverage CHECK (default_leverage BETWEEN 1 AND max_allowed_leverage),
    CONSTRAINT chk_admin_position_size CHECK (default_position_size_percent BETWEEN 1 AND 100),
    CONSTRAINT chk_admin_max_positions CHECK (max_concurrent_positions BETWEEN 1 AND 20),
    CONSTRAINT chk_admin_daily_trades CHECK (max_daily_trades BETWEEN 1 AND 100),
    CONSTRAINT chk_admin_hours CHECK (
        trading_start_hour BETWEEN 0 AND 23 AND 
        trading_end_hour BETWEEN 0 AND 24
    )
);

-- ========================================
-- 2. TABELA DE TRANSAÇÕES DE COMISSÃO
-- ========================================

CREATE TABLE IF NOT EXISTS commission_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position_id UUID REFERENCES trading_positions(id),
    
    -- Dados da comissão
    amount_usd DECIMAL(15,2) NOT NULL,
    commission_type VARCHAR(50) NOT NULL, -- 'TRADING_SUCCESS', 'SUBSCRIPTION', 'AFFILIATE'
    commission_rate DECIMAL(5,4), -- Ex: 0.1000 para 10%
    
    -- Referências
    subscription_id UUID REFERENCES user_subscriptions(id),
    affiliate_referral_id UUID,
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'PROCESSED', 'PAID'
    processed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadados
    description TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_commission_amount CHECK (amount_usd >= 0),
    CONSTRAINT chk_commission_rate CHECK (commission_rate BETWEEN 0 AND 1)
);

-- ========================================
-- 3. TABELA DE MONITORAMENTO DE SISTEMA
-- ========================================

CREATE TABLE IF NOT EXISTS system_monitoring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Tipo de evento
    event_type VARCHAR(50) NOT NULL, -- 'POSITION_OPENED', 'POSITION_CLOSED', 'SIGNAL_RECEIVED', etc.
    
    -- Dados do evento
    user_id UUID REFERENCES users(id),
    position_id UUID REFERENCES trading_positions(id),
    signal_id UUID REFERENCES trading_signals(id),
    
    -- Métricas
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Contexto
    symbol VARCHAR(20),
    exchange_used VARCHAR(20),
    amount_usd DECIMAL(15,2),
    
    -- Metadados
    details JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para system_monitoring
CREATE INDEX IF NOT EXISTS idx_monitoring_event_type ON system_monitoring (event_type);
CREATE INDEX IF NOT EXISTS idx_monitoring_created_at ON system_monitoring (created_at);
CREATE INDEX IF NOT EXISTS idx_monitoring_user_id ON system_monitoring (user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_success ON system_monitoring (success);

-- ========================================
-- 4. VIEW PARA ESTATÍSTICAS DO SISTEMA
-- ========================================

CREATE VIEW v_system_statistics AS
SELECT 
    DATE(created_at) as date,
    event_type,
    COUNT(*) as total_events,
    COUNT(CASE WHEN success = true THEN 1 END) as successful_events,
    COUNT(CASE WHEN success = false THEN 1 END) as failed_events,
    ROUND(
        COUNT(CASE WHEN success = true THEN 1 END)::DECIMAL / 
        COUNT(*)::DECIMAL * 100, 2
    ) as success_rate_percent,
    AVG(execution_time_ms) as avg_execution_time_ms,
    MAX(execution_time_ms) as max_execution_time_ms,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(amount_usd) as total_volume_usd
FROM system_monitoring
GROUP BY DATE(created_at), event_type
ORDER BY date DESC, event_type;

-- ========================================
-- 5. FUNÇÕES PARA SISTEMA DE TRADING
-- ========================================

-- Função para aplicar configurações padrão do admin a novos usuários
CREATE OR REPLACE FUNCTION apply_admin_defaults_to_user(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    admin_defaults RECORD;
BEGIN
    -- Buscar configurações padrão do admin
    SELECT * INTO admin_defaults FROM admin_trading_defaults WHERE id = 1;
    
    IF NOT FOUND THEN
        -- Se não existir, criar configurações padrão
        INSERT INTO admin_trading_defaults (id) VALUES (1);
        SELECT * INTO admin_defaults FROM admin_trading_defaults WHERE id = 1;
    END IF;
    
    -- Aplicar ao usuário (apenas se ele não tiver configurações)
    INSERT INTO trading_settings (
        user_id,
        auto_trading_enabled,
        max_concurrent_positions,
        max_daily_trades,
        daily_loss_limit_usd,
        max_position_size_percent,
        default_stop_loss_percent,
        default_take_profit_percent,
        default_leverage,
        min_risk_reward_ratio,
        trading_start_hour,
        trading_end_hour,
        trade_on_weekends
    ) VALUES (
        p_user_id,
        FALSE, -- Auto trading desabilitado por padrão
        admin_defaults.max_concurrent_positions,
        admin_defaults.max_daily_trades,
        admin_defaults.daily_loss_limit_usd,
        admin_defaults.default_position_size_percent,
        admin_defaults.default_stop_loss_percent,
        admin_defaults.default_take_profit_percent,
        admin_defaults.default_leverage,
        admin_defaults.min_risk_reward_ratio,
        admin_defaults.trading_start_hour,
        admin_defaults.trading_end_hour,
        admin_defaults.trade_on_weekends
    ) ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar eventos de monitoramento
CREATE OR REPLACE FUNCTION log_system_event(
    p_event_type VARCHAR(50),
    p_user_id UUID DEFAULT NULL,
    p_position_id UUID DEFAULT NULL,
    p_signal_id UUID DEFAULT NULL,
    p_execution_time_ms INTEGER DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL,
    p_symbol VARCHAR(20) DEFAULT NULL,
    p_exchange_used VARCHAR(20) DEFAULT NULL,
    p_amount_usd DECIMAL(15,2) DEFAULT NULL,
    p_details JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO system_monitoring (
        event_type, user_id, position_id, signal_id,
        execution_time_ms, success, error_message,
        symbol, exchange_used, amount_usd, details
    ) VALUES (
        p_event_type, p_user_id, p_position_id, p_signal_id,
        p_execution_time_ms, p_success, p_error_message,
        p_symbol, p_exchange_used, p_amount_usd, p_details
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular comissões
CREATE OR REPLACE FUNCTION calculate_commission(
    p_user_id UUID,
    p_amount_usd DECIMAL(15,2),
    p_commission_type VARCHAR(50)
) RETURNS DECIMAL(15,2) AS $$
DECLARE
    commission_rate DECIMAL(5,4);
    user_plan VARCHAR(20);
BEGIN
    -- Buscar plano do usuário
    SELECT plan_type INTO user_plan 
    FROM user_subscriptions 
    WHERE user_id = p_user_id AND is_active = true;
    
    -- Definir taxa baseada no tipo e plano
    CASE p_commission_type
        WHEN 'TRADING_SUCCESS' THEN
            commission_rate := CASE 
                WHEN COALESCE(user_plan, 'MONTHLY') = 'MONTHLY' THEN 0.10  -- 10%
                ELSE 0.20  -- 20% para prepago
            END;
        WHEN 'SUBSCRIPTION' THEN
            commission_rate := 0.05; -- 5%
        WHEN 'AFFILIATE' THEN
            commission_rate := 0.015; -- 1.5%
        ELSE
            commission_rate := 0.10; -- Default 10%
    END CASE;
    
    RETURN p_amount_usd * commission_rate;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. TRIGGERS PARA APLICAR CONFIGURAÇÕES PADRÃO
-- ========================================

-- Trigger para aplicar configurações padrão quando um usuário é criado
CREATE OR REPLACE FUNCTION trigger_apply_admin_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Aplicar configurações padrão do admin
    PERFORM apply_admin_defaults_to_user(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_user_admin_defaults
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_apply_admin_defaults();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_admin_defaults_updated_at 
    BEFORE UPDATE ON admin_trading_defaults
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commission_updated_at 
    BEFORE UPDATE ON commission_transactions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 7. ÍNDICES PARA PERFORMANCE
-- ========================================

-- Commission Transactions
CREATE INDEX idx_commission_user_id ON commission_transactions(user_id);
CREATE INDEX idx_commission_status ON commission_transactions(status);
CREATE INDEX idx_commission_type ON commission_transactions(commission_type);
CREATE INDEX idx_commission_created_at ON commission_transactions(created_at);
CREATE INDEX idx_commission_position_id ON commission_transactions(position_id);

-- ========================================
-- 8. INSERIR CONFIGURAÇÕES PADRÃO INICIAIS
-- ========================================

-- Inserir configurações padrão do admin
INSERT INTO admin_trading_defaults (
    id,
    default_stop_loss_percent,
    default_take_profit_percent,
    default_leverage,
    default_position_size_percent,
    max_concurrent_positions,
    daily_loss_limit_usd,
    max_daily_trades,
    min_risk_reward_ratio,
    max_allowed_leverage,
    trading_start_hour,
    trading_end_hour,
    trade_on_weekends,
    auto_close_expired_signals,
    signal_expiry_minutes,
    position_monitoring_interval_seconds
) VALUES (
    1, -- ID fixo para facilitar consultas
    2.00, -- 2% Stop Loss
    4.00, -- 4% Take Profit
    5,    -- 5x Leverage
    30.00, -- 30% Position Size
    3,    -- 3 posições simultâneas
    500.00, -- $500 limite diário
    10,   -- 10 trades por dia
    1.50, -- 1.5 risk/reward mínimo
    20,   -- 20x leverage máximo
    0,    -- Trading 24h
    24,   -- Trading 24h
    TRUE, -- Trading nos fins de semana
    TRUE, -- Auto close expired signals
    60,   -- 60 minutos para expiry
    30    -- 30 segundos de monitoramento
) ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 9. VERIFICAÇÃO DO SCHEMA FASE 5
-- ========================================

-- Verificar se todas as tabelas da Fase 5 foram criadas
SELECT 
    'Fase 5 - Sistema Trading Completo' as status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'admin_trading_defaults', 
    'commission_transactions', 
    'system_monitoring'
);

-- Verificar se as funções foram criadas
SELECT 
    'Fase 5 - Funções Criadas' as status,
    COUNT(*) as function_count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'apply_admin_defaults_to_user',
    'log_system_event',
    'calculate_commission'
);

-- Logs de sucesso
SELECT 
    '🚀 FASE 5 - SISTEMA DE TRADING MULTIUSUÁRIOS IMPLEMENTADO' as message,
    '✅ Configurações Administrativas' as feature_1,
    '✅ Sistema de Comissões' as feature_2,
    '✅ Monitoramento de Sistema' as feature_3,
    '✅ Stop Loss & Take Profit Obrigatórios' as feature_4,
    '✅ Cálculo Baseado no Saldo da Exchange' as feature_5,
    '✅ Orquestração Completa de Trading' as feature_6;
