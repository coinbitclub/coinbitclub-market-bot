-- ========================================
-- MIGRAÇÃO 003: TABELAS SECURITY SYSTEM
-- CoinbitClub Corporate Security System
-- ========================================

-- Tabela de logs de segurança
CREATE TABLE IF NOT EXISTS security_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path TEXT,
    response_status INTEGER,
    threat_level VARCHAR(20) DEFAULT 'LOW',
    blocked BOOLEAN DEFAULT false,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de validações de IP
CREATE TABLE IF NOT EXISTS ip_validations (
    id SERIAL PRIMARY KEY,
    ip_address INET NOT NULL,
    ip_type VARCHAR(20) NOT NULL, -- 'RAILWAY_FIXED', 'ALLOWED', 'BLOCKED'
    validation_result VARCHAR(20) NOT NULL,
    geo_location JSONB,
    validation_details JSONB,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 1,
    blocked_count INTEGER DEFAULT 0
);

-- Tabela de sessões ativas
CREATE TABLE IF NOT EXISTS active_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(100),
    ip_address INET NOT NULL,
    jwt_token_hash VARCHAR(255),
    device_info JSONB,
    location_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- Tabela de tentativas de autenticação
CREATE TABLE IF NOT EXISTS auth_attempts (
    id SERIAL PRIMARY KEY,
    ip_address INET NOT NULL,
    username VARCHAR(100),
    auth_method VARCHAR(50),
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    user_agent TEXT,
    request_headers JSONB,
    rate_limit_exceeded BOOLEAN DEFAULT false,
    blocked BOOLEAN DEFAULT false,
    attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de atividades suspeitas
CREATE TABLE IF NOT EXISTS suspicious_activities (
    id SERIAL PRIMARY KEY,
    activity_type VARCHAR(50) NOT NULL,
    ip_address INET NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    description TEXT NOT NULL,
    evidence JSONB,
    automated_response VARCHAR(100),
    investigation_status VARCHAR(20) DEFAULT 'PENDING',
    investigated_by VARCHAR(100),
    investigation_notes TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Tabela de integridade de arquivos
CREATE TABLE IF NOT EXISTS file_integrity_checks (
    id SERIAL PRIMARY KEY,
    file_path TEXT NOT NULL,
    file_hash VARCHAR(255) NOT NULL,
    expected_hash VARCHAR(255),
    integrity_status VARCHAR(20) NOT NULL, -- 'VALID', 'MODIFIED', 'CORRUPTED'
    file_size BIGINT,
    check_type VARCHAR(30) NOT NULL, -- 'SCHEDULED', 'MANUAL', 'TRIGGERED'
    detected_changes JSONB,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reported_at TIMESTAMP
);

-- Tabela de configurações de segurança
CREATE TABLE IF NOT EXISTS security_settings (
    id SERIAL PRIMARY KEY,
    setting_name VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(30) NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_security_logs_created ON security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_threat ON security_logs(ip_address, threat_level);
CREATE INDEX IF NOT EXISTS idx_security_logs_blocked ON security_logs(blocked, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ip_validations_ip ON ip_validations(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_validations_type ON ip_validations(ip_type, validation_result);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires ON active_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip_time ON auth_attempts(ip_address, attempt_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_success ON auth_attempts(success, attempt_at DESC);
CREATE INDEX IF NOT EXISTS idx_suspicious_severity ON suspicious_activities(severity, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_suspicious_status ON suspicious_activities(investigation_status);
CREATE INDEX IF NOT EXISTS idx_file_integrity_status ON file_integrity_checks(integrity_status, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_integrity_path ON file_integrity_checks(file_path);

-- Índices compostos para consultas específicas
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_time ON security_logs(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip_success_time ON auth_attempts(ip_address, success, attempt_at DESC);

-- Inserir configuração padrão do IP fixo Railway
INSERT INTO security_settings (setting_name, setting_value, setting_type, description, is_sensitive)
VALUES 
    ('RAILWAY_FIXED_IP', '132.255.160.140', 'IP_ADDRESS', 'IP fixo do Railway para validação', false),
    ('JWT_SECRET_KEY', 'coinbitclub_secure_key_2025', 'SECRET', 'Chave secreta para JWT', true),
    ('RATE_LIMIT_WINDOW', '900', 'INTEGER', 'Janela de rate limit em segundos (15 min)', false),
    ('RATE_LIMIT_MAX_REQUESTS', '100', 'INTEGER', 'Máximo de requisições por janela', false),
    ('SESSION_EXPIRY_HOURS', '24', 'INTEGER', 'Expiração da sessão em horas', false),
    ('AUTO_BLOCK_THRESHOLD', '10', 'INTEGER', 'Tentativas falhas antes do bloqueio automático', false)
ON CONFLICT (setting_name) DO NOTHING;

-- Comentários das tabelas
COMMENT ON TABLE security_logs IS 'Logs de eventos de segurança do sistema';
COMMENT ON TABLE ip_validations IS 'Validações e controle de acesso por IP';
COMMENT ON TABLE active_sessions IS 'Sessões ativas de usuários autenticados';
COMMENT ON TABLE auth_attempts IS 'Tentativas de autenticação no sistema';
COMMENT ON TABLE suspicious_activities IS 'Atividades suspeitas detectadas automaticamente';
COMMENT ON TABLE file_integrity_checks IS 'Verificações de integridade de arquivos críticos';
COMMENT ON TABLE security_settings IS 'Configurações do sistema de segurança';

-- Comentários das colunas principais
COMMENT ON COLUMN security_logs.threat_level IS 'Nível de ameaça: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN ip_validations.ip_type IS 'Tipo de IP: RAILWAY_FIXED, ALLOWED, BLOCKED';
COMMENT ON COLUMN active_sessions.jwt_token_hash IS 'Hash do token JWT para validação';
COMMENT ON COLUMN auth_attempts.rate_limit_exceeded IS 'Indica se o rate limit foi excedido';
COMMENT ON COLUMN suspicious_activities.automated_response IS 'Resposta automática executada pelo sistema';
COMMENT ON COLUMN file_integrity_checks.integrity_status IS 'Status: VALID, MODIFIED, CORRUPTED';
