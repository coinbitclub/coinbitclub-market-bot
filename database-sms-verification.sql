-- Script para adicionar verificação SMS ao sistema de autenticação

-- Tabela para códigos de verificação de telefone (cadastro)
CREATE TABLE IF NOT EXISTS phone_verifications (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    
    -- Índices para performance
    INDEX idx_phone_verification_phone (phone),
    INDEX idx_phone_verification_code (code),
    INDEX idx_phone_verification_created (created_at),
    
    -- Limitar tentativas por telefone
    CONSTRAINT check_phone_format CHECK (phone ~ '^[0-9]{10,15}$')
);

-- Tabela para códigos de recuperação de senha via SMS
CREATE TABLE IF NOT EXISTS password_recovery_sms (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    
    -- Índices para performance
    INDEX idx_password_recovery_phone (phone),
    INDEX idx_password_recovery_user (user_id),
    INDEX idx_password_recovery_code (code),
    INDEX idx_password_recovery_created (created_at),
    
    -- Limitar tentativas por telefone
    CONSTRAINT check_recovery_phone_format CHECK (phone ~ '^[0-9]{10,15}$')
);

-- Adicionar campo de telefone verificado na tabela users se não existir
DO $$ 
BEGIN
    -- Adicionar campo phone_verified se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Adicionar campo phone se não existir (renomear whatsapp para phone se necessário)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone'
    ) THEN
        -- Se existe whatsapp, renomear para phone
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'whatsapp'
        ) THEN
            ALTER TABLE users RENAME COLUMN whatsapp TO phone;
        ELSE
            -- Se não existe, criar campo phone
            ALTER TABLE users ADD COLUMN phone VARCHAR(20);
        END IF;
    END IF;
    
    -- Adicionar campo created_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Adicionar campo updated_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END
$$;

-- Função para limpeza automática de códigos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS void AS $$
BEGIN
    -- Limpar códigos de verificação de telefone expirados (mais de 1 hora)
    DELETE FROM phone_verifications 
    WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '1 hour';
    
    -- Limpar códigos de recuperação de senha expirados (mais de 1 hora)
    DELETE FROM password_recovery_sms 
    WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Criar índices únicos para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_phone_verifications_active 
ON phone_verifications (phone) 
WHERE used = FALSE AND expires_at > CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_password_recovery_active 
ON password_recovery_sms (phone) 
WHERE used = FALSE AND expires_at > CURRENT_TIMESTAMP;

-- Criar índice único para telefones na tabela users
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique 
ON users (phone) 
WHERE phone IS NOT NULL AND phone != '';

-- Atualizar trigger para updated_at na tabela users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_users_updated_at'
    ) THEN
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Comentários nas tabelas
COMMENT ON TABLE phone_verifications IS 'Armazena códigos de verificação SMS para cadastro de novos usuários';
COMMENT ON TABLE password_recovery_sms IS 'Armazena códigos de recuperação de senha via SMS';

COMMENT ON COLUMN phone_verifications.phone IS 'Número de telefone no formato internacional sem símbolos';
COMMENT ON COLUMN phone_verifications.code IS 'Código de 6 dígitos enviado por SMS';
COMMENT ON COLUMN phone_verifications.expires_at IS 'Data/hora de expiração do código (15 minutos)';
COMMENT ON COLUMN phone_verifications.attempts IS 'Número de tentativas de verificação';

COMMENT ON COLUMN password_recovery_sms.phone IS 'Número de telefone no formato internacional sem símbolos';
COMMENT ON COLUMN password_recovery_sms.code IS 'Código de 6 dígitos enviado por SMS';
COMMENT ON COLUMN password_recovery_sms.expires_at IS 'Data/hora de expiração do código (15 minutos)';
COMMENT ON COLUMN password_recovery_sms.attempts IS 'Número de tentativas de verificação';

-- Verificar estrutura final
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('users', 'phone_verifications', 'password_recovery_sms')
ORDER BY table_name, ordinal_position;
