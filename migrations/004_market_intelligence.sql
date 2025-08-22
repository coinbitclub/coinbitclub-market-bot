-- ========================================
-- MARKETBOT - MIGRATION 004 - MARKET INTELLIGENCE
-- Sistema de Inteligência de Mercado
-- Fase 4: Market Data + IA + Cache
-- ========================================

-- Tabela para armazenar dados históricos do Fear & Greed Index
CREATE TABLE market_fear_greed_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value INTEGER NOT NULL CHECK (value >= 0 AND value <= 100),
    classification VARCHAR(20) NOT NULL,
    source VARCHAR(50) NOT NULL,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar dados históricos do Market Pulse
CREATE TABLE market_pulse_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_coins INTEGER NOT NULL,
    positive_coins INTEGER NOT NULL,
    negative_coins INTEGER NOT NULL,
    neutral_coins INTEGER NOT NULL,
    positive_percentage DECIMAL(5,2) NOT NULL,
    negative_percentage DECIMAL(5,2) NOT NULL,
    volume_weighted_delta DECIMAL(8,4) NOT NULL,
    trend VARCHAR(10) NOT NULL CHECK (trend IN ('BULLISH', 'BEARISH', 'NEUTRAL')),
    top_gainers JSONB,
    top_losers JSONB,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar dados históricos de BTC Dominance
CREATE TABLE market_btc_dominance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dominance DECIMAL(5,2) NOT NULL CHECK (dominance >= 0 AND dominance <= 100),
    trend VARCHAR(10) NOT NULL CHECK (trend IN ('RISING', 'FALLING', 'STABLE')),
    recommendation VARCHAR(20) NOT NULL CHECK (recommendation IN ('LONG_ALTCOINS', 'SHORT_ALTCOINS', 'NEUTRAL')),
    source VARCHAR(50) NOT NULL,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar decisões de mercado
CREATE TABLE market_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allow_long BOOLEAN NOT NULL,
    allow_short BOOLEAN NOT NULL,
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    reasons TEXT[] NOT NULL,
    fear_greed_influence TEXT NOT NULL,
    market_pulse_influence TEXT NOT NULL,
    btc_dominance_influence TEXT NOT NULL,
    ai_analysis TEXT,
    ai_confidence INTEGER CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
    decision_source VARCHAR(20) NOT NULL DEFAULT 'ALGORITHMIC' CHECK (decision_source IN ('ALGORITHMIC', 'AI_HYBRID', 'MANUAL')),
    market_context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar análises de IA
CREATE TABLE market_ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('LONG_ONLY', 'SHORT_ONLY', 'BOTH', 'NONE')),
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    reasoning TEXT NOT NULL,
    risk_level VARCHAR(10) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    recommended_position_size DECIMAL(3,2) CHECK (recommended_position_size >= 0.1 AND recommended_position_size <= 1.0),
    timeframe VARCHAR(50),
    model_used VARCHAR(50) NOT NULL,
    tokens_used INTEGER,
    cost_usd DECIMAL(8,6),
    input_data JSONB NOT NULL,
    raw_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para configurações de mercado (editável pelo admin)
CREATE TABLE market_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fear_greed_extreme_fear INTEGER NOT NULL DEFAULT 30 CHECK (fear_greed_extreme_fear >= 0 AND fear_greed_extreme_fear <= 100),
    fear_greed_extreme_greed INTEGER NOT NULL DEFAULT 80 CHECK (fear_greed_extreme_greed >= 0 AND fear_greed_extreme_greed <= 100),
    market_pulse_bullish_positive DECIMAL(5,2) NOT NULL DEFAULT 60.00 CHECK (market_pulse_bullish_positive >= 0 AND market_pulse_bullish_positive <= 100),
    market_pulse_bearish_negative DECIMAL(5,2) NOT NULL DEFAULT 60.00 CHECK (market_pulse_bearish_negative >= 0 AND market_pulse_bearish_negative <= 100),
    market_pulse_volume_delta_positive DECIMAL(5,2) NOT NULL DEFAULT 0.50,
    market_pulse_volume_delta_negative DECIMAL(5,2) NOT NULL DEFAULT -0.50,
    btc_dominance_high DECIMAL(5,2) NOT NULL DEFAULT 50.00 CHECK (btc_dominance_high >= 0 AND btc_dominance_high <= 100),
    btc_dominance_low DECIMAL(5,2) NOT NULL DEFAULT 45.00 CHECK (btc_dominance_low >= 0 AND btc_dominance_low <= 100),
    ai_enabled BOOLEAN NOT NULL DEFAULT true,
    ai_model VARCHAR(50) NOT NULL DEFAULT 'gpt-4',
    ai_max_tokens INTEGER NOT NULL DEFAULT 1000 CHECK (ai_max_tokens > 0),
    ai_temperature DECIMAL(3,2) NOT NULL DEFAULT 0.30 CHECK (ai_temperature >= 0 AND ai_temperature <= 2),
    ai_fallback_to_algorithmic BOOLEAN NOT NULL DEFAULT true,
    fear_greed_cache_minutes INTEGER NOT NULL DEFAULT 5 CHECK (fear_greed_cache_minutes > 0),
    market_pulse_cache_minutes INTEGER NOT NULL DEFAULT 2 CHECK (market_pulse_cache_minutes > 0),
    btc_dominance_cache_minutes INTEGER NOT NULL DEFAULT 10 CHECK (btc_dominance_cache_minutes > 0),
    binance_data_cache_minutes INTEGER NOT NULL DEFAULT 1 CHECK (binance_data_cache_minutes > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO market_configurations (id, is_active) VALUES (gen_random_uuid(), true);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para consultas temporais
CREATE INDEX idx_fear_greed_created_at ON market_fear_greed_history(created_at DESC);
CREATE INDEX idx_market_pulse_created_at ON market_pulse_history(created_at DESC);
CREATE INDEX idx_btc_dominance_created_at ON market_btc_dominance_history(created_at DESC);
CREATE INDEX idx_market_decisions_created_at ON market_decisions(created_at DESC);
CREATE INDEX idx_ai_analyses_created_at ON market_ai_analyses(created_at DESC);

-- Índices para consultas por valor
CREATE INDEX idx_fear_greed_value ON market_fear_greed_history(value);
CREATE INDEX idx_market_pulse_trend ON market_pulse_history(trend);
CREATE INDEX idx_btc_dominance_value ON market_btc_dominance_history(dominance);

-- Índices para decisões
CREATE INDEX idx_market_decisions_confidence ON market_decisions(confidence DESC);
CREATE INDEX idx_market_decisions_allow_long ON market_decisions(allow_long);
CREATE INDEX idx_market_decisions_allow_short ON market_decisions(allow_short);

-- Índices para IA
CREATE INDEX idx_ai_analyses_decision ON market_ai_analyses(decision);
CREATE INDEX idx_ai_analyses_confidence ON market_ai_analyses(confidence DESC);
CREATE INDEX idx_ai_analyses_model ON market_ai_analyses(model_used);

-- Índice para configuração ativa
CREATE INDEX idx_market_config_active ON market_configurations(is_active) WHERE is_active = true;

-- ========================================
-- TRIGGERS PARA AUDITORIA
-- ========================================

-- Trigger para auditoria na atualização de configurações
CREATE OR REPLACE FUNCTION audit_market_config_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_by,
        ip_address,
        user_agent
    ) VALUES (
        'market_configurations',
        NEW.id,
        'UPDATE',
        to_jsonb(OLD),
        to_jsonb(NEW),
        NEW.updated_by,
        current_setting('app.current_ip', true),
        current_setting('app.current_user_agent', true)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_market_config_changes
    AFTER UPDATE ON market_configurations
    FOR EACH ROW
    EXECUTE FUNCTION audit_market_config_changes();

-- ========================================
-- FUNÇÕES UTILITÁRIAS
-- ========================================

-- Função para obter configuração ativa
CREATE OR REPLACE FUNCTION get_active_market_config()
RETURNS market_configurations AS $$
DECLARE
    config market_configurations;
BEGIN
    SELECT * INTO config 
    FROM market_configurations 
    WHERE is_active = true 
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Nenhuma configuração de mercado ativa encontrada';
    END IF;
    
    RETURN config;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar dados históricos antigos (manutenção)
CREATE OR REPLACE FUNCTION cleanup_old_market_data(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    total_rows_deleted INTEGER := 0;
    cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    cutoff_date := NOW() - INTERVAL '1 day' * days_to_keep;
    
    -- Limpar Fear & Greed antigo
    WITH deleted AS (
        DELETE FROM market_fear_greed_history WHERE created_at < cutoff_date RETURNING 1
    )
    SELECT COUNT(*) INTO total_rows_deleted FROM deleted;
    
    -- Limpar Market Pulse antigo
    WITH deleted AS (
        DELETE FROM market_pulse_history WHERE created_at < cutoff_date RETURNING 1
    )
    SELECT total_rows_deleted + COUNT(*) INTO total_rows_deleted FROM deleted;
    
    -- Limpar BTC Dominance antigo
    WITH deleted AS (
        DELETE FROM market_btc_dominance_history WHERE created_at < cutoff_date RETURNING 1
    )
    SELECT total_rows_deleted + COUNT(*) INTO total_rows_deleted FROM deleted;
    
    -- Limpar decisões antigas (manter mais tempo)
    WITH deleted AS (
        DELETE FROM market_decisions WHERE created_at < (cutoff_date - INTERVAL '30 days') RETURNING 1
    )
    SELECT total_rows_deleted + COUNT(*) INTO total_rows_deleted FROM deleted;
    
    -- Limpar análises de IA antigas
    WITH deleted AS (
        DELETE FROM market_ai_analyses WHERE created_at < cutoff_date RETURNING 1
    )
    SELECT total_rows_deleted + COUNT(*) INTO total_rows_deleted FROM deleted;
    
    RETURN total_rows_deleted;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VIEWS PARA RELATÓRIOS
-- ========================================

-- View para últimas métricas de mercado
CREATE VIEW latest_market_metrics AS
SELECT 
    fg.value as fear_greed_value,
    fg.classification as fear_greed_classification,
    mp.trend as market_pulse_trend,
    mp.positive_percentage as market_pulse_positive_pct,
    mp.volume_weighted_delta as market_pulse_volume_delta,
    btc.dominance as btc_dominance,
    btc.trend as btc_dominance_trend,
    btc.recommendation as btc_recommendation,
    md.allow_long as decision_allow_long,
    md.allow_short as decision_allow_short,
    md.confidence as decision_confidence,
    md.ai_analysis as decision_ai_analysis,
    GREATEST(fg.created_at, mp.created_at, btc.created_at) as last_updated
FROM 
    (SELECT * FROM market_fear_greed_history ORDER BY created_at DESC LIMIT 1) fg
CROSS JOIN 
    (SELECT * FROM market_pulse_history ORDER BY created_at DESC LIMIT 1) mp
CROSS JOIN 
    (SELECT * FROM market_btc_dominance_history ORDER BY created_at DESC LIMIT 1) btc
CROSS JOIN 
    (SELECT * FROM market_decisions ORDER BY created_at DESC LIMIT 1) md;

-- View para estatísticas de IA
CREATE VIEW ai_analysis_stats AS
SELECT 
    model_used,
    COUNT(*) as total_analyses,
    AVG(confidence) as avg_confidence,
    SUM(tokens_used) as total_tokens,
    SUM(cost_usd) as total_cost_usd,
    COUNT(*) FILTER (WHERE decision = 'LONG_ONLY') as long_only_count,
    COUNT(*) FILTER (WHERE decision = 'SHORT_ONLY') as short_only_count,
    COUNT(*) FILTER (WHERE decision = 'BOTH') as both_count,
    COUNT(*) FILTER (WHERE decision = 'NONE') as none_count,
    DATE_TRUNC('day', created_at) as analysis_date
FROM market_ai_analyses
GROUP BY model_used, DATE_TRUNC('day', created_at)
ORDER BY analysis_date DESC;

-- ========================================
-- FIM DA MIGRAÇÃO 004
-- ========================================
