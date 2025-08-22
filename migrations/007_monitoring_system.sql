-- ========================================
-- MARKETBOT - REAL-TIME MONITORING SYSTEM
-- Migration para sistema de monitoramento 24/7
-- FASE 6 - Monitoramento crítico para produção
-- ========================================

-- ========================================
-- TABELA DE MÉTRICAS DO SISTEMA
-- ========================================

CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  server_data JSONB NOT NULL, -- Métricas do servidor (uptime, memory, cpu, etc.)
  database_data JSONB NOT NULL, -- Métricas do banco (latency, connections, etc.)
  trading_data JSONB NOT NULL, -- Métricas de trading (positions, users, pnl, etc.)
  external_data JSONB NOT NULL, -- Métricas de APIs externas (binance, bybit, openai, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_metrics_created_at ON system_metrics(created_at);

-- ========================================
-- TABELA DE ALERTAS DO SISTEMA
-- ========================================

CREATE TABLE IF NOT EXISTS system_alerts (
  id VARCHAR(255) PRIMARY KEY,
  level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warning', 'critical', 'emergency')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('system', 'trading', 'database', 'external', 'security')),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT false,
  acknowledged_by VARCHAR(255),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_system_alerts_timestamp ON system_alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_alerts_level ON system_alerts(level);
CREATE INDEX IF NOT EXISTS idx_system_alerts_category ON system_alerts(category);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at);

-- ========================================
-- TABELA DE STATUS DE COMPONENTES
-- ========================================

CREATE TABLE IF NOT EXISTS component_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name VARCHAR(100) NOT NULL UNIQUE, -- 'server', 'database', 'trading', 'external'
  status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'warning', 'critical', 'down')),
  last_check TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  details JSONB DEFAULT '{}',
  uptime_percentage DECIMAL(5,2) DEFAULT 100.00, -- Últimas 24h
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_component_status_name ON component_status(component_name);
CREATE INDEX IF NOT EXISTS idx_component_status_status ON component_status(status);
CREATE INDEX IF NOT EXISTS idx_component_status_updated ON component_status(updated_at);

-- ========================================
-- TABELA DE CONFIGURAÇÕES DE MONITORAMENTO
-- ========================================

CREATE TABLE IF NOT EXISTS monitoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_monitoring_config_key ON monitoring_config(config_key);
CREATE INDEX IF NOT EXISTS idx_monitoring_config_active ON monitoring_config(is_active);

-- ========================================
-- INSERIR CONFIGURAÇÕES PADRÃO
-- ========================================

INSERT INTO monitoring_config (config_key, config_value, description, is_active) VALUES
  ('metrics_interval', '15000', 'Intervalo de coleta de métricas em ms', true),
  ('health_check_interval', '30000', 'Intervalo de verificação de saúde em ms', true),
  ('websocket_port', '3001', 'Porta do servidor WebSocket', true),
  ('alert_retention_days', '30', 'Dias para manter histórico de alertas', true),
  ('metrics_retention_days', '7', 'Dias para manter histórico de métricas', true),
  ('memory_threshold', '90', 'Limite de uso de memória em %', true),
  ('cpu_threshold', '80', 'Limite de uso de CPU em %', true),
  ('db_latency_threshold', '1000', 'Limite de latência do banco em ms', true),
  ('api_latency_threshold', '5000', 'Limite de latência de APIs externas em ms', true),
  ('min_uptime_threshold', '3600000', 'Tempo mínimo de uptime em ms', true)
ON CONFLICT (config_key) DO NOTHING;

-- ========================================
-- INSERIR STATUS INICIAL DOS COMPONENTES
-- ========================================

INSERT INTO component_status (component_name, status, details) VALUES
  ('server', 'healthy', '{"initialized": true}'),
  ('database', 'healthy', '{"initialized": true}'),
  ('trading', 'healthy', '{"initialized": true}'),
  ('external', 'healthy', '{"initialized": true}')
ON CONFLICT (component_name) DO NOTHING;

-- ========================================
-- FUNÇÕES AUXILIARES
-- ========================================

-- Função para limpeza automática de dados antigos
CREATE OR REPLACE FUNCTION cleanup_monitoring_data()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  metrics_retention INTEGER;
  alerts_retention INTEGER;
BEGIN
  -- Buscar configurações de retenção
  SELECT (config_value->>'value')::INTEGER INTO metrics_retention
  FROM monitoring_config 
  WHERE config_key = 'metrics_retention_days' AND is_active = true;
  
  SELECT (config_value->>'value')::INTEGER INTO alerts_retention
  FROM monitoring_config 
  WHERE config_key = 'alert_retention_days' AND is_active = true;
  
  -- Valores padrão se não encontrado
  metrics_retention := COALESCE(metrics_retention, 7);
  alerts_retention := COALESCE(alerts_retention, 30);
  
  -- Limpar métricas antigas
  DELETE FROM system_metrics 
  WHERE created_at < CURRENT_TIMESTAMP - (metrics_retention || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Limpar alertas resolvidos antigos
  DELETE FROM system_alerts 
  WHERE resolved = true 
  AND resolved_at < CURRENT_TIMESTAMP - (alerts_retention || ' days')::INTERVAL;
  
  -- Manter apenas alertas críticos não resolvidos por mais tempo
  DELETE FROM system_alerts 
  WHERE resolved = false 
  AND level != 'critical' 
  AND level != 'emergency'
  AND created_at < CURRENT_TIMESTAMP - (alerts_retention || ' days')::INTERVAL;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular uptime de componentes
CREATE OR REPLACE FUNCTION calculate_component_uptime(component_name_param VARCHAR)
RETURNS DECIMAL AS $$
DECLARE
  total_minutes INTEGER;
  down_minutes INTEGER;
  uptime_percentage DECIMAL;
BEGIN
  -- Total de minutos nas últimas 24h
  total_minutes := 24 * 60;
  
  -- Calcular minutos com problemas nas últimas 24h
  SELECT COALESCE(SUM(
    EXTRACT(EPOCH FROM (
      COALESCE(resolved_at, CURRENT_TIMESTAMP) - timestamp
    )) / 60
  ), 0)::INTEGER
  INTO down_minutes
  FROM system_alerts
  WHERE category = component_name_param
  AND level IN ('critical', 'emergency')
  AND timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours';
  
  -- Calcular percentage de uptime
  uptime_percentage := ((total_minutes - down_minutes)::DECIMAL / total_minutes) * 100;
  uptime_percentage := GREATEST(0, LEAST(100, uptime_percentage));
  
  RETURN uptime_percentage;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar status de componente
CREATE OR REPLACE FUNCTION update_component_status(
  component_name_param VARCHAR,
  status_param VARCHAR,
  details_param JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
  uptime_calc DECIMAL;
BEGIN
  -- Calcular uptime
  uptime_calc := calculate_component_uptime(component_name_param);
  
  -- Atualizar ou inserir status
  INSERT INTO component_status (component_name, status, details, uptime_percentage, last_check, updated_at)
  VALUES (component_name_param, status_param, details_param, uptime_calc, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (component_name) DO UPDATE SET
    status = status_param,
    details = details_param,
    uptime_percentage = uptime_calc,
    last_check = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ========================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_monitoring_config_updated_at
  BEFORE UPDATE ON monitoring_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_component_status_updated_at
  BEFORE UPDATE ON component_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VIEWS PARA RELATÓRIOS
-- ========================================

-- View para métricas recentes
CREATE OR REPLACE VIEW v_recent_metrics AS
SELECT 
  timestamp,
  server_data->>'uptime' as server_uptime,
  (server_data->>'memoryUsage')::jsonb->>'heapUsed' as memory_used,
  (database_data->>'queryLatency')::INTEGER as db_latency,
  (trading_data->>'activePositions')::INTEGER as active_positions,
  (trading_data->>'totalUsers')::INTEGER as total_users,
  (external_data->>'binanceLatency')::INTEGER as binance_latency,
  external_data->>'ngrokStatus' as ngrok_status
FROM system_metrics
WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '1 hour'
ORDER BY timestamp DESC;

-- View para alertas críticos ativos
CREATE OR REPLACE VIEW v_critical_alerts AS
SELECT *
FROM system_alerts
WHERE resolved = false
AND level IN ('critical', 'emergency')
ORDER BY timestamp DESC;

-- View para estatísticas de componentes
CREATE OR REPLACE VIEW v_component_health AS
SELECT 
  component_name,
  status,
  uptime_percentage,
  last_check,
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_check)) as seconds_since_check
FROM component_status
ORDER BY 
  CASE status 
    WHEN 'critical' THEN 1 
    WHEN 'warning' THEN 2 
    WHEN 'healthy' THEN 3 
    ELSE 4 
  END,
  component_name;

-- ========================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE system_metrics IS 'Métricas coletadas do sistema em tempo real (servidor, banco, trading, APIs)';
COMMENT ON TABLE system_alerts IS 'Alertas gerados pelo sistema de monitoramento com diferentes níveis';
COMMENT ON TABLE component_status IS 'Status atual de cada componente do sistema com uptime';
COMMENT ON TABLE monitoring_config IS 'Configurações do sistema de monitoramento';

COMMENT ON FUNCTION cleanup_monitoring_data() IS 'Remove dados antigos de métricas e alertas baseado na configuração';
COMMENT ON FUNCTION calculate_component_uptime(VARCHAR) IS 'Calcula percentage de uptime de um componente nas últimas 24h';
COMMENT ON FUNCTION update_component_status(VARCHAR, VARCHAR, JSONB) IS 'Atualiza status de um componente específico';

-- ========================================
-- DADOS DE TESTE INICIAL
-- ========================================

-- Inserir algumas métricas de exemplo para desenvolvimento
INSERT INTO system_metrics (timestamp, server_data, database_data, trading_data, external_data) VALUES
(
  CURRENT_TIMESTAMP,
  '{"uptime": 3600000, "memoryUsage": {"heapUsed": 50000000, "heapTotal": 100000000}, "cpuLoad": 25, "activeConnections": 5}',
  '{"activeConnections": 2, "queryLatency": 50, "poolSize": 10, "status": "healthy"}',
  '{"activePositions": 15, "totalUsers": 100, "totalPnL24h": 1250.50, "successRate": 75.5, "avgExecutionTime": 150}',
  '{"binanceLatency": 200, "bybitLatency": 180, "openaiLatency": 800, "ngrokStatus": "connected"}'
);

-- Inserir alguns alertas de exemplo
INSERT INTO system_alerts (id, level, category, message, details, timestamp) VALUES
('alert_startup_001', 'info', 'system', 'Sistema de monitoramento inicializado', '{"component": "monitoring", "version": "1.0.0"}', CURRENT_TIMESTAMP),
('alert_startup_002', 'info', 'database', 'Migração de monitoramento executada com sucesso', '{"migration": "007_monitoring_system", "tables_created": 4}', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- MENSAGEM DE CONCLUSÃO
-- ========================================

SELECT 'Sistema de Monitoramento Real-Time instalado com sucesso!' as status,
       'Tabelas criadas: system_metrics, system_alerts, component_status, monitoring_config' as details,
       'Pronto para monitoramento 24/7 com WebSockets' as ready;
