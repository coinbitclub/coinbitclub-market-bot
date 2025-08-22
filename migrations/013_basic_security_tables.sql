-- ========================================
-- MARKETBOT - TABELAS DE SEGURANÇA BÁSICAS
-- Migration: Criar tabelas essenciais de segurança
-- ========================================

BEGIN;

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
    
    UNIQUE(device_fingerprint)
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

-- Tabela de rate limiting
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    limit_type VARCHAR(50) NOT NULL CHECK (limit_type IN ('IP', 'USER', 'ENDPOINT')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_blocked_until ON blocked_ips(blocked_until);
CREATE INDEX IF NOT EXISTS idx_blocked_devices_fingerprint ON blocked_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_ip ON suspicious_activities(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limit_tracking(identifier, limit_type, created_at);

-- Configurações padrão
INSERT INTO system_settings (key, value, description) VALUES
('max_login_attempts', '5', 'Máximo de tentativas de login antes do bloqueio'),
('lockout_duration_minutes', '60', 'Duração do bloqueio em minutos'),
('rate_limit_requests_per_minute', '60', 'Limite de requests por minuto por IP')
ON CONFLICT (key) DO NOTHING;

COMMIT;
