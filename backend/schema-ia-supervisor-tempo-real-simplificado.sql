-- 🤖 SCHEMA IA SUPERVISOR DE TRADE EM TEMPO REAL
-- Estrutura simplificada e funcional

-- Tabela para monitoramento de operações
CREATE TABLE IF NOT EXISTS operacao_monitoramento (
    id SERIAL PRIMARY KEY,
    operation_id VARCHAR(100),
    user_id INTEGER,
    ticker VARCHAR(20),
    side VARCHAR(10),
    current_price DECIMAL(20,8),
    profit_loss_percent DECIMAL(10,4),
    profit_loss_usd DECIMAL(15,2),
    timestamp TIMESTAMP DEFAULT NOW(),
    supervisor VARCHAR(50) DEFAULT 'IA_SUPERVISOR_TEMPO_REAL'
);

-- Tabela para fechamentos de operações
CREATE TABLE IF NOT EXISTS operacao_fechamentos (
    id SERIAL PRIMARY KEY,
    operation_id VARCHAR(100),
    user_id INTEGER,
    ticker VARCHAR(20),
    side VARCHAR(10),
    motivo_fechamento VARCHAR(100),
    timestamp_fechamento TIMESTAMP DEFAULT NOW(),
    preco_fechamento DECIMAL(20,8),
    profit_loss_final DECIMAL(15,2),
    tempo_operacao_minutos INTEGER,
    supervisor VARCHAR(50) DEFAULT 'IA_SUPERVISOR_TEMPO_REAL',
    sucesso BOOLEAN DEFAULT true
);

-- Tabela para sinais rejeitados
CREATE TABLE IF NOT EXISTS sinais_rejeitados (
    id SERIAL PRIMARY KEY,
    signal_id VARCHAR(100),
    sinal_data JSONB,
    motivo_rejeicao VARCHAR(100),
    tempo_decorrido_ms INTEGER,
    timestamp_sinal TIMESTAMP,
    timestamp_rejeicao TIMESTAMP DEFAULT NOW(),
    supervisor VARCHAR(50) DEFAULT 'IA_SUPERVISOR_TEMPO_REAL'
);

-- Tabela para logs de atividade da IA
CREATE TABLE IF NOT EXISTS ia_activity_logs (
    id SERIAL PRIMARY KEY,
    supervisor_type VARCHAR(50) DEFAULT 'IA_SUPERVISOR_TEMPO_REAL',
    action VARCHAR(100) NOT NULL,
    details JSONB,
    execution_time_ms INTEGER,
    timestamp TIMESTAMP DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Tabela para controle de tempo de sinais
CREATE TABLE IF NOT EXISTS sinal_tempo_controle (
    id SERIAL PRIMARY KEY,
    signal_id VARCHAR(100) UNIQUE NOT NULL,
    timestamp_recebido TIMESTAMP DEFAULT NOW(),
    timestamp_limite TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDENTE'
);

-- Tabela para performance do supervisor
CREATE TABLE IF NOT EXISTS supervisor_performance_log (
    id SERIAL PRIMARY KEY,
    supervisor_type VARCHAR(50) DEFAULT 'IA_SUPERVISOR_TEMPO_REAL',
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    timestamp TIMESTAMP DEFAULT NOW(),
    details JSONB
);

-- Tabela para alertas do sistema
CREATE TABLE IF NOT EXISTS sistema_alertas (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'INFO',
    timestamp TIMESTAMP DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT false,
    supervisor VARCHAR(50) DEFAULT 'IA_SUPERVISOR_TEMPO_REAL'
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_operacao_monitoramento_timestamp ON operacao_monitoramento(timestamp);
CREATE INDEX IF NOT EXISTS idx_operacao_monitoramento_user_id ON operacao_monitoramento(user_id);
CREATE INDEX IF NOT EXISTS idx_operacao_fechamentos_timestamp ON operacao_fechamentos(timestamp_fechamento);
CREATE INDEX IF NOT EXISTS idx_operacao_fechamentos_user_id ON operacao_fechamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_sinais_rejeitados_timestamp ON sinais_rejeitados(timestamp_rejeicao);
CREATE INDEX IF NOT EXISTS idx_ia_activity_logs_timestamp ON ia_activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_sinal_tempo_controle_signal_id ON sinal_tempo_controle(signal_id);

-- Comentários das tabelas
COMMENT ON TABLE operacao_monitoramento IS 'Logs de monitoramento em tempo real das operações pela IA';
COMMENT ON TABLE operacao_fechamentos IS 'Histórico de fechamentos de operações executados pela IA';
COMMENT ON TABLE sinais_rejeitados IS 'Sinais rejeitados por timeout ou outras validações';
COMMENT ON TABLE ia_activity_logs IS 'Log completo de todas as ações da IA Supervisor';
COMMENT ON TABLE sinal_tempo_controle IS 'Controle de tempo limite de 2 minutos para sinais';

-- ✅ SCHEMA SIMPLIFICADO E FUNCIONAL PARA IA SUPERVISOR
