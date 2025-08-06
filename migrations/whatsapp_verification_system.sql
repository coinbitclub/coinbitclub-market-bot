-- 🚀 MIGRAÇÃO: Sistema de Validação WhatsApp e Reset de Senha
-- Data: 26 de Janeiro de 2025
-- Responsável: Sistema CoinBitClub
-- Objetivo: Implementar validação obrigatória por WhatsApp e reset manual

-- ===== STEP 1: ADICIONAR COLUNAS DE VERIFICAÇÃO WhatsApp =====

-- Adicionar colunas na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS whatsapp_verification_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS whatsapp_verification_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS whatsapp_verification_attempts INTEGER DEFAULT 0;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON users(whatsapp);
CREATE INDEX IF NOT EXISTS idx_users_whatsapp_verified ON users(whatsapp_verified);
CREATE INDEX IF NOT EXISTS idx_users_whatsapp_code ON users(whatsapp_verification_code);

-- ===== STEP 2: TABELA DE LOGS DE VERIFICAÇÃO WhatsApp =====

CREATE TABLE IF NOT EXISTS whatsapp_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    whatsapp_number VARCHAR(20) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired', 'failed')),
    attempts INTEGER DEFAULT 0,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    verified_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    message_sent BOOLEAN DEFAULT FALSE,
    message_id VARCHAR(100),
    error_message TEXT
);

-- Índices para logs de verificação
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_user_id ON whatsapp_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status ON whatsapp_verification_logs(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_code ON whatsapp_verification_logs(verification_code);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_expires ON whatsapp_verification_logs(expires_at);

-- ===== STEP 3: TABELA DE RESET DE SENHA POR WhatsApp =====

CREATE TABLE IF NOT EXISTS password_reset_whatsapp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    whatsapp_number VARCHAR(20) NOT NULL,
    reset_code VARCHAR(6) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    used_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    admin_reset BOOLEAN DEFAULT FALSE,
    admin_user_id UUID REFERENCES users(id),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3
);

-- Índices para reset de senha
CREATE INDEX IF NOT EXISTS idx_reset_whatsapp_user_id ON password_reset_whatsapp(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_whatsapp_code ON password_reset_whatsapp(reset_code);
CREATE INDEX IF NOT EXISTS idx_reset_whatsapp_status ON password_reset_whatsapp(status);
CREATE INDEX IF NOT EXISTS idx_reset_whatsapp_expires ON password_reset_whatsapp(expires_at);

-- ===== STEP 4: CONFIGURAÇÕES DE WhatsApp =====

CREATE TABLE IF NOT EXISTS whatsapp_api_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(50) NOT NULL,
    api_key_encrypted TEXT,
    api_url TEXT,
    webhook_token VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    rate_limit_per_minute INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    config_data JSONB
);

-- Inserir configuração padrão do WhatsApp API
INSERT INTO whatsapp_api_config (service_name, api_url, rate_limit_per_minute, config_data)
VALUES (
    'default_whatsapp_service',
    'https://api.whatsapp.business/v1/messages',
    10,
    '{
        "template_verification": "Seu código de verificação CoinBitClub: {{code}}. Válido por 10 minutos. Não compartilhe!",
        "template_reset": "Código para reset de senha CoinBitClub: {{code}}. Válido por 10 minutos. Use apenas se solicitou.",
        "sender_name": "CoinBitClub",
        "country_code": "+55"
    }'::jsonb
) ON CONFLICT DO NOTHING;

-- ===== STEP 5: FUNÇÕES DE VALIDAÇÃO =====

-- Função para gerar código de verificação
CREATE OR REPLACE FUNCTION generate_whatsapp_verification_code()
RETURNS VARCHAR(6) AS $$
BEGIN
    -- Gera código de 6 dígitos
    RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Função para validar formato de WhatsApp
CREATE OR REPLACE FUNCTION validate_whatsapp_format(whatsapp_number VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    -- Formato brasileiro: +5511999999999 ou 11999999999
    IF whatsapp_number ~ '^(\+55)?[1-9][1-9][0-9]{8,9}$' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Função para normalizar número WhatsApp
CREATE OR REPLACE FUNCTION normalize_whatsapp_number(whatsapp_number VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    -- Remove todos os caracteres não numéricos
    whatsapp_number := REGEXP_REPLACE(whatsapp_number, '[^0-9]', '', 'g');
    
    -- Adiciona código do país se não tiver
    IF LENGTH(whatsapp_number) = 11 AND whatsapp_number ~ '^[1-9][1-9][0-9]{9}$' THEN
        whatsapp_number := '55' || whatsapp_number;
    END IF;
    
    -- Adiciona + se não tiver
    IF NOT whatsapp_number ~ '^\+' THEN
        whatsapp_number := '+' || whatsapp_number;
    END IF;
    
    RETURN whatsapp_number;
END;
$$ LANGUAGE plpgsql;

-- ===== STEP 6: FUNÇÕES DE VERIFICAÇÃO =====

-- Função para iniciar verificação WhatsApp
CREATE OR REPLACE FUNCTION start_whatsapp_verification(
    p_user_id UUID,
    p_whatsapp_number VARCHAR,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_code VARCHAR(6);
    v_normalized_whatsapp VARCHAR(20);
    v_existing_active INTEGER;
    v_log_id UUID;
    v_expires_at TIMESTAMP;
BEGIN
    -- Normalizar número
    v_normalized_whatsapp := normalize_whatsapp_number(p_whatsapp_number);
    
    -- Validar formato
    IF NOT validate_whatsapp_format(v_normalized_whatsapp) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Formato de WhatsApp inválido',
            'code', 'INVALID_FORMAT'
        );
    END IF;
    
    -- Verificar se já existe verificação ativa (últimos 10 minutos)
    SELECT COUNT(*) INTO v_existing_active
    FROM whatsapp_verification_logs
    WHERE user_id = p_user_id 
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF v_existing_active > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Já existe uma verificação pendente. Aguarde alguns minutos.',
            'code', 'VERIFICATION_PENDING'
        );
    END IF;
    
    -- Gerar código
    v_code := generate_whatsapp_verification_code();
    v_expires_at := NOW() + INTERVAL '10 minutes';
    
    -- Inserir log de verificação
    INSERT INTO whatsapp_verification_logs (
        user_id, whatsapp_number, verification_code, expires_at,
        ip_address, user_agent
    ) VALUES (
        p_user_id, v_normalized_whatsapp, v_code, v_expires_at,
        p_ip_address, p_user_agent
    ) RETURNING id INTO v_log_id;
    
    -- Atualizar usuário
    UPDATE users 
    SET whatsapp = v_normalized_whatsapp,
        whatsapp_verification_code = v_code,
        whatsapp_verification_expires = v_expires_at,
        whatsapp_verification_attempts = 0
    WHERE id = p_user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Código de verificação enviado para WhatsApp',
        'whatsapp_number', v_normalized_whatsapp,
        'expires_in_minutes', 10,
        'log_id', v_log_id,
        'code', v_code -- REMOVER EM PRODUÇÃO
    );
END;
$$ LANGUAGE plpgsql;

-- Função para verificar código WhatsApp
CREATE OR REPLACE FUNCTION verify_whatsapp_code(
    p_user_id UUID,
    p_verification_code VARCHAR(6)
)
RETURNS JSON AS $$
DECLARE
    v_user_record RECORD;
    v_log_id UUID;
BEGIN
    -- Buscar usuário
    SELECT * INTO v_user_record
    FROM users
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado',
            'code', 'USER_NOT_FOUND'
        );
    END IF;
    
    -- Verificar se código existe e não expirou
    IF v_user_record.whatsapp_verification_code IS NULL OR 
       v_user_record.whatsapp_verification_expires IS NULL OR
       v_user_record.whatsapp_verification_expires < NOW() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Código expirado ou inválido',
            'code', 'CODE_EXPIRED'
        );
    END IF;
    
    -- Verificar tentativas
    IF v_user_record.whatsapp_verification_attempts >= 3 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Muitas tentativas. Solicite novo código.',
            'code', 'TOO_MANY_ATTEMPTS'
        );
    END IF;
    
    -- Verificar código
    IF v_user_record.whatsapp_verification_code != p_verification_code THEN
        -- Incrementar tentativas
        UPDATE users 
        SET whatsapp_verification_attempts = whatsapp_verification_attempts + 1
        WHERE id = p_user_id;
        
        RETURN json_build_object(
            'success', false,
            'error', 'Código incorreto',
            'code', 'INVALID_CODE',
            'attempts_remaining', 3 - (v_user_record.whatsapp_verification_attempts + 1)
        );
    END IF;
    
    -- Código correto - verificar WhatsApp
    UPDATE users 
    SET whatsapp_verified = true,
        whatsapp_verification_code = NULL,
        whatsapp_verification_expires = NULL,
        whatsapp_verification_attempts = 0
    WHERE id = p_user_id;
    
    -- Atualizar log
    UPDATE whatsapp_verification_logs
    SET status = 'verified',
        verified_at = NOW()
    WHERE user_id = p_user_id 
    AND verification_code = p_verification_code
    AND status = 'pending';
    
    RETURN json_build_object(
        'success', true,
        'message', 'WhatsApp verificado com sucesso!',
        'verified_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- ===== STEP 7: FUNÇÕES DE RESET DE SENHA =====

-- Função para iniciar reset de senha via WhatsApp
CREATE OR REPLACE FUNCTION start_password_reset_whatsapp(
    p_email VARCHAR,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_user_record RECORD;
    v_reset_code VARCHAR(6);
    v_expires_at TIMESTAMP;
    v_reset_id UUID;
    v_existing_active INTEGER;
BEGIN
    -- Buscar usuário por email
    SELECT * INTO v_user_record
    FROM users
    WHERE email = LOWER(TRIM(p_email))
    AND is_active = true;
    
    IF NOT FOUND THEN
        -- Por segurança, não revelar se email existe
        RETURN json_build_object(
            'success', true,
            'message', 'Se uma conta com este email existir e tiver WhatsApp verificado, um código foi enviado.',
            'code', 'EMAIL_CHECK'
        );
    END IF;
    
    -- Verificar se WhatsApp está verificado
    IF NOT v_user_record.whatsapp_verified OR v_user_record.whatsapp IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'WhatsApp não verificado. Entre em contato com suporte.',
            'code', 'WHATSAPP_NOT_VERIFIED'
        );
    END IF;
    
    -- Verificar se já existe reset ativo
    SELECT COUNT(*) INTO v_existing_active
    FROM password_reset_whatsapp
    WHERE user_id = v_user_record.id 
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF v_existing_active > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Já existe um reset pendente. Aguarde alguns minutos.',
            'code', 'RESET_PENDING'
        );
    END IF;
    
    -- Gerar código de reset
    v_reset_code := generate_whatsapp_verification_code();
    v_expires_at := NOW() + INTERVAL '10 minutes';
    
    -- Inserir solicitação de reset
    INSERT INTO password_reset_whatsapp (
        user_id, whatsapp_number, reset_code, expires_at,
        ip_address, user_agent
    ) VALUES (
        v_user_record.id, v_user_record.whatsapp, v_reset_code, v_expires_at,
        p_ip_address, p_user_agent
    ) RETURNING id INTO v_reset_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Código de reset enviado para seu WhatsApp',
        'whatsapp_masked', SUBSTRING(v_user_record.whatsapp FROM 1 FOR 8) || '****',
        'expires_in_minutes', 10,
        'reset_id', v_reset_id,
        'code', v_reset_code -- REMOVER EM PRODUÇÃO
    );
END;
$$ LANGUAGE plpgsql;

-- Função para confirmar reset de senha
CREATE OR REPLACE FUNCTION confirm_password_reset_whatsapp(
    p_reset_code VARCHAR(6),
    p_new_password TEXT
)
RETURNS JSON AS $$
DECLARE
    v_reset_record RECORD;
    v_user_id UUID;
    v_hashed_password TEXT;
BEGIN
    -- Buscar reset ativo
    SELECT * INTO v_reset_record
    FROM password_reset_whatsapp
    WHERE reset_code = p_reset_code
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Código inválido ou expirado',
            'code', 'INVALID_RESET_CODE'
        );
    END IF;
    
    -- Verificar tentativas
    IF v_reset_record.attempts >= v_reset_record.max_attempts THEN
        UPDATE password_reset_whatsapp
        SET status = 'expired'
        WHERE id = v_reset_record.id;
        
        RETURN json_build_object(
            'success', false,
            'error', 'Muitas tentativas. Solicite novo código.',
            'code', 'TOO_MANY_ATTEMPTS'
        );
    END IF;
    
    v_user_id := v_reset_record.user_id;
    
    -- Hash da nova senha (será feito pelo backend)
    -- Por segurança, a senha já deve vir hasheada do backend
    v_hashed_password := p_new_password;
    
    -- Atualizar senha do usuário
    UPDATE users
    SET password = v_hashed_password,
        password_reset_token = NULL,
        password_reset_expires = NULL,
        updated_at = NOW()
    WHERE id = v_user_id;
    
    -- Marcar reset como usado
    UPDATE password_reset_whatsapp
    SET status = 'used',
        used_at = NOW()
    WHERE id = v_reset_record.id;
    
    -- Invalidar outros resets pendentes deste usuário
    UPDATE password_reset_whatsapp
    SET status = 'cancelled'
    WHERE user_id = v_user_id
    AND status = 'pending'
    AND id != v_reset_record.id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Senha alterada com sucesso!',
        'user_id', v_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- ===== STEP 8: FUNÇÃO DE RESET MANUAL (ADMIN) =====

CREATE OR REPLACE FUNCTION admin_reset_user_password(
    p_admin_user_id UUID,
    p_target_user_id UUID,
    p_new_password TEXT,
    p_reason TEXT DEFAULT 'Reset manual pelo admin'
)
RETURNS JSON AS $$
DECLARE
    v_admin_record RECORD;
    v_target_user RECORD;
    v_hashed_password TEXT;
BEGIN
    -- Verificar se admin existe e tem permissão
    SELECT * INTO v_admin_record
    FROM users
    WHERE id = p_admin_user_id
    AND role IN ('admin', 'super_admin')
    AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Admin não encontrado ou sem permissão',
            'code', 'ADMIN_NOT_AUTHORIZED'
        );
    END IF;
    
    -- Verificar se usuário alvo existe
    SELECT * INTO v_target_user
    FROM users
    WHERE id = p_target_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado',
            'code', 'USER_NOT_FOUND'
        );
    END IF;
    
    -- A senha já deve vir hasheada do backend
    v_hashed_password := p_new_password;
    
    -- Atualizar senha
    UPDATE users
    SET password = v_hashed_password,
        password_reset_token = NULL,
        password_reset_expires = NULL,
        updated_at = NOW()
    WHERE id = p_target_user_id;
    
    -- Log da ação administrativa
    INSERT INTO system_logs (level, service, message, details, user_id, ip_address)
    VALUES (
        'WARNING',
        'Admin-Password-Reset',
        'Admin reset user password',
        json_build_object(
            'admin_id', p_admin_user_id,
            'admin_email', v_admin_record.email,
            'target_user_id', p_target_user_id,
            'target_email', v_target_user.email,
            'reason', p_reason
        ),
        p_admin_user_id,
        NULL
    );
    
    -- Invalidar todos os resets WhatsApp pendentes
    UPDATE password_reset_whatsapp
    SET status = 'cancelled',
        admin_reset = true,
        admin_user_id = p_admin_user_id
    WHERE user_id = p_target_user_id
    AND status = 'pending';
    
    RETURN json_build_object(
        'success', true,
        'message', 'Senha do usuário resetada com sucesso pelo admin',
        'admin_id', p_admin_user_id,
        'target_user_id', p_target_user_id,
        'reset_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- ===== STEP 9: TRIGGERS E CONSTRAINTS =====

-- Trigger para validar WhatsApp antes de inserir/atualizar
CREATE OR REPLACE FUNCTION validate_whatsapp_before_save()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.whatsapp IS NOT NULL THEN
        IF NOT validate_whatsapp_format(NEW.whatsapp) THEN
            RAISE EXCEPTION 'Formato de WhatsApp inválido: %', NEW.whatsapp;
        END IF;
        
        -- Normalizar automaticamente
        NEW.whatsapp := normalize_whatsapp_number(NEW.whatsapp);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela users
DROP TRIGGER IF EXISTS validate_whatsapp_trigger ON users;
CREATE TRIGGER validate_whatsapp_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION validate_whatsapp_before_save();

-- ===== STEP 10: POLICIES E CONSTRAINTS =====

-- Constraint para garantir WhatsApp único
ALTER TABLE users 
ADD CONSTRAINT unique_whatsapp_when_not_null 
UNIQUE (whatsapp) DEFERRABLE INITIALLY DEFERRED;

-- Constraint para garantir que WhatsApp verificado tenha número
ALTER TABLE users 
ADD CONSTRAINT whatsapp_verified_requires_number 
CHECK (
    (whatsapp_verified = false) OR 
    (whatsapp_verified = true AND whatsapp IS NOT NULL)
);

-- ===== STEP 11: INSERIR CONFIGURAÇÕES INICIAIS =====

-- Atualizar configurações de sistema
INSERT INTO api_configurations (
    service_name, service_type, base_url, 
    is_active, rate_limit_per_minute, timeout_seconds,
    service_config
) VALUES (
    'whatsapp_verification_service',
    'messaging',
    'https://api.whatsapp.business/v1/messages',
    true,
    10,
    30,
    '{
        "verification_template": "🔐 CoinBitClub - Código de verificação: {{code}}\n\nVálido por 10 minutos.\nNão compartilhe este código!",
        "reset_template": "🔑 CoinBitClub - Código para redefinir senha: {{code}}\n\nVálido por 10 minutos.\nUse apenas se você solicitou!",
        "sender_name": "CoinBitClub Bot",
        "country_code": "+55"
    }'::jsonb
) ON CONFLICT (service_name) DO NOTHING;

-- ===== STEP 12: VIEWS PARA RELATÓRIOS =====

-- View para relatórios de verificação WhatsApp
CREATE OR REPLACE VIEW vw_whatsapp_verification_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as verification_date,
    COUNT(*) as total_verifications,
    COUNT(CASE WHEN status = 'verified' THEN 1 END) as successful_verifications,
    COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_verifications,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_verifications,
    ROUND(
        COUNT(CASE WHEN status = 'verified' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as success_rate_pct
FROM whatsapp_verification_logs
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY verification_date DESC;

-- View para relatórios de reset de senha
CREATE OR REPLACE VIEW vw_password_reset_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as reset_date,
    COUNT(*) as total_resets,
    COUNT(CASE WHEN status = 'used' THEN 1 END) as successful_resets,
    COUNT(CASE WHEN admin_reset = true THEN 1 END) as admin_resets,
    COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_resets,
    ROUND(
        COUNT(CASE WHEN status = 'used' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as success_rate_pct
FROM password_reset_whatsapp
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY reset_date DESC;

-- ===== STEP 13: LIMPEZA AUTOMÁTICA =====

-- Função para limpeza de códigos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    -- Marcar códigos expirados como expired
    UPDATE whatsapp_verification_logs
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    -- Limpar códigos de verificação expirados dos usuários
    UPDATE users
    SET whatsapp_verification_code = NULL,
        whatsapp_verification_expires = NULL
    WHERE whatsapp_verification_expires < NOW();
    
    -- Marcar resets expirados
    UPDATE password_reset_whatsapp
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- ===== STEP 14: COMENTÁRIOS E DOCUMENTAÇÃO =====

COMMENT ON TABLE whatsapp_verification_logs IS 'Logs de verificação de WhatsApp para auditoria e controle';
COMMENT ON TABLE password_reset_whatsapp IS 'Solicitações de reset de senha via WhatsApp';
COMMENT ON TABLE whatsapp_api_config IS 'Configurações da API do WhatsApp';

COMMENT ON FUNCTION start_whatsapp_verification IS 'Inicia processo de verificação do WhatsApp do usuário';
COMMENT ON FUNCTION verify_whatsapp_code IS 'Verifica código de verificação do WhatsApp';
COMMENT ON FUNCTION start_password_reset_whatsapp IS 'Inicia reset de senha via WhatsApp';
COMMENT ON FUNCTION confirm_password_reset_whatsapp IS 'Confirma reset de senha com código WhatsApp';
COMMENT ON FUNCTION admin_reset_user_password IS 'Permite admin resetar senha de usuário manualmente';

-- ===== STEP 15: LOGS DE MIGRAÇÃO =====

INSERT INTO system_logs (level, service, message, details)
VALUES (
    'INFO',
    'Database-Migration',
    'WhatsApp verification system migration completed',
    json_build_object(
        'migration_version', 'v2.1.0',
        'features_added', ARRAY[
            'whatsapp_verification',
            'whatsapp_password_reset', 
            'admin_manual_reset',
            'verification_logs',
            'automatic_cleanup'
        ],
        'tables_created', ARRAY[
            'whatsapp_verification_logs',
            'password_reset_whatsapp', 
            'whatsapp_api_config'
        ],
        'functions_created', ARRAY[
            'start_whatsapp_verification',
            'verify_whatsapp_code',
            'start_password_reset_whatsapp',
            'confirm_password_reset_whatsapp',
            'admin_reset_user_password'
        ]
    )
);

-- ===== FINALIZAÇÃO =====

-- Mostrar estatísticas finais
SELECT 
    'WhatsApp Verification Migration' as migration_name,
    '✅ COMPLETED' as status,
    NOW() as completed_at,
    (
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_name IN (
            'whatsapp_verification_logs',
            'password_reset_whatsapp',
            'whatsapp_api_config'
        )
    ) as tables_created,
    (
        SELECT COUNT(*) 
        FROM information_schema.routines 
        WHERE routine_name LIKE '%whatsapp%' 
        OR routine_name LIKE '%password_reset%'
    ) as functions_created;
