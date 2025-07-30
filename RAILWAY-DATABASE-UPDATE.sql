-- APLICAR ESTE SQL NO RAILWAY DATABASE
-- Copie e cole no Railway Console > Database > Query

-- Verificar se as tabelas já existem
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('phone_verifications', 'password_recovery_sms', 'users')
ORDER BY table_name, ordinal_position;

-- Se não existirem, aplicar as criações:

-- Tabela para códigos de verificação de telefone (cadastro)
CREATE TABLE IF NOT EXISTS phone_verifications (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0
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
    attempts INTEGER DEFAULT 0
);

-- Adicionar campos na tabela users se não existirem
DO $$ 
BEGIN
    -- Verificar e adicionar phone_verified
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Campo phone_verified adicionado';
    ELSE
        RAISE NOTICE 'Campo phone_verified já existe';
    END IF;
    
    -- Verificar e adicionar user_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'user_type'
    ) THEN
        ALTER TABLE users ADD COLUMN user_type VARCHAR(20) DEFAULT 'individual';
        RAISE NOTICE 'Campo user_type adicionado';
    ELSE
        RAISE NOTICE 'Campo user_type já existe';
    END IF;
    
    -- Verificar campo phone (pode ser whatsapp renomeado)
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
            RAISE NOTICE 'Campo whatsapp renomeado para phone';
        ELSE
            -- Se não existe nenhum, criar phone
            ALTER TABLE users ADD COLUMN phone VARCHAR(20);
            RAISE NOTICE 'Campo phone criado';
        END IF;
    ELSE
        RAISE NOTICE 'Campo phone já existe';
    END IF;
END
$$;

-- Criar índices únicos para performance e segurança
CREATE UNIQUE INDEX IF NOT EXISTS idx_phone_verifications_active 
ON phone_verifications (phone) 
WHERE used = FALSE AND expires_at > CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_password_recovery_active 
ON password_recovery_sms (phone) 
WHERE used = FALSE AND expires_at > CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique 
ON users (phone) 
WHERE phone IS NOT NULL AND phone != '';

-- Verificar estrutura final
SELECT 
  'users' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users'
  AND column_name IN ('phone', 'phone_verified', 'user_type')
ORDER BY column_name;

-- Verificar tabelas SMS criadas
SELECT 
  table_name,
  count(*) as total_columns
FROM information_schema.columns 
WHERE table_name IN ('phone_verifications', 'password_recovery_sms')
GROUP BY table_name;
