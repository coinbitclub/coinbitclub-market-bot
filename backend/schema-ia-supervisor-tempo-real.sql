-- ==========================================
-- SCHEMA PARA IA SUPERVISOR DE TRADE EM TEMPO REAL
-- ==========================================

-- Tabela para registrar sinais rejeitados por tempo limite
CREATE TABLE IF NOT EXISTS sinais_rejeitados (
    id SERIAL PRIMARY KEY,
    signal_data JSONB NOT NULL,
    motivo_rejeicao VARCHAR(100) NOT NULL,
    tempo_decorrido_ms INTEGER NOT NULL,
    timestamp_sinal TIMESTAMP NOT NULL,
    timestamp_rejeicao TIMESTAMP DEFAULT NOW(),
    supervisor VARCHAR(50) DEFAULT 'IA_SUPERVISOR_TEMPO_REAL',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para sinais rejeitados
CREATE INDEX IF NOT EXISTS idx_sinais_rejeitados_timestamp ON sinais_rejeitados(timestamp_rejeicao);
CREATE INDEX IF NOT EXISTS idx_sinais_rejeitados_motivo ON sinais_rejeitados(motivo_rejeicao);

-- Tabela para monitoramento de operações em tempo real
CREATE TABLE IF NOT EXISTS operacao_monitoramento (
    id SERIAL PRIMARY KEY,
    operation_id INTEGER REFERENCES user_operations(id),
    user_id INTEGER REFERENCES users(id),
    current_price DECIMAL(20,8),
    profit_loss_percent DECIMAL(10,4),
    profit_loss_usd DECIMAL(15,4),
    status VARCHAR(20),
    timestamp TIMESTAMP DEFAULT NOW(),
    supervisor VARCHAR(50) DEFAULT 'IA_SUPERVISOR_TEMPO_REAL',
    dados_extras JSONB
);

-- Índices para monitoramento de operações
CREATE INDEX IF NOT EXISTS idx_operacao_monitoramento_operation_id ON operacao_monitoramento(operation_id);
CREATE INDEX IF NOT EXISTS idx_operacao_monitoramento_user_id ON operacao_monitoramento(user_id);
CREATE INDEX IF NOT EXISTS idx_operacao_monitoramento_timestamp ON operacao_monitoramento(timestamp);

-- Tabela para registro de fechamentos de operações
CREATE TABLE IF NOT EXISTS operacao_fechamentos (
    id SERIAL PRIMARY KEY,
    operation_id INTEGER REFERENCES user_operations(id),
    user_id INTEGER REFERENCES users(id),
    motivo_fechamento VARCHAR(100) NOT NULL,
    timestamp_fechamento TIMESTAMP DEFAULT NOW(),
    supervisor VARCHAR(50) DEFAULT 'IA_SUPERVISOR_TEMPO_REAL',
    dados_operacao JSONB,
    tempo_processamento_ms INTEGER,
    sucesso BOOLEAN DEFAULT true
);

-- Índices para fechamentos
CREATE INDEX IF NOT EXISTS idx_operacao_fechamentos_operation_id ON operacao_fechamentos(operation_id);
CREATE INDEX IF NOT EXISTS idx_operacao_fechamentos_user_id ON operacao_fechamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_operacao_fechamentos_timestamp ON operacao_fechamentos(timestamp_fechamento);
CREATE INDEX IF NOT EXISTS idx_operacao_fechamentos_motivo ON operacao_fechamentos(motivo_fechamento);

-- Tabela para ordens pendentes de microserviços
CREATE TABLE IF NOT EXISTS ordens_pendentes (
    id SERIAL PRIMARY KEY,
    microservice VARCHAR(50) NOT NULL,
    ordem_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    tentativas INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    supervisor VARCHAR(50) DEFAULT 'IA_SUPERVISOR_TEMPO_REAL',
    error_message TEXT
);

-- Índices para ordens pendentes
CREATE INDEX IF NOT EXISTS idx_ordens_pendentes_microservice ON ordens_pendentes(microservice);
CREATE INDEX IF NOT EXISTS idx_ordens_pendentes_status ON ordens_pendentes(status);
CREATE INDEX IF NOT EXISTS idx_ordens_pendentes_created_at ON ordens_pendentes(created_at);

-- Tabela para estatísticas de supervisão
CREATE TABLE IF NOT EXISTS supervisor_estatisticas (
    id SERIAL PRIMARY KEY,
    supervisor_type VARCHAR(50) NOT NULL,
    periodo_inicio TIMESTAMP NOT NULL,
    periodo_fim TIMESTAMP,
    sinais_processados INTEGER DEFAULT 0,
    sinais_rejeitados INTEGER DEFAULT 0,
    operacoes_monitoradas INTEGER DEFAULT 0,
    fechamentos_realizados INTEGER DEFAULT 0,
    tempo_medio_resposta_ms INTEGER DEFAULT 0,
    dados_detalhados JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para estatísticas
CREATE INDEX IF NOT EXISTS idx_supervisor_estatisticas_type ON supervisor_estatisticas(supervisor_type);
CREATE INDEX IF NOT EXISTS idx_supervisor_estatisticas_periodo ON supervisor_estatisticas(periodo_inicio, periodo_fim);

-- Tabela para logs de atividade da IA
CREATE TABLE IF NOT EXISTS ia_activity_logs (
    id SERIAL PRIMARY KEY,
    supervisor_type VARCHAR(50) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    data JSONB,
    user_id INTEGER REFERENCES users(id),
    operation_id INTEGER,
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Índices para logs de atividade
CREATE INDEX IF NOT EXISTS idx_ia_activity_logs_supervisor_type ON ia_activity_logs(supervisor_type);
CREATE INDEX IF NOT EXISTS idx_ia_activity_logs_activity_type ON ia_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_ia_activity_logs_timestamp ON ia_activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_ia_activity_logs_user_id ON ia_activity_logs(user_id);

-- Tabela para controle de tempo de sinais
CREATE TABLE IF NOT EXISTS sinal_tempo_controle (
    id SERIAL PRIMARY KEY,
    signal_id VARCHAR(100) UNIQUE NOT NULL,
    signal_data JSONB NOT NULL,
    timestamp_recebido TIMESTAMP DEFAULT NOW(),
    timestamp_limite TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDENTE', -- PENDENTE, PROCESSADO, EXPIRADO
    processado_em TIMESTAMP,
    user_id INTEGER REFERENCES users(id),
    supervisor VARCHAR(50) DEFAULT 'IA_SUPERVISOR_TEMPO_REAL'
);

-- Índices para controle de tempo
CREATE INDEX IF NOT EXISTS idx_sinal_tempo_controle_signal_id ON sinal_tempo_controle(signal_id);
CREATE INDEX IF NOT EXISTS idx_sinal_tempo_controle_status ON sinal_tempo_controle(status);
CREATE INDEX IF NOT EXISTS idx_sinal_tempo_controle_timestamp_limite ON sinal_tempo_controle(timestamp_limite);

-- Função para limpeza automática de dados antigos (>30 dias)
CREATE OR REPLACE FUNCTION limpar_dados_antigos_supervisor()
RETURNS void AS $$
BEGIN
    -- Limpar monitoramento > 30 dias
    DELETE FROM operacao_monitoramento 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Limpar sinais rejeitados > 7 dias
    DELETE FROM sinais_rejeitados 
    WHERE timestamp_rejeicao < NOW() - INTERVAL '7 days';
    
    -- Limpar ordens pendentes processadas > 24 horas
    DELETE FROM ordens_pendentes 
    WHERE status = 'PROCESSED' AND processed_at < NOW() - INTERVAL '24 hours';
    
    -- Limpar logs de atividade > 30 dias (manter apenas erros)
    DELETE FROM ia_activity_logs 
    WHERE timestamp < NOW() - INTERVAL '30 days' AND success = true;
    
    -- Limpar controle de sinais > 24 horas
    DELETE FROM sinal_tempo_controle 
    WHERE timestamp_recebido < NOW() - INTERVAL '24 hours';
    
    RAISE NOTICE 'Limpeza de dados antigos executada com sucesso';
END;
$$ LANGUAGE plpgsql;

-- View para relatório de performance da IA
CREATE OR REPLACE VIEW vw_ia_supervisor_performance AS
SELECT 
    DATE(timestamp) as data,
    supervisor_type,
    COUNT(*) as total_atividades,
    COUNT(CASE WHEN success = true THEN 1 END) as sucessos,
    COUNT(CASE WHEN success = false THEN 1 END) as falhas,
    AVG(execution_time_ms) as tempo_medio_ms,
    MIN(execution_time_ms) as tempo_min_ms,
    MAX(execution_time_ms) as tempo_max_ms
FROM ia_activity_logs
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(timestamp), supervisor_type
ORDER BY data DESC, supervisor_type;

-- View para operações em monitoramento
CREATE OR REPLACE VIEW vw_operacoes_monitoramento_ativas AS
SELECT 
    uo.id,
    uo.user_id,
    u.name as user_name,
    uo.symbol,
    uo.side,
    uo.entry_price,
    uo.current_price,
    uo.take_profit_price,
    uo.stop_loss_price,
    uo.status,
    uo.created_at,
    om.profit_loss_percent as pl_atual,
    om.profit_loss_usd as pl_usd_atual,
    om.timestamp as ultima_atualizacao,
    EXTRACT(MINUTES FROM (NOW() - uo.created_at)) as minutos_aberta
FROM user_operations uo
JOIN users u ON uo.user_id = u.id
LEFT JOIN LATERAL (
    SELECT profit_loss_percent, profit_loss_usd, timestamp
    FROM operacao_monitoramento om2
    WHERE om2.operation_id = uo.id
    ORDER BY om2.timestamp DESC
    LIMIT 1
) om ON true
WHERE uo.status IN ('OPEN', 'PENDING');

-- Comentários das tabelas
COMMENT ON TABLE sinais_rejeitados IS 'Registro de sinais rejeitados por tempo limite ou outras validações';
COMMENT ON TABLE operacao_monitoramento IS 'Monitoramento em tempo real de operações ativas';
COMMENT ON TABLE operacao_fechamentos IS 'Histórico de fechamentos de operações com motivos';
COMMENT ON TABLE ordens_pendentes IS 'Ordens pendentes para reenvio a microserviços';
COMMENT ON TABLE supervisor_estatisticas IS 'Estatísticas consolidadas de supervisão';
COMMENT ON TABLE ia_activity_logs IS 'Logs detalhados de todas as atividades da IA';
COMMENT ON TABLE sinal_tempo_controle IS 'Controle de tempo limite para processamento de sinais';

-- Inserir configuração padrão
INSERT INTO system_config (config_key, config_value, description) 
VALUES 
    ('supervisor_tempo_real_ativo', 'true', 'IA Supervisor de Trade em Tempo Real ativo'),
    ('tempo_limite_sinal_segundos', '120', 'Tempo limite para processamento de sinais (2 minutos)'),
    ('intervalo_monitoramento_segundos', '30', 'Intervalo de monitoramento de operações'),
    ('tempo_maximo_fechamento_ms', '1000', 'Tempo máximo para fechamento de operação')
ON CONFLICT (config_key) DO UPDATE SET 
    config_value = EXCLUDED.config_value,
    updated_at = NOW();

-- Criar função trigger para registrar atividade
CREATE OR REPLACE FUNCTION registrar_atividade_supervisor()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar atividade baseada na tabela modificada
    IF TG_TABLE_NAME = 'operacao_fechamentos' THEN
        INSERT INTO ia_activity_logs (
            supervisor_type, activity_type, description, 
            user_id, operation_id, success
        ) VALUES (
            'IA_SUPERVISOR_TEMPO_REAL', 
            'FECHAMENTO_OPERACAO',
            'Operação fechada: ' || NEW.motivo_fechamento,
            NEW.user_id,
            NEW.operation_id,
            NEW.sucesso
        );
    ELSIF TG_TABLE_NAME = 'sinais_rejeitados' THEN
        INSERT INTO ia_activity_logs (
            supervisor_type, activity_type, description, success
        ) VALUES (
            'IA_SUPERVISOR_TEMPO_REAL',
            'SINAL_REJEITADO', 
            'Sinal rejeitado: ' || NEW.motivo_rejeicao,
            false
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers
DROP TRIGGER IF EXISTS trigger_atividade_fechamentos ON operacao_fechamentos;
CREATE TRIGGER trigger_atividade_fechamentos
    AFTER INSERT ON operacao_fechamentos
    FOR EACH ROW EXECUTE FUNCTION registrar_atividade_supervisor();

DROP TRIGGER IF EXISTS trigger_atividade_sinais_rejeitados ON sinais_rejeitados;
CREATE TRIGGER trigger_atividade_sinais_rejeitados
    AFTER INSERT ON sinais_rejeitados
    FOR EACH ROW EXECUTE FUNCTION registrar_atividade_supervisor();

-- Grants de permissão
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;

COMMIT;

-- Mensagem de conclusão
SELECT 'Schema para IA Supervisor de Trade em Tempo Real criado com sucesso!' as status;
