-- ========================================
-- MARKETBOT - ADD ROLE COLUMN TO USERS
-- Migration: Adicionar coluna role na tabela users
-- ========================================

BEGIN;

-- Adicionar coluna role se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
        UPDATE users SET role = 'user' WHERE role IS NULL;
        
        -- Criar índice
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        
        RAISE NOTICE 'Coluna role adicionada à tabela users';
    ELSE
        RAISE NOTICE 'Coluna role já existe na tabela users';
    END IF;
END $$;

-- Adicionar outras colunas necessárias se não existirem
DO $$
BEGIN
    -- Coluna email_verified
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
        UPDATE users SET email_verified = true WHERE email_verified IS NULL;
        RAISE NOTICE 'Coluna email_verified adicionada';
    END IF;
    
    -- Coluna status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'status'
    ) THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        UPDATE users SET status = 'active' WHERE status IS NULL;
        RAISE NOTICE 'Coluna status adicionada';
    END IF;
END $$;

COMMIT;
