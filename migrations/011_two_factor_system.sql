-- ========================================
-- MARKETBOT - TWO FACTOR AUTHENTICATION MIGRATION
-- Sistema 2FA enterprise obrigatório para todos os usuários
-- ========================================

-- Tabela principal do 2FA
CREATE TABLE user_2fa (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    secret_key VARCHAR(255) NOT NULL,
    backup_codes JSONB NOT NULL DEFAULT '[]',
    is_enabled BOOLEAN DEFAULT false,
    setup_completed BOOLEAN DEFAULT false,
    last_used_at TIMESTAMP,
    enabled_at TIMESTAMP,
    disabled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de tentativas de login para controle de segurança
CREATE TABLE login_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    attempt_type VARCHAR(20) NOT NULL CHECK (attempt_type IN ('PASSWORD', '2FA', 'BACKUP_CODE')),
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    device_fingerprint VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de eventos de segurança para auditoria
CREATE TABLE security_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    event_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de dispositivos confiáveis (implementação futura)
CREATE TABLE trusted_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    trusted_until TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de configurações de segurança por usuário
CREATE TABLE user_security_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    require_2fa_for_withdrawal BOOLEAN DEFAULT true,
    require_2fa_for_trading BOOLEAN DEFAULT false,
    require_2fa_for_settings BOOLEAN DEFAULT true,
    login_notification_enabled BOOLEAN DEFAULT true,
    suspicious_activity_alerts BOOLEAN DEFAULT true,
    session_timeout_minutes INTEGER DEFAULT 60,
    max_concurrent_sessions INTEGER DEFAULT 3,
    ip_whitelist JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar coluna 2FA na tabela users se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_required BOOLEAN DEFAULT true; -- Obrigatório para todos

-- Índices para performance e segurança
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_enabled ON user_2fa(is_enabled);
CREATE INDEX IF NOT EXISTS idx_user_2fa_setup_completed ON user_2fa(setup_completed);

CREATE INDEX IF NOT EXISTS idx_login_attempts_user ON login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_ip_time ON login_attempts(user_id, ip_address, created_at);

CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_success ON security_events(success);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_active ON trusted_devices(is_active);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_trusted_until ON trusted_devices(trusted_until);

CREATE INDEX IF NOT EXISTS idx_user_security_settings_user ON user_security_settings(user_id);

-- Foreign Keys
ALTER TABLE user_2fa 
    ADD CONSTRAINT fk_user_2fa_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE login_attempts 
    ADD CONSTRAINT fk_login_attempts_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE security_events 
    ADD CONSTRAINT fk_security_events_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE trusted_devices 
    ADD CONSTRAINT fk_trusted_devices_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_security_settings 
    ADD CONSTRAINT fk_user_security_settings_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ========================================
-- FUNÇÕES E TRIGGERS
-- ========================================

-- Função para limpar tentativas de login antigas automaticamente
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Deletar tentativas com mais de 24 horas
    DELETE FROM login_attempts 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Inserir evento de limpeza se deletou algo
    IF deleted_count > 0 THEN
        INSERT INTO security_events (
            event_type, description, ip_address, user_agent, success, created_at
        ) VALUES (
            'CLEANUP_LOGIN_ATTEMPTS', 
            FORMAT('Limpeza automática: %s tentativas antigas removidas', deleted_count),
            '127.0.0.1', 'System Cleanup', true, NOW()
        );
    END IF;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar dispositivos confiáveis expirados
CREATE OR REPLACE FUNCTION cleanup_expired_trusted_devices() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Desativar dispositivos expirados
    UPDATE trusted_devices 
    SET is_active = false, updated_at = NOW()
    WHERE trusted_until < NOW() AND is_active = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar tentativas suspeitas
CREATE OR REPLACE FUNCTION detect_suspicious_activity() RETURNS TABLE(
    user_id INTEGER,
    ip_address INET,
    failed_attempts BIGINT,
    last_attempt TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        la.user_id,
        la.ip_address,
        COUNT(*) as failed_attempts,
        MAX(la.created_at) as last_attempt
    FROM login_attempts la
    WHERE la.success = false 
    AND la.created_at > NOW() - INTERVAL '1 hour'
    GROUP BY la.user_id, la.ip_address
    HAVING COUNT(*) >= 3
    ORDER BY failed_attempts DESC, last_attempt DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar configurações de segurança padrão para novos usuários
CREATE OR REPLACE FUNCTION create_default_security_settings() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_security_settings (user_id, created_at) 
    VALUES (NEW.id, NOW())
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_security_settings_default
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_security_settings();

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION trigger_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_2fa_updated_at
    BEFORE UPDATE ON user_2fa
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER user_security_settings_updated_at
    BEFORE UPDATE ON user_security_settings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_updated_at();

-- Trigger para registrar eventos importantes automaticamente
CREATE OR REPLACE FUNCTION log_security_events() RETURNS TRIGGER AS $$
BEGIN
    -- Log quando 2FA é habilitado
    IF OLD.is_enabled = false AND NEW.is_enabled = true THEN
        INSERT INTO security_events (
            user_id, event_type, description, success, created_at
        ) VALUES (
            NEW.user_id, '2FA_ENABLED', 
            '2FA foi habilitado para o usuário', true, NOW()
        );
    END IF;
    
    -- Log quando 2FA é desabilitado
    IF OLD.is_enabled = true AND NEW.is_enabled = false THEN
        INSERT INTO security_events (
            user_id, event_type, description, success, created_at
        ) VALUES (
            NEW.user_id, '2FA_DISABLED', 
            '2FA foi desabilitado para o usuário', true, NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_2fa_security_events
    AFTER UPDATE ON user_2fa
    FOR EACH ROW
    EXECUTE FUNCTION log_security_events();

-- ========================================
-- VIEWS DE RELATÓRIOS
-- ========================================

-- View de estatísticas de 2FA
CREATE OR REPLACE VIEW two_factor_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN u2fa.is_enabled = true THEN 1 END) as users_with_2fa,
    COUNT(CASE WHEN u2fa.setup_completed = true AND u2fa.is_enabled = false THEN 1 END) as setup_not_enabled,
    COUNT(CASE WHEN u2fa.id IS NULL THEN 1 END) as no_2fa_setup,
    ROUND(
        (COUNT(CASE WHEN u2fa.is_enabled = true THEN 1 END)::DECIMAL / COUNT(*)) * 100, 
        2
    ) as adoption_percentage
FROM users u
LEFT JOIN user_2fa u2fa ON u.id = u2fa.user_id
WHERE u.is_active = true;

-- View de tentativas de login suspeitas
CREATE OR REPLACE VIEW suspicious_login_attempts AS
SELECT 
    la.user_id,
    u.email,
    la.ip_address,
    COUNT(*) as failed_attempts,
    MAX(la.created_at) as last_attempt,
    MIN(la.created_at) as first_attempt,
    ARRAY_AGG(DISTINCT la.user_agent) as user_agents
FROM login_attempts la
JOIN users u ON la.user_id = u.id
WHERE la.success = false 
AND la.created_at > NOW() - INTERVAL '24 hours'
GROUP BY la.user_id, u.email, la.ip_address
HAVING COUNT(*) >= 3
ORDER BY failed_attempts DESC, last_attempt DESC;

-- View de eventos de segurança recentes
CREATE OR REPLACE VIEW recent_security_events AS
SELECT 
    se.id,
    se.user_id,
    u.email,
    se.event_type,
    se.description,
    se.ip_address,
    se.success,
    se.created_at
FROM security_events se
LEFT JOIN users u ON se.user_id = u.id
WHERE se.created_at > NOW() - INTERVAL '7 days'
ORDER BY se.created_at DESC;

-- View de usuários sem 2FA obrigatório
CREATE OR REPLACE VIEW users_without_2fa AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.created_at as user_created,
    u2fa.setup_completed,
    u2fa.is_enabled,
    CASE 
        WHEN u2fa.id IS NULL THEN 'Não iniciou setup'
        WHEN u2fa.setup_completed = false THEN 'Setup iniciado mas não concluído'
        WHEN u2fa.is_enabled = false THEN 'Setup concluído mas não ativado'
        ELSE 'Status desconhecido'
    END as status_2fa
FROM users u
LEFT JOIN user_2fa u2fa ON u.id = u2fa.user_id
WHERE u.is_active = true 
AND u.two_factor_required = true
AND (u2fa.is_enabled IS NULL OR u2fa.is_enabled = false)
ORDER BY u.created_at DESC;

-- ========================================
-- CONFIGURAÇÕES DE SEGURANÇA
-- ========================================

-- Inserir configurações de sistema para 2FA
INSERT INTO system_settings (key, value, description) VALUES
('2fa_required_for_all', 'true', 'Tornar 2FA obrigatório para todos os usuários'),
('2fa_grace_period_days', '7', 'Dias de tolerância para ativar 2FA após registro'),
('2fa_token_window', '2', 'Janela de tempo aceita para tokens TOTP (±2 = 120 segundos)'),
('2fa_backup_codes_count', '10', 'Número de códigos de backup gerados'),
('max_login_attempts', '5', 'Máximo de tentativas de login antes do bloqueio'),
('login_lockout_minutes', '60', 'Minutos de bloqueio após tentativas excessivas'),
('trusted_device_duration_days', '30', 'Dias que um dispositivo permanece confiável'),
('security_events_retention_days', '90', 'Dias para manter eventos de segurança'),
('login_attempts_retention_hours', '24', 'Horas para manter tentativas de login'),
('suspicious_activity_threshold', '3', 'Tentativas falhadas para considerar atividade suspeita')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description;

-- ========================================
-- DADOS INICIAIS
-- ========================================

-- Marcar 2FA como obrigatório para todos os usuários existentes
UPDATE users 
SET two_factor_required = true, updated_at = NOW()
WHERE two_factor_required IS NULL OR two_factor_required = false;

-- Criar configurações de segurança para usuários existentes
INSERT INTO user_security_settings (user_id, created_at)
SELECT id, NOW() FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Inserir evento de sistema sobre migração 2FA
INSERT INTO security_events (
    event_type, description, ip_address, user_agent, success, created_at
) VALUES (
    'SYSTEM_2FA_MIGRATION', 
    'Sistema 2FA enterprise implementado - obrigatório para todos os usuários',
    '127.0.0.1', 'System Migration', true, NOW()
);

-- ========================================
-- JOBS DE MANUTENÇÃO
-- ========================================

-- Criar função para manutenção diária de segurança
CREATE OR REPLACE FUNCTION daily_security_maintenance() RETURNS TEXT AS $$
DECLARE
    cleaned_attempts INTEGER;
    cleaned_devices INTEGER;
    suspicious_count INTEGER;
BEGIN
    -- Limpar tentativas de login antigas
    SELECT cleanup_old_login_attempts() INTO cleaned_attempts;
    
    -- Limpar dispositivos confiáveis expirados
    SELECT cleanup_expired_trusted_devices() INTO cleaned_devices;
    
    -- Contar atividades suspeitas
    SELECT COUNT(*) INTO suspicious_count FROM detect_suspicious_activity();
    
    -- Registrar resumo da manutenção
    INSERT INTO security_events (
        event_type, description, ip_address, user_agent, success, created_at
    ) VALUES (
        'DAILY_MAINTENANCE', 
        FORMAT('Manutenção diária: %s tentativas limpas, %s dispositivos expirados, %s atividades suspeitas', 
               cleaned_attempts, cleaned_devices, suspicious_count),
        '127.0.0.1', 'System Maintenance', true, NOW()
    );
    
    RETURN FORMAT('Manutenção concluída: %s tentativas, %s dispositivos, %s suspeitas', 
                  cleaned_attempts, cleaned_devices, suspicious_count);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PERMISSÕES E SEGURANÇA
-- ========================================

-- Revogar permissões públicas nas tabelas sensíveis
REVOKE ALL ON user_2fa FROM PUBLIC;
REVOKE ALL ON login_attempts FROM PUBLIC;
REVOKE ALL ON security_events FROM PUBLIC;
REVOKE ALL ON trusted_devices FROM PUBLIC;
REVOKE ALL ON user_security_settings FROM PUBLIC;

-- Conceder permissões específicas para o backend
GRANT SELECT, INSERT, UPDATE ON user_2fa TO marketbot_backend;
GRANT SELECT, INSERT, UPDATE ON login_attempts TO marketbot_backend;
GRANT SELECT, INSERT ON security_events TO marketbot_backend;
GRANT SELECT, INSERT, UPDATE, DELETE ON trusted_devices TO marketbot_backend;
GRANT SELECT, INSERT, UPDATE ON user_security_settings TO marketbot_backend;

-- Permissões para sequences
GRANT USAGE ON SEQUENCE user_2fa_id_seq TO marketbot_backend;
GRANT USAGE ON SEQUENCE login_attempts_id_seq TO marketbot_backend;
GRANT USAGE ON SEQUENCE security_events_id_seq TO marketbot_backend;
GRANT USAGE ON SEQUENCE trusted_devices_id_seq TO marketbot_backend;
GRANT USAGE ON SEQUENCE user_security_settings_id_seq TO marketbot_backend;

-- Permissões para views
GRANT SELECT ON two_factor_stats TO marketbot_backend;
GRANT SELECT ON suspicious_login_attempts TO marketbot_backend;
GRANT SELECT ON recent_security_events TO marketbot_backend;
GRANT SELECT ON users_without_2fa TO marketbot_backend;

-- ========================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE user_2fa IS 'Configurações de autenticação de dois fatores por usuário';
COMMENT ON TABLE login_attempts IS 'Log de todas as tentativas de login para controle de segurança';
COMMENT ON TABLE security_events IS 'Auditoria de eventos de segurança do sistema';
COMMENT ON TABLE trusted_devices IS 'Dispositivos marcados como confiáveis pelos usuários';
COMMENT ON TABLE user_security_settings IS 'Configurações personalizadas de segurança por usuário';

COMMENT ON COLUMN user_2fa.secret_key IS 'Chave secreta para geração de tokens TOTP';
COMMENT ON COLUMN user_2fa.backup_codes IS 'Array JSON com códigos de backup hasheados';
COMMENT ON COLUMN user_2fa.is_enabled IS 'Indica se 2FA está ativo e funcional';
COMMENT ON COLUMN user_2fa.setup_completed IS 'Indica se o usuário completou o setup inicial';

COMMENT ON COLUMN login_attempts.attempt_type IS 'Tipo da tentativa: PASSWORD, 2FA ou BACKUP_CODE';
COMMENT ON COLUMN login_attempts.device_fingerprint IS 'Impressão digital do dispositivo para identificação';

COMMENT ON COLUMN security_events.event_type IS 'Tipo de evento de segurança para categorização';
COMMENT ON COLUMN security_events.metadata IS 'Dados adicionais do evento em formato JSON';

-- Inserir log de migração
INSERT INTO migration_log (version, description, executed_at) 
VALUES ('011', 'Sistema 2FA enterprise obrigatório com controle de segurança completo', NOW());

-- ========================================
-- SUCESSO!
-- ========================================

SELECT 'Two Factor Authentication system migration completed successfully!' as status;
