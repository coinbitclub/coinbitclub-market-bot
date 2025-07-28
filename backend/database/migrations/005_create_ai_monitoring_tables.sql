-- 🗄️ ESTRUTURA DE DADOS - IA MONITORING COINBITCLUB
-- Tabelas conforme Seção 5 da especificação técnica
-- Data: 28/07/2025

-- Seção 5.1: Tabela system_events
CREATE TABLE IF NOT EXISTS system_events (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_type VARCHAR(50) NOT NULL,
    microservice VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    context JSONB,
    source_ip INET,
    status VARCHAR(20) DEFAULT 'pending',
    result JSONB,
    ia_involved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seção 5.2: Tabela ai_decisions  
CREATE TABLE IF NOT EXISTS ai_decisions (
    id BIGSERIAL PRIMARY KEY,
    decision_id VARCHAR(100) UNIQUE NOT NULL,
    market_data JSONB NOT NULL,
    active_positions JSONB,
    decision_taken VARCHAR(100) NOT NULL,
    justification TEXT NOT NULL,
    confidence_score DECIMAL(3,2),
    execution_time_ms INTEGER,
    result_status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seção 5.3: Tabela cache_responses
CREATE TABLE IF NOT EXISTS cache_responses (
    id BIGSERIAL PRIMARY KEY,
    event_signature VARCHAR(255) UNIQUE NOT NULL,
    response_data JSONB NOT NULL,
    hit_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabela adicional para métricas de performance da IA
CREATE TABLE IF NOT EXISTS ai_metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    requests_per_hour INTEGER DEFAULT 0,
    cache_hit_rate DECIMAL(5,2) DEFAULT 0.0,
    avg_response_time_ms INTEGER DEFAULT 0,
    cost_reduction_percentage DECIMAL(5,2) DEFAULT 0.0,
    successful_actions INTEGER DEFAULT 0,
    failed_actions INTEGER DEFAULT 0,
    prevented_losses_usd DECIMAL(12,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para configurações da IA
CREATE TABLE IF NOT EXISTS ai_config (
    id BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance conforme especificação
CREATE INDEX IF NOT EXISTS idx_system_events_timestamp ON system_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_microservice ON system_events(microservice);
CREATE INDEX IF NOT EXISTS idx_system_events_status ON system_events(status);
CREATE INDEX IF NOT EXISTS idx_system_events_ia_involved ON system_events(ia_involved);

CREATE INDEX IF NOT EXISTS idx_ai_decisions_decision_id ON ai_decisions(decision_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_created_at ON ai_decisions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_decision_taken ON ai_decisions(decision_taken);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_confidence ON ai_decisions(confidence_score);

CREATE INDEX IF NOT EXISTS idx_cache_responses_signature ON cache_responses(event_signature);
CREATE INDEX IF NOT EXISTS idx_cache_responses_expires_at ON cache_responses(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_responses_hit_count ON cache_responses(hit_count);

CREATE INDEX IF NOT EXISTS idx_ai_metrics_date ON ai_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_ai_config_key ON ai_config(config_key);
CREATE INDEX IF NOT EXISTS idx_ai_config_active ON ai_config(is_active);

-- Inserir configurações padrão da IA conforme especificação
INSERT INTO ai_config (config_key, config_value, description) VALUES
('openai_model', '"gpt-3.5-turbo"', 'Modelo OpenAI a ser utilizado'),
('openai_max_tokens', '150', 'Máximo de tokens por resposta'),
('openai_temperature', '0.3', 'Temperatura para geração de respostas'),
('batch_size', '10', 'Tamanho do batch para processamento de eventos'),
('batch_timeout_ms', '300000', 'Timeout do batch em milissegundos (5 min)'),
('cache_timeout_ms', '300000', 'Timeout do cache em milissegundos (5 min)'),
('volatility_threshold', '0.03', 'Threshold de volatilidade (3%)'),
('volume_spike_threshold', '1.5', 'Threshold para spike de volume (50% acima da média)'),
('response_time_threshold_ms', '2000', 'Threshold de tempo de resposta (2s)'),
('consecutive_failures_threshold', '3', 'Threshold de falhas consecutivas'),
('memory_usage_threshold', '80', 'Threshold de uso de memória (80%)'),
('fear_greed_extreme_fear', '20', 'Índice de medo extremo'),
('fear_greed_extreme_greed', '80', 'Índice de ganância extrema'),
('order_timeout_ms', '120000', 'Timeout para execução de ordens (2 min)'),
('pause_duration_default_ms', '600000', 'Duração padrão de pausa de ordens (10 min)')
ON CONFLICT (config_key) DO NOTHING;

-- Views para facilitar consultas

-- View para métricas de performance da IA
CREATE OR REPLACE VIEW ai_performance_summary AS
SELECT 
    DATE_TRUNC('day', timestamp) as date,
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE ia_involved = true) as ai_events,
    COUNT(*) FILTER (WHERE status = 'success') as successful_events,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_events,
    ROUND((COUNT(*) FILTER (WHERE status = 'success')::numeric / COUNT(*) * 100), 2) as success_rate,
    COUNT(DISTINCT microservice) as active_microservices
FROM system_events 
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY date DESC;

-- View para decisões recentes da IA
CREATE OR REPLACE VIEW recent_ai_decisions AS
SELECT 
    decision_id,
    decision_taken,
    justification,
    confidence_score,
    execution_time_ms,
    result_status,
    market_data->>'priceChange5min' as price_movement,
    market_data->>'volume' as volume,
    created_at
FROM ai_decisions 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;

-- View para cache performance
CREATE OR REPLACE VIEW cache_performance AS
SELECT 
    COUNT(*) as total_cached_responses,
    SUM(hit_count) as total_hits,
    ROUND(AVG(hit_count), 2) as avg_hits_per_response,
    COUNT(*) FILTER (WHERE expires_at > NOW()) as active_cache_entries,
    COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_cache_entries
FROM cache_responses;

-- View para eventos críticos recentes
CREATE OR REPLACE VIEW critical_events_today AS
SELECT 
    timestamp,
    event_type,
    microservice,
    action,
    status,
    ia_involved,
    context
FROM system_events 
WHERE timestamp >= CURRENT_DATE 
  AND (
    event_type IN ('service_failure', 'webhook_fail', 'trading_operation_timeout') 
    OR status = 'failed'
    OR context->>'severity' IN ('critical', 'high')
  )
ORDER BY timestamp DESC;

-- Trigger para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_events_updated_at 
    BEFORE UPDATE ON system_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_metrics_updated_at 
    BEFORE UPDATE ON ai_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_config_updated_at 
    BEFORE UPDATE ON ai_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar cache expirado automaticamente
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cache_responses WHERE expires_at <= NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO system_events (event_type, action, context, status)
    VALUES ('cache_cleanup', 'expired_entries_removed', 
            jsonb_build_object('deleted_count', deleted_count),
            'completed');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular métricas diárias da IA
CREATE OR REPLACE FUNCTION calculate_daily_ai_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
    daily_requests INTEGER;
    daily_cache_hits INTEGER;
    daily_total_requests INTEGER;
    daily_cache_rate DECIMAL(5,2);
    daily_successful_actions INTEGER;
    daily_failed_actions INTEGER;
BEGIN
    -- Calcular métricas do dia
    SELECT 
        COUNT(*) FILTER (WHERE ia_involved = true),
        COUNT(*) FILTER (WHERE ia_involved = true AND status = 'success'),
        COUNT(*) FILTER (WHERE ia_involved = true AND status = 'failed')
    INTO daily_requests, daily_successful_actions, daily_failed_actions
    FROM system_events 
    WHERE DATE(timestamp) = target_date;
    
    -- Calcular cache hit rate
    SELECT 
        COALESCE(SUM(hit_count), 0),
        COALESCE(COUNT(*), 0)
    INTO daily_cache_hits, daily_total_requests
    FROM cache_responses 
    WHERE DATE(created_at) = target_date;
    
    daily_cache_rate := CASE 
        WHEN daily_total_requests > 0 THEN (daily_cache_hits::numeric / daily_total_requests * 100)
        ELSE 0
    END;
    
    -- Inserir ou atualizar métricas diárias
    INSERT INTO ai_metrics (
        metric_date, 
        requests_per_hour, 
        cache_hit_rate,
        successful_actions,
        failed_actions
    ) VALUES (
        target_date,
        ROUND(daily_requests / 24.0),
        daily_cache_rate,
        daily_successful_actions,
        daily_failed_actions
    )
    ON CONFLICT (metric_date) DO UPDATE SET
        requests_per_hour = EXCLUDED.requests_per_hour,
        cache_hit_rate = EXCLUDED.cache_hit_rate,
        successful_actions = EXCLUDED.successful_actions,
        failed_actions = EXCLUDED.failed_actions,
        updated_at = NOW();
        
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE system_events IS 'Eventos do sistema conforme Seção 5.1 da especificação IA Monitoring';
COMMENT ON TABLE ai_decisions IS 'Decisões tomadas pela IA conforme Seção 5.2 da especificação';
COMMENT ON TABLE cache_responses IS 'Cache de respostas da IA conforme Seção 5.3 da especificação';
COMMENT ON TABLE ai_metrics IS 'Métricas de performance da IA agregadas por dia';
COMMENT ON TABLE ai_config IS 'Configurações da IA que podem ser alteradas dinamicamente';

COMMENT ON COLUMN system_events.ia_involved IS 'Indica se a IA esteve envolvida na geração/resolução do evento';
COMMENT ON COLUMN ai_decisions.confidence_score IS 'Score de confiança da decisão (0.0 - 1.0)';
COMMENT ON COLUMN cache_responses.hit_count IS 'Quantas vezes esta resposta foi utilizada do cache';

-- Grants de permissão (ajustar conforme necessário)
-- GRANT SELECT, INSERT, UPDATE ON system_events TO ai_monitoring_user;
-- GRANT SELECT, INSERT, UPDATE ON ai_decisions TO ai_monitoring_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON cache_responses TO ai_monitoring_user;

COMMIT;
