-- ========================================
-- MIGRAÇÃO 002: TABELAS VOLATILITY DETECTION
-- CoinbitClub Volatility Detection System
-- ========================================

-- Tabela de dados de volatilidade
CREATE TABLE IF NOT EXISTS volatility_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    volatility_value DECIMAL(10,6) NOT NULL,
    price DECIMAL(18,8) NOT NULL,
    volume DECIMAL(20,8),
    market_cap DECIMAL(20,2),
    risk_level VARCHAR(20) NOT NULL,
    trend_direction VARCHAR(10),
    volatility_type VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de padrões detectados
CREATE TABLE IF NOT EXISTS volatility_patterns (
    id SERIAL PRIMARY KEY,
    pattern_name VARCHAR(100) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    pattern_data JSONB NOT NULL,
    confidence_score DECIMAL(5,2) NOT NULL,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    validation_result VARCHAR(20)
);

-- Tabela de alertas de volatilidade
CREATE TABLE IF NOT EXISTS volatility_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    threshold_value DECIMAL(10,6) NOT NULL,
    current_value DECIMAL(10,6) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    alert_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- Tabela de configurações de volatilidade
CREATE TABLE IF NOT EXISTS volatility_settings (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    high_threshold DECIMAL(10,6) NOT NULL,
    medium_threshold DECIMAL(10,6) NOT NULL,
    low_threshold DECIMAL(10,6) NOT NULL,
    monitoring_enabled BOOLEAN DEFAULT true,
    alert_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);

-- Tabela de histórico de análises
CREATE TABLE IF NOT EXISTS volatility_analysis_history (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(100) UNIQUE NOT NULL,
    symbols_analyzed JSONB NOT NULL,
    analysis_result JSONB NOT NULL,
    execution_time INTEGER NOT NULL,
    patterns_found INTEGER DEFAULT 0,
    alerts_generated INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_volatility_symbol_time ON volatility_data(symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_volatility_risk_level ON volatility_data(risk_level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_volatility_patterns_symbol ON volatility_patterns(symbol, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_volatility_patterns_confidence ON volatility_patterns(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_volatility_alerts_symbol_status ON volatility_alerts(symbol, status);
CREATE INDEX IF NOT EXISTS idx_volatility_alerts_risk_created ON volatility_alerts(risk_level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_volatility_settings_symbol ON volatility_settings(symbol);
CREATE INDEX IF NOT EXISTS idx_volatility_analysis_created ON volatility_analysis_history(created_at DESC);

-- Índices compostos para consultas específicas
CREATE INDEX IF NOT EXISTS idx_volatility_symbol_timeframe ON volatility_data(symbol, timeframe, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_volatility_patterns_active ON volatility_patterns(status, expires_at) WHERE status = 'ACTIVE';

-- Comentários das tabelas
COMMENT ON TABLE volatility_data IS 'Dados de volatilidade coletados em tempo real';
COMMENT ON TABLE volatility_patterns IS 'Padrões de volatilidade detectados pelo sistema';
COMMENT ON TABLE volatility_alerts IS 'Alertas gerados pelo sistema de detecção de volatilidade';
COMMENT ON TABLE volatility_settings IS 'Configurações de monitoramento de volatilidade por símbolo';
COMMENT ON TABLE volatility_analysis_history IS 'Histórico de análises de volatilidade executadas';

-- Comentários das colunas principais
COMMENT ON COLUMN volatility_data.volatility_value IS 'Valor da volatilidade calculada (0.0 a 1.0)';
COMMENT ON COLUMN volatility_data.risk_level IS 'Nível de risco: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN volatility_patterns.confidence_score IS 'Score de confiança do padrão (0.0 a 100.0)';
COMMENT ON COLUMN volatility_alerts.threshold_value IS 'Valor do threshold que foi ultrapassado';
COMMENT ON COLUMN volatility_analysis_history.execution_time IS 'Tempo de execução da análise em milissegundos';
