-- ========================================
-- MIGRAÇÃO 001: TABELAS IA MONITORING
-- CoinbitClub IA Monitoring System
-- ========================================

-- Tabela principal de monitoramento IA
CREATE TABLE IF NOT EXISTS ai_monitoring_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    source_service VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    severity VARCHAR(20) DEFAULT 'INFO',
    status VARCHAR(20) DEFAULT 'PENDING',
    processing_time INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    error_message TEXT
);

-- Tabela de alertas IA
CREATE TABLE IF NOT EXISTS ai_monitoring_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    source_service VARCHAR(100) NOT NULL,
    metadata JSONB,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(100)
);

-- Tabela de métricas IA
CREATE TABLE IF NOT EXISTS ai_monitoring_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    service_name VARCHAR(100) NOT NULL,
    tags JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de cache de respostas IA
CREATE TABLE IF NOT EXISTS ai_response_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    response_data JSONB NOT NULL,
    expiry_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_events_type_created ON ai_monitoring_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_source_status ON ai_monitoring_events(source_service, status);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_severity_status ON ai_monitoring_alerts(severity, status);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_created ON ai_monitoring_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_service_timestamp ON ai_monitoring_metrics(service_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_response_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expiry ON ai_response_cache(expiry_time);

-- Comentários das tabelas
COMMENT ON TABLE ai_monitoring_events IS 'Eventos de monitoramento do sistema IA';
COMMENT ON TABLE ai_monitoring_alerts IS 'Alertas gerados pelo sistema de monitoramento IA';
COMMENT ON TABLE ai_monitoring_metrics IS 'Métricas coletadas do sistema IA';
COMMENT ON TABLE ai_response_cache IS 'Cache de respostas da IA para otimização';

-- Comentários das colunas principais
COMMENT ON COLUMN ai_monitoring_events.event_data IS 'Dados do evento em formato JSON';
COMMENT ON COLUMN ai_monitoring_events.processing_time IS 'Tempo de processamento em milissegundos';
COMMENT ON COLUMN ai_monitoring_alerts.metadata IS 'Metadados adicionais do alerta em JSON';
COMMENT ON COLUMN ai_monitoring_metrics.tags IS 'Tags adicionais da métrica em JSON';
COMMENT ON COLUMN ai_response_cache.hit_count IS 'Número de vezes que o cache foi acessado';
