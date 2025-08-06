-- Criar tabelas para funcionalidades de emergência e IA Águia
-- Sistema CoinBitClub - Estruturas complementares

-- Tabela para logs de emergência
CREATE TABLE IF NOT EXISTS emergency_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER,
  action VARCHAR(100) NOT NULL,
  reason TEXT,
  total_operations INTEGER DEFAULT 0,
  closed_successfully INTEGER DEFAULT 0,
  failed_to_close INTEGER DEFAULT 0,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para pausas de trading
CREATE TABLE IF NOT EXISTS trading_pauses (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER,
  exchange VARCHAR(50) NOT NULL,
  environment VARCHAR(20) DEFAULT 'all',
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  resolved_by_admin INTEGER
);

-- Tabela para chaves API do sistema
CREATE TABLE IF NOT EXISTS system_api_keys (
  id SERIAL PRIMARY KEY,
  service VARCHAR(50) NOT NULL,
  api_key TEXT NOT NULL,
  secret_key TEXT,
  environment VARCHAR(20) DEFAULT 'production',
  is_active BOOLEAN DEFAULT true,
  updated_by_admin INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service, environment)
);

-- Tabela para logs de ações administrativas
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para relatórios da IA Águia
CREATE TABLE IF NOT EXISTS ia_aguia_reports (
  id SERIAL PRIMARY KEY,
  tipo_relatorio VARCHAR(50) NOT NULL DEFAULT 'daily',
  data_referencia DATE NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  conteudo_completo TEXT NOT NULL,
  resumo_executivo TEXT,
  principais_insights JSONB,
  recomendacoes JSONB,
  dados_mercado JSONB,
  views_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para alertas da IA Águia
CREATE TABLE IF NOT EXISTS ia_aguia_alerts (
  id SERIAL PRIMARY KEY,
  symbols JSONB NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  titulo VARCHAR(200) NOT NULL,
  conteudo TEXT NOT NULL,
  recomendacao_acao TEXT,
  dados_mercado JSONB,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Tabela para visualizações de relatórios por usuário
CREATE TABLE IF NOT EXISTS user_report_views (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  report_id INTEGER NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, report_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_emergency_logs_admin_created ON emergency_logs(admin_id, created_at);
CREATE INDEX IF NOT EXISTS idx_trading_pauses_status_exchange ON trading_pauses(status, exchange);
CREATE INDEX IF NOT EXISTS idx_ia_reports_data_tipo ON ia_aguia_reports(data_referencia, tipo_relatorio);
CREATE INDEX IF NOT EXISTS idx_ia_alerts_severity_status ON ia_aguia_alerts(severity, status);
CREATE INDEX IF NOT EXISTS idx_user_report_views_user_viewed ON user_report_views(user_id, viewed_at);

-- Função para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_ia_aguia_reports_updated_at ON ia_aguia_reports;
CREATE TRIGGER update_ia_aguia_reports_updated_at 
  BEFORE UPDATE ON ia_aguia_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir algumas configurações padrão
INSERT INTO system_api_keys (service, api_key, secret_key, environment) VALUES
('openai', 'sk-placeholder', NULL, 'production'),
('binance', 'placeholder-key', 'placeholder-secret', 'testnet'),
('bybit', 'placeholder-key', 'placeholder-secret', 'testnet')
ON CONFLICT (service, environment) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE emergency_logs IS 'Registra todas as ações de emergência executadas pelos administradores';
COMMENT ON TABLE trading_pauses IS 'Controla pausas de trading por exchange e ambiente';
COMMENT ON TABLE system_api_keys IS 'Armazena chaves API do sistema (OpenAI, exchanges, etc)';
COMMENT ON TABLE ia_aguia_reports IS 'Relatórios automatizados gerados pela IA Águia';
COMMENT ON TABLE ia_aguia_alerts IS 'Alertas de mercado gerados pela IA Águia';
COMMENT ON TABLE user_report_views IS 'Rastreia visualizações de relatórios por usuário';

COMMENT ON COLUMN ia_aguia_reports.tipo_relatorio IS 'Tipos: daily, weekly, monthly, special';
COMMENT ON COLUMN ia_aguia_alerts.severity IS 'Níveis: low, medium, high, critical';
COMMENT ON COLUMN trading_pauses.environment IS 'Ambientes: production, testnet, all';
