-- ========================================
-- MARKETBOT - MIGRATION 014
-- Tabelas para dashboard e monitoramento
-- ========================================

-- Criar tabela para tracking de sessões de usuário
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint VARCHAR(255),
  login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip ON user_sessions(ip_address);

-- Criar tabela para métricas do sistema (cache)
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(20,8),
  metric_data JSONB,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para métricas
CREATE INDEX IF NOT EXISTS idx_system_metrics_type_name ON system_metrics(metric_type, metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded ON system_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_system_metrics_expires ON system_metrics(expires_at);

-- Criar tabela para alertas do sistema
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  component VARCHAR(100) NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT false,
  auto_resolve BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para alertas
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(is_resolved, created_at);
CREATE INDEX IF NOT EXISTS idx_system_alerts_component ON system_alerts(component);

-- Criar tabela para audit log detalhado
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id UUID REFERENCES user_sessions(id),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_success ON audit_log(success, created_at);

-- Criar tabela para performance metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  endpoint VARCHAR(200),
  method VARCHAR(10),
  response_time_ms INTEGER,
  status_code INTEGER,
  error_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  memory_usage_mb DECIMAL(10,2),
  cpu_usage_percent DECIMAL(5,2),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  interval_start TIMESTAMP,
  interval_end TIMESTAMP
);

-- Índices para performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name, recorded_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint, method);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_interval ON performance_metrics(interval_start, interval_end);

-- Criar tabela para websocket connections tracking
CREATE TABLE IF NOT EXISTS websocket_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  socket_id VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  disconnected_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  last_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  connection_duration_seconds INTEGER,
  bytes_sent BIGINT DEFAULT 0,
  bytes_received BIGINT DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0
);

-- Índices para websocket connections
CREATE INDEX IF NOT EXISTS idx_websocket_connections_user_id ON websocket_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_websocket_connections_socket_id ON websocket_connections(socket_id);
CREATE INDEX IF NOT EXISTS idx_websocket_connections_active ON websocket_connections(is_active, connected_at);

-- Função para limpar dados antigos automaticamente
CREATE OR REPLACE FUNCTION cleanup_old_dashboard_data()
RETURNS void AS $$
BEGIN
  -- Limpar sessões expiradas
  DELETE FROM user_sessions 
  WHERE expires_at < CURRENT_TIMESTAMP OR last_activity < CURRENT_TIMESTAMP - INTERVAL '7 days';
  
  -- Limpar métricas antigas (manter apenas 30 dias)
  DELETE FROM system_metrics 
  WHERE recorded_at < CURRENT_TIMESTAMP - INTERVAL '30 days' 
  OR (expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP);
  
  -- Limpar alertas resolvidos antigos (manter apenas 15 dias)
  DELETE FROM system_alerts 
  WHERE is_resolved = true AND resolved_at < CURRENT_TIMESTAMP - INTERVAL '15 days';
  
  -- Limpar audit log antigo (manter apenas 90 dias)
  DELETE FROM audit_log 
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  
  -- Limpar performance metrics antigas (manter apenas 7 dias)
  DELETE FROM performance_metrics 
  WHERE recorded_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
  
  -- Limpar conexões websocket antigas
  DELETE FROM websocket_connections 
  WHERE disconnected_at < CURRENT_TIMESTAMP - INTERVAL '24 hours' 
  OR (is_active = false AND connected_at < CURRENT_TIMESTAMP - INTERVAL '24 hours');
  
  RAISE NOTICE 'Limpeza de dados antigos do dashboard concluída';
END;
$$ LANGUAGE plpgsql;

-- Inserir algumas métricas iniciais para teste
INSERT INTO system_metrics (metric_type, metric_name, metric_value, metric_data) VALUES
('system', 'uptime_seconds', 0, '{"status": "initializing"}'),
('system', 'memory_usage_mb', 0, '{"total_mb": 0, "used_mb": 0}'),
('system', 'cpu_usage_percent', 0, '{"cores": 0, "load_avg": [0,0,0]}'),
('performance', 'avg_response_time_ms', 0, '{"endpoint_count": 0}'),
('users', 'total_active_sessions', 0, '{"websocket_count": 0}')
ON CONFLICT DO NOTHING;

-- Criar alerta inicial de sistema inicializado
INSERT INTO system_alerts (alert_type, title, message, component, auto_resolve) VALUES
('INFO', 'Sistema Inicializado', 'Dashboard e sistema de monitoramento inicializados com sucesso', 'DASHBOARD', true)
ON CONFLICT DO NOTHING;

-- Adicionar comentários para documentação
COMMENT ON TABLE user_sessions IS 'Tabela para tracking de sessões ativas de usuários';
COMMENT ON TABLE system_metrics IS 'Cache de métricas do sistema para dashboard';
COMMENT ON TABLE system_alerts IS 'Alertas e notificações do sistema';
COMMENT ON TABLE audit_log IS 'Log detalhado de auditoria de todas as ações';
COMMENT ON TABLE performance_metrics IS 'Métricas de performance e monitoramento';
COMMENT ON TABLE websocket_connections IS 'Tracking de conexões WebSocket ativas';

-- Verificar se migration foi aplicada com sucesso
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name IN ('user_sessions', 'system_metrics', 'system_alerts', 'audit_log', 'performance_metrics', 'websocket_connections')
  ) THEN
    RAISE NOTICE '✅ Migration 014 - Tabelas de dashboard criadas com sucesso';
  ELSE
    RAISE EXCEPTION '❌ Erro na criação das tabelas de dashboard';
  END IF;
END
$$;
