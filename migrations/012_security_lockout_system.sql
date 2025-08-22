-- ========================================
-- MARKETBOT - SISTEMA DE SEGURANÇA COMPLETO
-- Migration 012: Security Lockout System (complemento ao 2FA)
-- Data: ${new Date().toISOString()}
-- ========================================

-- Início da transação
BEGIN;

-- ========================================
-- TABELAS DE BLOQUEIO E SEGURANÇA
-- ========================================

-- Tabela de IPs bloqueados
CREATE TABLE IF NOT EXISTS blocked_ips (
    id SERIAL PRIMARY KEY,
    ip_address INET NOT NULL,
    reason TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    blocked_until TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_blocked BOOLEAN DEFAULT false,
    blocked_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(ip_address)
);

-- Tabela de dispositivos bloqueados
CREATE TABLE IF NOT EXISTS blocked_devices (
    id SERIAL PRIMARY KEY,
    device_fingerprint VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    blocked_until TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_blocked BOOLEAN DEFAULT false,
    blocked_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(device_fingerprint)
);

-- Tabela de bloqueios globais
CREATE TABLE IF NOT EXISTS global_lockouts (
    id SERIAL PRIMARY KEY,
    reason TEXT NOT NULL,
    active_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de atividades suspeitas
CREATE TABLE IF NOT EXISTS suspicious_activities (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    activity_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'LOW' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    auto_blocked BOOLEAN DEFAULT false,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de rate limiting
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL, -- IP, user_id, etc
    limit_type VARCHAR(50) NOT NULL CHECK (limit_type IN ('IP', 'USER', 'ENDPOINT')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    updated_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para blocked_ips
CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_blocked_until ON blocked_ips(blocked_until);

-- Índices para blocked_devices
CREATE INDEX IF NOT EXISTS idx_blocked_devices_fingerprint ON blocked_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_blocked_devices_blocked_until ON blocked_devices(blocked_until);

-- Índices para suspicious_activities
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_ip ON suspicious_activities(ip_address);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_type ON suspicious_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_detected_at ON suspicious_activities(detected_at);

-- Índices para rate_limit_tracking
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limit_tracking(identifier, limit_type, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at ON rate_limit_tracking(created_at);

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

-- Aplicar triggers
CREATE TRIGGER update_blocked_ips_updated_at 
    BEFORE UPDATE ON blocked_ips 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FUNÇÕES DE SEGURANÇA
-- ========================================

-- Função para limpeza automática de dados antigos (atualizada)
CREATE OR REPLACE FUNCTION cleanup_security_data()
RETURNS void AS $$
BEGIN
    -- Limpar tentativas de login antigas (mais de 24 horas)
    DELETE FROM login_attempts 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    -- Limpar dados de rate limiting antigos (mais de 1 hora)
    DELETE FROM rate_limit_tracking 
    WHERE created_at < NOW() - INTERVAL '1 hour';
    
    -- Limpar atividades suspeitas antigas (mais de 7 dias)
    DELETE FROM suspicious_activities 
    WHERE detected_at < NOW() - INTERVAL '7 days';
    
    -- Limpar IPs bloqueados expirados
    DELETE FROM blocked_ips 
    WHERE blocked_until < NOW();
    
    -- Limpar dispositivos bloqueados expirados
    DELETE FROM blocked_devices 
    WHERE blocked_until < NOW();
    
    -- Limpar bloqueios globais expirados
    DELETE FROM global_lockouts 
    WHERE active_until < NOW();
    
    -- Log da limpeza
    INSERT INTO security_events (
        event_type, description, success, created_at
    ) VALUES (
        'SECURITY_CLEANUP', 
        'Limpeza automática de dados de segurança executada', 
        true, 
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VIEWS PARA MONITORAMENTO
-- ========================================

-- View de estatísticas de segurança (atualizada)
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
    -- IPs bloqueados ativos
    (SELECT COUNT(*) FROM blocked_ips WHERE blocked_until > NOW()) as active_blocked_ips,
    
    -- Dispositivos bloqueados ativos
    (SELECT COUNT(*) FROM blocked_devices WHERE blocked_until > NOW()) as active_blocked_devices,
    
    -- Tentativas de login falhadas na última hora
    (SELECT COUNT(*) FROM login_attempts 
     WHERE success = false AND created_at > NOW() - INTERVAL '1 hour') as failed_logins_1h,
    
    -- Atividades suspeitas nas últimas 24 horas
    (SELECT COUNT(*) FROM suspicious_activities 
     WHERE detected_at > NOW() - INTERVAL '24 hours') as suspicious_activities_24h,
    
    -- Usuários com 2FA habilitado
    (SELECT COUNT(*) FROM user_2fa WHERE is_enabled = true) as users_with_2fa,
    
    -- Total de usuários
    (SELECT COUNT(*) FROM users) as total_users,
    
    -- Eventos de segurança críticos nas últimas 24 horas
    (SELECT COUNT(*) FROM security_events 
     WHERE metadata->>'severity' = 'CRITICAL' AND created_at > NOW() - INTERVAL '24 hours') as critical_events_24h;

-- View de tentativas de login por IP
CREATE OR REPLACE VIEW login_attempts_by_ip AS
SELECT 
    ip_address,
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE success = true) as successful_attempts,
    COUNT(*) FILTER (WHERE success = false) as failed_attempts,
    MAX(created_at) as last_attempt,
    array_agg(DISTINCT user_agent) as user_agents
FROM login_attempts 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
ORDER BY failed_attempts DESC, total_attempts DESC;

-- ========================================
-- CONFIGURAÇÕES INICIAIS
-- ========================================

-- Inserir configurações padrão do sistema
INSERT INTO system_settings (key, value, description) VALUES
('max_login_attempts', '5', 'Máximo de tentativas de login antes do bloqueio'),
('lockout_duration_minutes', '60', 'Duração do bloqueio em minutos'),
('suspicious_activity_threshold', '3', 'Limite para detectar atividade suspeita'),
('rate_limit_requests_per_minute', '60', 'Limite de requests por minuto por IP'),
('require_2fa_for_admin', 'true', '2FA obrigatório para administradores'),
('session_timeout_minutes', '60', 'Timeout de sessão em minutos'),
('backup_codes_count', '10', 'Número de códigos de backup gerados')
ON CONFLICT (key) DO NOTHING;

-- ========================================
-- LOGS E AUDITORIA
-- ========================================

-- Registrar a conclusão da migração
INSERT INTO security_events (
    event_type, 
    description, 
    success, 
    created_at
) VALUES (
    'SYSTEM_MIGRATION', 
    'Migration 012: Sistema de bloqueio de segurança implementado com sucesso', 
    true, 
    NOW()
);

-- Commit da transação
COMMIT;

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
    missing_tables TEXT[];
    table_name TEXT;
    expected_tables TEXT[] := ARRAY[
        'blocked_ips', 'blocked_devices', 'global_lockouts', 
        'suspicious_activities', 'rate_limit_tracking', 'system_settings'
    ];
BEGIN
    FOR table_name IN SELECT unnest(expected_tables) LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name
        ) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Tabelas não criadas: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ Todas as tabelas de segurança foram criadas com sucesso';
    END IF;
END $$;

-- Final da migration
-- Timestamp: ${new Date().toISOString()}
