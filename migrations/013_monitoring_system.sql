
-- ========================================
-- MIGRATION 013: SISTEMA DE MONITORAMENTO
-- ========================================

-- Configurações de monitoramento
INSERT INTO monitoring_config (component, check_interval, alert_threshold, is_enabled) VALUES
('database', 30, 1000, true),
('api_response', 60, 500, true),
('memory_usage', 120, 80, true),
('cpu_usage', 120, 85, true),
('disk_space', 300, 90, true)
ON CONFLICT (component) DO NOTHING;

-- Status dos componentes
INSERT INTO component_status (component, status, last_check, response_time) VALUES
('database', 'HEALTHY', NOW(), 45),
('trading_engine', 'HEALTHY', NOW(), 120),
('market_data', 'HEALTHY', NOW(), 89),
('webhooks', 'HEALTHY', NOW(), 156)
ON CONFLICT (component) DO UPDATE SET
  status = EXCLUDED.status,
  last_check = EXCLUDED.last_check,
  response_time = EXCLUDED.response_time;
