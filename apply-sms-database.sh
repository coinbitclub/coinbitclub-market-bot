#!/bin/bash

# Script para aplicar as atualizações do banco de dados para SMS
# Execute este script no Railway ou em seu ambiente de produção

echo "🔧 Aplicando atualizações do banco de dados para sistema SMS..."

# Verificar se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Erro: DATABASE_URL não está configurada"
    exit 1
fi

# Executar script SQL
psql $DATABASE_URL << 'EOF'
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
    -- Adicionar campo phone_verified se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Adicionar campo user_type se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'user_type'
    ) THEN
        ALTER TABLE users ADD COLUMN user_type VARCHAR(20) DEFAULT 'individual';
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

EOF

echo "✅ Atualizações do banco de dados aplicadas com sucesso!"
echo "📱 Sistema SMS está pronto para uso!"
